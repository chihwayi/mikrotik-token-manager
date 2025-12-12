import RouterOSAPI from 'node-routeros';
import pool from '../config/database.js';
import { decrypt } from '../utils/encryption.js';
import mikrotikConfig from '../config/mikrotik.js';
import Router from '../models/Router.js';

class MikroTikService {
  constructor() {
    this.connectionCache = new Map(); // Cache connections for reuse
  }

  /**
   * Get or create a connection to a MikroTik router
   * Includes automatic retry and connection caching
   */
  async getRouterConnection(routerId, useCache = true) {
    // Check cache first
    if (useCache && this.connectionCache.has(routerId)) {
      const cached = this.connectionCache.get(routerId);
      if (cached.connection && !cached.connection.closed) {
        return cached;
      }
      this.connectionCache.delete(routerId);
    }

    const router = await Router.findById(routerId);
    if (!router || !router.active) {
      throw new Error('Router not found or inactive');
    }

    // Decrypt password (handle both encrypted and plain text for migration)
    let password;
    try {
      // Try to decrypt - if it contains ':' it's likely encrypted format
      if (router.api_password_encrypted.includes(':')) {
        password = decrypt(router.api_password_encrypted);
      } else {
        // Plain text password
        password = router.api_password_encrypted;
      }
    } catch (error) {
      // If decryption fails, assume password is stored in plain text (for migration)
      password = router.api_password_encrypted;
    }

    // Create connection with retry logic
    let connection;
    let lastError;
    
    for (let attempt = 1; attempt <= mikrotikConfig.connectionRetries; attempt++) {
      try {
        connection = new RouterOSAPI({
          host: router.ip_address,
          user: router.api_username,
          password: password,
          port: router.api_port || mikrotikConfig.defaultPort,
          timeout: mikrotikConfig.defaultTimeout
        });

        await connection.connect();
        
        // Cache the connection
        const connectionData = { connection, router };
        this.connectionCache.set(routerId, connectionData);
        
        // Set up cleanup on disconnect
        connection.on('close', () => {
          this.connectionCache.delete(routerId);
        });

        return connectionData;
      } catch (error) {
        lastError = error;
        if (attempt < mikrotikConfig.connectionRetries) {
          await new Promise(resolve => setTimeout(resolve, mikrotikConfig.retryDelay * attempt));
        }
      }
    }

    throw new Error(`Failed to connect to router ${router.name}: ${lastError.message}`);
  }

  /**
   * Test router connectivity without caching
   */
  async testConnection(routerId) {
    const { connection } = await this.getRouterConnection(routerId, false);
    try {
      await connection.write(mikrotikConfig.paths.system.identity + '/print');
      return { success: true, message: 'Connection successful' };
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      connection.close();
    }
  }

  /**
   * Get router information (model, identity, etc.)
   */
  async getRouterInfo(routerId) {
    const { connection } = await this.getRouterConnection(routerId);
    
    try {
      const [identity, routerboard, resources] = await Promise.all([
        connection.write(mikrotikConfig.paths.system.identity + '/print').catch(() => []),
        connection.write(mikrotikConfig.paths.system.routerboard + '/print').catch(() => []),
        connection.write(mikrotikConfig.paths.system.resources + '/print').catch(() => [])
      ]);

      return {
        identity: identity[0]?.name || 'Unknown',
        model: routerboard[0]?.model || 'Unknown',
        serialNumber: routerboard[0]?.serial-number || 'N/A',
        firmware: routerboard[0]?.current-firmware || 'N/A',
        cpu: resources[0]?.cpu || 0,
        memory: resources[0]?.['free-memory'] || 0,
        uptime: resources[0]?.uptime || '0s'
      };
    } catch (error) {
      throw new Error(`Failed to get router info: ${error.message}`);
    }
  }

  /**
   * Add hotspot user (voucher) to router
   * Works with all RouterOS versions
   */
  async addHotspotUser(routerId, voucherCode, packageDetails) {
    const { connection, router } = await this.getRouterConnection(routerId);

    try {
      const limitUptime = `${packageDetails.duration_hours}h`;
      const limitBytes = packageDetails.data_limit_mb * 1024 * 1024;

      // Check if profile exists, create default if not
      const profiles = await connection.write(mikrotikConfig.paths.hotspot.profiles + '/print').catch(() => []);
      const defaultProfileExists = profiles.some(p => p.name === mikrotikConfig.defaultHotspotProfile);
      
      if (!defaultProfileExists) {
        // Create default profile
        await connection.write(mikrotikConfig.paths.hotspot.profiles + '/add', [
          `=name=${mikrotikConfig.defaultHotspotProfile}`,
          '=shared-users=1'
        ]).catch(() => {}); // Ignore if profile creation fails
      }

      // Add user with limits
      const userParams = [
        `=name=${voucherCode}`,
        `=password=${voucherCode}`,
        `=limit-uptime=${limitUptime}`,
        `=limit-bytes-total=${limitBytes}`,
        `=profile=${mikrotikConfig.defaultHotspotProfile}`
      ];

      await connection.write(mikrotikConfig.paths.hotspot.users + '/add', userParams);

      // Update last sync time
      await Router.updateLastSync(routerId);

      return { 
        success: true, 
        router: router.name,
        voucherCode,
        message: `Voucher ${voucherCode} added to ${router.name}`
      };
    } catch (error) {
      throw new Error(`Failed to add hotspot user: ${error.message}`);
    } finally {
      // Ensure connection is properly handled (connection cache will manage it)
      // Don't close here as it's cached for reuse
    }
  }

