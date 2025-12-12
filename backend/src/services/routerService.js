import Router from '../models/Router.js';
import User from '../models/User.js';
import mikrotikService from './mikrotikService.js';
import pool from '../config/database.js';
import { encrypt } from '../utils/encryption.js';

class RouterService {
  /**
   * Add a new router with automatic detection
   */
  async addRouter(routerData) {
    console.log('🔧 addRouter called with:', { 
      name: routerData.name, 
      ip_address: routerData.ip_address || routerData.ipAddress 
    });
    
    // Encrypt password before storing
    const encryptedPassword = encrypt(routerData.api_password_encrypted || routerData.apiPassword);
    
    // Map to Router.create expected format (camelCase)
    const routerDataToSave = {
      name: routerData.name,
      location: routerData.location,
      ipAddress: routerData.ip_address || routerData.ipAddress,
      apiPort: routerData.api_port || routerData.apiPort || 8728,
      apiUsername: routerData.api_username || routerData.apiUsername,
      apiPasswordEncrypted: encryptedPassword,
      routerModel: routerData.router_model || routerData.routerModel || null,
      province: routerData.province || null,
      district: routerData.district || null,
      town: routerData.town || null
    };

    // Test connection first (using plain password for test)
    // For development: Skip connection test for now since mock router protocol might not be fully compatible
    // TODO: Fix RouterOS API connection test with mock router
    console.log('🧪 Testing router connection (skipping for development)...');
    
    // Skip connection test in development mode to allow router creation
    // This will be fixed once mock router RouterOS protocol is fully implemented
    const skipConnectionTest = process.env.NODE_ENV === 'development' || process.env.SKIP_CONNECTION_TEST === 'true';
    
    if (!skipConnectionTest) {
      try {
        const testResult = await Promise.race([
          this.testRouterConnection({
            ...routerData,
            api_password_encrypted: routerData.api_password_encrypted || routerData.apiPassword
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Connection test timeout after 15 seconds')), 15000)
          )
        ]);
        
        if (!testResult.success) {
          console.warn('⚠️  Connection test failed:', testResult.message);
          // In production, throw error
          if (process.env.NODE_ENV === 'production') {
            throw new Error(`Connection test failed: ${testResult.message}`);
          }
        } else {
          console.log('✅ Connection test passed');
        }
      } catch (testError) {
        console.warn('⚠️  Connection test error:', testError.message);
        // In production, throw error
        if (process.env.NODE_ENV === 'production') {
          throw new Error(`Connection test failed: ${testError.message}`);
        }
      }
    } else {
      console.log('ℹ️  Connection test skipped (development mode)');
    }
    
    console.log('✅ Creating router in database...');

    // Create router in database with encrypted password
    const router = await Router.create(routerDataToSave);

    // Initialize health status (default to offline until checked)
    try {
      await this.updateRouterHealth(router.id, {
        isOnline: false,
        activeUsers: 0,
        cpuUsage: null,
        memoryUsage: null,
        bandwidthUsage: null
      });
    } catch (error) {
      console.warn('Could not initialize router health status:', error.message);
    }

    // Try to get router info with timeout (non-blocking)
    // This will auto-detect router model
    console.log('📊 Attempting to fetch router info (model detection)...');
    try {
      // Use Promise.race to enforce timeout
      const infoPromise = mikrotikService.getRouterInfo(router.id);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Router info fetch timeout after 8 seconds')), 8000)
      );
      
      const info = await Promise.race([infoPromise, timeoutPromise]);
      
      if (info && info.model) {
        await Router.update(router.id, { routerModel: info.model });
        console.log(`✅ Router model auto-detected: ${info.model}`);
      } else {
        console.log('ℹ️  Router model not detected (router may not support this query)');
      }
      
      // Update health status to online if we successfully got router info
      await this.updateRouterHealth(router.id, {
        isOnline: true,
        activeUsers: 0,
        cpuUsage: null,
        memoryUsage: null,
        bandwidthUsage: null
      });
    } catch (error) {
      // Don't fail router creation if model detection fails
      console.warn(`⚠️  Could not auto-detect router model: ${error.message}`);
      console.warn('   Router created successfully. Model will be detected on next sync or can be set manually.');
      // Health status remains offline (already set above)
    }

    return router;
  }

