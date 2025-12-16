import { RouterOSAPI } from 'node-routeros';
import Router from '../models/Router.js';
import { decrypt } from '../utils/encryption.js';

class ConnectionService {
  constructor() {
    this.connectionCache = new Map();
  }

  /**
   * Get router connection with dynamic method detection
   */
  async getRouterConnection(routerId, useCache = true) {
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

    // Try connection methods in order of preference
    const connectionMethods = [
      { type: 'zerotier', ip: router.zerotier_ip },
      { type: 'tailscale', ip: router.tailscale_ip },
      { type: 'vpn', ip: router.vpn_ip },
      { type: 'direct', ip: router.ip_address }
    ].filter(method => method.ip); // Only try methods with configured IPs

    let lastError;
    for (const method of connectionMethods) {
      try {
        console.log(`Attempting ${method.type} connection to ${method.ip}`);
        const connection = await this.createConnection(router, method.ip);
        
        // Test connection
        await connection.write('/system/identity/print');
        
        // Cache successful connection
        const connectionData = { connection, router, method: method.type };
        this.connectionCache.set(routerId, connectionData);
        
        console.log(`✅ Connected via ${method.type} to ${method.ip}`);
        return connectionData;
      } catch (error) {
        console.log(`❌ ${method.type} connection failed: ${error.message}`);
        lastError = error;
        continue;
      }
    }

    throw new Error(`All connection methods failed. Last error: ${lastError?.message}`);
  }

  async createConnection(router, ipAddress) {
    let password;
    try {
      password = router.api_password_encrypted.includes(':') 
        ? decrypt(router.api_password_encrypted)
        : router.api_password_encrypted;
    } catch (error) {
      password = router.api_password_encrypted;
    }

    const connection = new RouterOSAPI({
      host: ipAddress,
      user: router.api_username,
      password: password,
      port: router.api_port || 8728,
      timeout: 10000
    });

    await connection.connect();
    return connection;
  }

  /**
   * Test all connection methods for a router
   */
  async testAllConnections(routerId) {
    const router = await Router.findById(routerId);
    if (!router) throw new Error('Router not found');

    const methods = [
      { type: 'zerotier', ip: router.zerotier_ip },
      { type: 'tailscale', ip: router.tailscale_ip },
      { type: 'vpn', ip: router.vpn_ip },
      { type: 'direct', ip: router.ip_address }
    ].filter(method => method.ip);

    const results = [];
    for (const method of methods) {
      try {
        const connection = await this.createConnection(router, method.ip);
        await connection.write('/system/identity/print');
        connection.close();
        results.push({ ...method, status: 'success' });
      } catch (error) {
        results.push({ ...method, status: 'failed', error: error.message });
      }
    }

    return results;
  }
}

export default new ConnectionService();