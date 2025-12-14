import express from 'express';
import vpnService from '../services/vpnService.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import pool from '../config/database.js';

const router = express.Router();

// Get VPN packages
router.get('/packages', authenticateToken, async (req, res) => {
  try {
    const packages = await vpnService.getVPNPackages();
    res.json(packages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create VPN user
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { packageId, routerId, vpnType } = req.body;
    
    // Get package details
    const packageResult = await pool.query('SELECT * FROM vpn_packages WHERE id = $1', [packageId]);
    if (packageResult.rows.length === 0) {
      return res.status(404).json({ error: 'Package not found' });
    }

    const result = await vpnService.createVPNUser(
      routerId, 
      vpnType, 
      packageResult.rows[0], 
      req.user.id
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get active VPN users
router.get('/active/:routerId', authenticateToken, async (req, res) => {
  try {
    const { routerId } = req.params;
    const activeUsers = await vpnService.getActiveVPNUsers(routerId);
    res.json(activeUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get VPN statistics
router.get('/stats/:routerId', authenticateToken, async (req, res) => {
  try {
    const { routerId } = req.params;
    const stats = await vpnService.getVPNStats(routerId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Disable VPN user
router.post('/disable/:vpnUserId', authenticateToken, requireRole(['super_admin', 'manager']), async (req, res) => {
  try {
    const { vpnUserId } = req.params;
    const result = await vpnService.disableVPNUser(vpnUserId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get my VPN users
router.get('/my-vpn-users', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT vu.*, vp.name as package_name, vp.vpn_type, r.name as router_name
      FROM vpn_users vu
      JOIN vpn_packages vp ON vu.package_id = vp.id
      JOIN routers r ON vu.router_id = r.id
      WHERE vu.staff_id = $1
      ORDER BY vu.created_at DESC
    `, [req.user.id]);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate OpenVPN config
router.get('/openvpn-config/:routerId/:username', authenticateToken, async (req, res) => {
  try {
    const { routerId, username } = req.params;
    const config = await vpnService.generateOpenVPNConfig(routerId, username);
    
    res.setHeader('Content-Type', 'application/x-openvpn-profile');
    res.setHeader('Content-Disposition', `attachment; filename="${username}.ovpn"`);
    res.send(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;