  /**
   * Test router connection
   */
  async testRouterConnection(routerData, existingRouterId = null) {
    try {
      // Validate required fields
      const ipAddress = routerData.ip_address || routerData.ipAddress;
      if (!ipAddress || ipAddress.trim() === '') {
        throw new Error('IP address is required');
      }

      const trimmedIp = ipAddress.trim();
      const apiPort = routerData.api_port || routerData.apiPort || 8728;
      const apiUsername = routerData.api_username || routerData.apiUsername || 'admin';
      const apiPassword = routerData.api_password_encrypted || routerData.apiPassword || '';

      // Check if router with this IP already exists
      const existingRouter = await Router.findByIp(trimmedIp);
      
      // If router exists and we're not updating that same router, return error
      if (existingRouter && existingRouter.id !== existingRouterId) {
        return { 
          success: false, 
          message: `A router with IP address ${trimmedIp} already exists (${existingRouter.name})` 
        };
      }

      // If router exists and we're updating it, test with existing router
      if (existingRouter && existingRouter.id === existingRouterId) {
        return await mikrotikService.testConnection(existingRouter.id);
      }

      // For new routers, test connection directly without creating DB record
      // This avoids unique constraint violations
      const result = await mikrotikService.testConnectionDirect({
        ipAddress: trimmedIp,
        apiPort: apiPort,
        apiUsername: apiUsername,
        apiPassword: apiPassword
      });
      
      if (!result.success) {
        console.error('Connection test failed:', result.message);
      }
      
      return result;
    } catch (error) {
      console.error('testRouterConnection error:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error occurred';
      return { success: false, message: errorMessage };
    }
  }

  /**
   * Get all routers with health status
   */
  async getAllRoutersWithHealth() {
    const routers = await Router.findAll();
    
    const routersWithHealth = await Promise.all(
      routers.map(async (router) => {
        const health = await Router.getHealthStatus(router.id);
        return {
          ...router,
          health: health || {
            is_online: false,
            active_users: 0,
            checked_at: null
          }
        };
      })
    );

    return routersWithHealth;
  }

  /**
   * Update router health status
   */
  async updateRouterHealth(routerId, healthData) {
    await pool.query(
      `INSERT INTO router_health 
       (router_id, is_online, active_users, cpu_usage, memory_usage, bandwidth_usage)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        routerId,
        healthData.isOnline,
        healthData.activeUsers || 0,
        healthData.cpuUsage || null,
        healthData.memoryUsage || null,
        healthData.bandwidthUsage || null
      ]
    );
  }

  /**
   * Check health of all routers
   */
  async checkAllRoutersHealth() {
    const routers = await Router.findAll(true); // Active only
    
    const results = await Promise.allSettled(
      routers.map(async (router) => {
        try {
          const stats = await mikrotikService.getRouterStats(router.id);
          
          await this.updateRouterHealth(router.id, {
            isOnline: true,
            activeUsers: stats.activeUsers,
            cpuUsage: stats.cpu,
            memoryUsage: parseFloat(stats.memory.usagePercent),
            bandwidthUsage: null // Would need interface stats
          });

          return { routerId: router.id, success: true, stats };
        } catch (error) {
          await this.updateRouterHealth(router.id, {
            isOnline: false,
            activeUsers: 0,
            cpuUsage: null,
            memoryUsage: null,
            bandwidthUsage: null
          });

          return { routerId: router.id, success: false, error: error.message };
        }
      })
    );

    return results.map(r => r.value || r.reason);
  }

  /**
   * Get router statistics
   */
  async getRouterStatistics(routerId, startDate, endDate) {
    const router = await Router.findById(routerId);
    if (!router) {
      throw new Error('Router not found');
    }

    // Get token stats
    const tokenStats = await pool.query(
      `SELECT 
        COUNT(*) as total_tokens,
        COUNT(*) FILTER (WHERE status = 'active') as active_tokens,
        SUM(expected_revenue) as expected_revenue
       FROM token_transactions
       WHERE router_id = $1 
         AND generated_at >= $2 
         AND generated_at <= $3`,
      [routerId, startDate, endDate]
    );

    // Get usage stats
    const usageStats = await pool.query(
      `SELECT 
        COUNT(*) as total_sessions,
        SUM(total_bytes) as total_bytes,
        SUM(bytes_uploaded) as bytes_uploaded,
        SUM(bytes_downloaded) as bytes_downloaded
       FROM usage_logs
       WHERE router_id = $1 
         AND synced_at >= $2 
         AND synced_at <= $3`,
      [routerId, startDate, endDate]
    );

    // Get staff performance
    const staffPerformance = await pool.query(
      `SELECT 
        u.id,
        u.email,
        COUNT(tt.id) as tokens_generated,
        SUM(tt.expected_revenue) as revenue_generated
       FROM users u
       JOIN token_transactions tt ON u.id = tt.staff_id
       WHERE tt.router_id = $1 
         AND tt.generated_at >= $2 
         AND tt.generated_at <= $3
       GROUP BY u.id, u.email
       ORDER BY tokens_generated DESC`,
      [routerId, startDate, endDate]
    );

    return {
      router,
      tokens: tokenStats.rows[0],
      usage: usageStats.rows[0],
      staff: staffPerformance.rows
    };
  }

  /**
   * Assign router to staff member
   */
  async assignRouterToStaff(routerId, staffId) {
    const router = await Router.findById(routerId);
    const staff = await User.findById(staffId);

    if (!router) {
      throw new Error('Router not found');
    }
    if (!staff) {
      throw new Error('Staff member not found');
    }
    if (staff.role !== 'staff') {
      throw new Error('User is not a staff member');
    }

    await User.update(staffId, { assignedRouterId: routerId });
    return { success: true, message: `Router ${router.name} assigned to ${staff.email}` };
  }
}

export default new RouterService();

