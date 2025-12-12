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
    const testResult = await this.testRouterConnection({
      ...routerData,
      api_password_encrypted: routerData.api_password_encrypted || routerData.apiPassword
    });
    if (!testResult.success) {
      throw new Error(`Connection test failed: ${testResult.message}`);
    }

    // Create router in database with encrypted password
    const router = await Router.create(routerDataToSave);

    // Try to get router info
    try {
      const info = await mikrotikService.getRouterInfo(router.id);
      await Router.update(router.id, { routerModel: info.model });
    } catch (error) {
      console.warn(`Could not fetch router info: ${error.message}`);
    }

    return router;
  }

  /**
   * Test router connection
   */
  async testRouterConnection(routerData) {
    try {
      // Use plain password for testing (don't encrypt yet)
      const tempRouter = await Router.create({
        ...routerData,
        name: 'temp-test-' + Date.now(),
        // Store plain password temporarily for testing
        api_password_encrypted: routerData.api_password_encrypted || routerData.apiPassword
      });

      const result = await mikrotikService.testConnection(tempRouter.id);
      
      // Clean up temp router
      await pool.query('DELETE FROM routers WHERE id = $1', [tempRouter.id]);
      
      return result;
    } catch (error) {
      return { success: false, message: error.message };
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

