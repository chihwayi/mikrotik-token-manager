import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import routerService from '../services/routerService.js';
import mikrotikService from '../services/mikrotikService.js';
import Router from '../models/Router.js';
import pool from '../config/database.js';

const router = express.Router();

// Get all routers (manager and admin)
router.get('/',
  authenticateToken,
  requireRole('manager', 'super_admin'),
  async (req, res) => {
    try {
      const routers = await routerService.getAllRoutersWithHealth();
      res.json(routers);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get single router
router.get('/:id',
  authenticateToken,
  requireRole('manager', 'super_admin'),
  async (req, res) => {
    try {
      const router = await Router.findById(req.params.id);
      if (!router) {
        return res.status(404).json({ error: 'Router not found' });
      }
      const health = await Router.getHealthStatus(req.params.id);
      res.json({ ...router, health });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Add new router (admin and manager)
router.post('/',
  authenticateToken,
  requireRole('super_admin', 'manager'),
  async (req, res) => {
    console.log('📥 POST /api/routers - Request received');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    try {
      // Validate required fields
      const ipAddress = req.body.ip_address || req.body.ipAddress;
      if (!ipAddress || typeof ipAddress !== 'string' || ipAddress.trim() === '') {
        return res.status(400).json({ error: 'IP address is required and cannot be empty' });
      }

      if (!req.body.name || typeof req.body.name !== 'string' || req.body.name.trim() === '') {
        return res.status(400).json({ error: 'Router name is required' });
      }

      if (!req.body.location || typeof req.body.location !== 'string' || req.body.location.trim() === '') {
        return res.status(400).json({ error: 'Location is required' });
      }

      if (!req.body.api_username && !req.body.apiUsername) {
        return res.status(400).json({ error: 'API username is required' });
      }

      if (!req.body.api_password_encrypted && !req.body.apiPassword) {
        return res.status(400).json({ error: 'API password is required' });
      }

      // Accept both api_password_encrypted and apiPassword for flexibility
      const routerData = {
        name: req.body.name.trim(),
        location: req.body.location.trim(),
        ip_address: ipAddress.trim(),
        api_port: req.body.api_port || req.body.apiPort || 8728,
        api_username: (req.body.api_username || req.body.apiUsername).trim(),
        api_password_encrypted: req.body.api_password_encrypted || req.body.apiPassword,
        router_model: req.body.router_model || req.body.routerModel || null,
        province: req.body.province || null,
        district: req.body.district || null,
        town: req.body.town || null
      };

      const router = await routerService.addRouter(routerData);
      console.log('✅ Router created successfully:', router.id);
      res.status(201).json(router);
    } catch (error) {
      console.error('❌ Error creating router:', error.message);
      console.error('Error stack:', error.stack);
      res.status(400).json({ error: error.message });
    }
  }
);

// Update router (admin and manager)
router.put('/:id',
  authenticateToken,
  requireRole('super_admin', 'manager'),
  async (req, res) => {
    try {
      // Map request body to model format
      const updates = {
        name: req.body.name,
        location: req.body.location,
        ipAddress: req.body.ip_address || req.body.ipAddress,
        apiPort: req.body.api_port || req.body.apiPort,
        apiUsername: req.body.api_username || req.body.apiUsername,
        apiPasswordEncrypted: req.body.api_password_encrypted || req.body.apiPassword,
        routerModel: req.body.router_model || req.body.routerModel,
        province: req.body.province,
        district: req.body.district,
        town: req.body.town,
        active: req.body.active
      };

      // Remove undefined values
      Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

      // If password is provided and needs encryption, handle it in service layer
      if (updates.apiPasswordEncrypted && !updates.apiPasswordEncrypted.includes(':')) {
        const { encrypt } = await import('../utils/encryption.js');
        updates.apiPasswordEncrypted = encrypt(updates.apiPasswordEncrypted);
      }

      const router = await Router.update(req.params.id, updates);
      res.json(router);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

// Test router connection
router.post('/:id/test',
  authenticateToken,
  requireRole('super_admin', 'manager'),
  async (req, res) => {
    try {
      console.log(`🧪 Testing connection for router ${req.params.id}...`);
      
      // Add timeout wrapper to prevent hanging
      const testPromise = mikrotikService.testConnection(req.params.id);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout after 15 seconds')), 15000)
      );
      
      const result = await Promise.race([testPromise, timeoutPromise]);
      console.log(`🧪 Connection test result:`, JSON.stringify(result, null, 2));
      
      // Update router health status based on test result
      try {
        if (result.success) {
          console.log(`✅ Connection successful - updating health to ONLINE for router ${req.params.id}`);
          await routerService.updateRouterHealth(req.params.id, {
            isOnline: true,
            activeUsers: null,
            cpuUsage: null,
            memoryUsage: null,
            bandwidthUsage: null
          });
          console.log(`✅ Health status updated to ONLINE`);
        } else {
          console.log(`❌ Connection failed - updating health to OFFLINE for router ${req.params.id}`);
          await routerService.updateRouterHealth(req.params.id, {
            isOnline: false,
            activeUsers: 0,
            cpuUsage: null,
            memoryUsage: null,
            bandwidthUsage: null
          });
          console.log(`✅ Health status updated to OFFLINE`);
        }
      } catch (healthError) {
        console.error(`❌ Failed to update health status:`, healthError);
      }
      
      // Return success even if connection failed, but include the result
      res.json(result);
    } catch (error) {
      console.error(`❌ Error testing router connection:`, error);
      
      // Update health status as offline on error
      try {
        await routerService.updateRouterHealth(req.params.id, {
          isOnline: false,
          activeUsers: 0,
          cpuUsage: null,
          memoryUsage: null,
          bandwidthUsage: null
        });
      } catch (healthError) {
        console.error('Failed to update health status:', healthError);
      }
      
      // Return a proper error response instead of 500
      const errorMessage = error?.message || 'Unknown error occurred';
      res.status(200).json({ 
        success: false, 
        message: `Connection test failed: ${errorMessage}` 
      });
    }
  }
);

// Manual health check endpoint (checks all routers)
router.post('/health-check',
  authenticateToken,
  requireRole('super_admin', 'manager'),
  async (req, res) => {
    try {
      console.log('🩺 Manual health check triggered...');
      const results = await routerService.checkAllRoutersHealth();
      res.json({ 
        success: true, 
        message: `Health check completed for ${results.length} routers`,
        results 
      });
    } catch (error) {
      console.error('❌ Error running health check:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Get router info
router.get('/:id/info',
  authenticateToken,
  requireRole('super_admin', 'manager'),
  async (req, res) => {
    try {
      const info = await mikrotikService.getRouterInfo(req.params.id);
      res.json(info);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get router stats
router.get('/:id/stats',
  authenticateToken,
  requireRole('super_admin', 'manager'),
  async (req, res) => {
    try {
      const stats = await mikrotikService.getRouterStats(req.params.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get router statistics (analytics)
router.get('/:id/statistics',
  authenticateToken,
  requireRole('super_admin', 'manager'),
  async (req, res) => {
    try {
      const startDate = req.query.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = req.query.endDate || new Date().toISOString();
      
      const statistics = await routerService.getRouterStatistics(
        req.params.id,
        startDate,
        endDate
      );
      res.json(statistics);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get active users
router.get('/:id/active-users',
  authenticateToken,
  requireRole('super_admin', 'manager'),
  async (req, res) => {
    try {
      const users = await mikrotikService.getActiveUsers(req.params.id);
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Sync router data
router.post('/:id/sync',
  authenticateToken,
  requireRole('super_admin', 'manager'),
  async (req, res) => {
    try {
      const usageData = await mikrotikService.syncUsageData(req.params.id);
      res.json(usageData);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Delete router (admin and manager)
router.delete('/:id',
  authenticateToken,
  requireRole('super_admin', 'manager'),
  async (req, res) => {
    try {
      // Check if router exists
      const router = await Router.findById(req.params.id);
      if (!router) {
        return res.status(404).json({ error: 'Router not found' });
      }

      // Check if router is assigned to any users
      const assignedUsers = await pool.query(
        'SELECT COUNT(*) as count FROM users WHERE assigned_router_id = $1',
        [req.params.id]
      );

      if (parseInt(assignedUsers.rows[0].count) > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete router: Router is assigned to one or more staff members' 
        });
      }

      // Delete router
      await pool.query('DELETE FROM routers WHERE id = $1', [req.params.id]);
      res.json({ success: true, message: 'Router deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;