  /**
   * Remove hotspot user from router
   */
  async removeHotspotUser(routerId, voucherCode) {
    const { connection } = await this.getRouterConnection(routerId);

    try {
      // Find user by name
      const users = await connection.write(mikrotikConfig.paths.hotspot.users + '/print', [
        `?name=${voucherCode}`
      ]);

      if (users.length === 0) {
        return { success: false, message: 'User not found' };
      }

      // Remove user
      await connection.write(mikrotikConfig.paths.hotspot.users + '/remove', [
        `=.id=${users[0]['.id']}`
      ]);

      return { success: true, message: `User ${voucherCode} removed` };
    } catch (error) {
      throw new Error(`Failed to remove hotspot user: ${error.message}`);
    }
  }

  /**
   * Get active hotspot users
   */
  async getActiveUsers(routerId) {
    const { connection } = await this.getRouterConnection(routerId);

    try {
      const activeUsers = await connection.write(mikrotikConfig.paths.hotspot.active + '/print');
      return activeUsers.map(user => ({
        username: user.user,
        macAddress: user['mac-address'],
        ipAddress: user.address,
        uptime: user.uptime,
        bytesIn: parseInt(user['bytes-in'] || 0),
        bytesOut: parseInt(user['bytes-out'] || 0)
      }));
    } catch (error) {
      throw new Error(`Failed to get active users: ${error.message}`);
    }
  }

  /**
   * Get all hotspot users
   */
  async getAllHotspotUsers(routerId) {
    const { connection } = await this.getRouterConnection(routerId);

    try {
      const users = await connection.write(mikrotikConfig.paths.hotspot.users + '/print');
      return users.map(user => ({
        username: user.name,
        profile: user.profile,
        limitUptime: user['limit-uptime'] || 'unlimited',
        limitBytes: user['limit-bytes-total'] || 'unlimited',
        uptime: user.uptime || '0s',
        bytesUsed: parseInt(user['bytes'] || 0)
      }));
    } catch (error) {
      throw new Error(`Failed to get hotspot users: ${error.message}`);
    }
  }

  /**
   * Get router statistics (CPU, memory, active users)
   */
  async getRouterStats(routerId) {
    const { connection } = await this.getRouterConnection(routerId);

    try {
      const [resources, activeUsers] = await Promise.all([
        connection.write(mikrotikConfig.paths.system.resources + '/print'),
        connection.write(mikrotikConfig.paths.hotspot.active + '/print').catch(() => [])
      ]);

      const resource = resources[0] || {};
      
      return {
        cpu: parseFloat(resource.cpu || 0),
        memory: {
          total: parseInt(resource['total-memory'] || 0),
          free: parseInt(resource['free-memory'] || 0),
          used: parseInt(resource['total-memory'] || 0) - parseInt(resource['free-memory'] || 0),
          usagePercent: resource['total-memory'] 
            ? ((parseInt(resource['total-memory']) - parseInt(resource['free-memory'])) / parseInt(resource['total-memory']) * 100).toFixed(2)
            : 0
        },
        uptime: resource.uptime || '0s',
        activeUsers: activeUsers.length,
        boardName: resource['board-name'] || 'Unknown',
        version: resource.version || 'Unknown'
      };
    } catch (error) {
      throw new Error(`Failed to get router stats: ${error.message}`);
    }
  }

  /**
   * Sync usage data from router
   */
  async syncUsageData(routerId) {
    const { connection } = await this.getRouterConnection(routerId);

    try {
      const users = await this.getAllHotspotUsers(routerId);
      const activeUsers = await this.getActiveUsers(routerId);
      
      return {
        totalUsers: users.length,
        activeUsers: activeUsers.length,
        users: users,
        active: activeUsers
      };
    } catch (error) {
      throw new Error(`Failed to sync usage data: ${error.message}`);
    }
  }

  /**
   * Close connection and remove from cache
   */
  closeConnection(routerId) {
    if (this.connectionCache.has(routerId)) {
      const cached = this.connectionCache.get(routerId);
      if (cached.connection && !cached.connection.closed) {
        cached.connection.close();
      }
      this.connectionCache.delete(routerId);
    }
  }

  /**
   * Close all cached connections
   */
  closeAllConnections() {
    for (const [routerId, cached] of this.connectionCache.entries()) {
      if (cached.connection && !cached.connection.closed) {
        cached.connection.close();
      }
    }
    this.connectionCache.clear();
  }
}

export default new MikroTikService();
