import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import User from '../models/User.js';
import routerService from '../services/routerService.js';
import alertService from '../services/alertService.js';
import pool from '../config/database.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Get all users
router.get('/users',
  authenticateToken,
  requireRole('super_admin', 'manager'),
  async (req, res) => {
    try {
      const users = await User.findAll(req.query);
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Create user
router.post('/users',
  authenticateToken,
  requireRole('super_admin', 'manager'),
  async (req, res) => {
    try {
      const { email, password, role, assignedRouterId } = req.body;
      
      if (!email || !password || !role) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({
        email,
        passwordHash: hashedPassword,
        role,
        assignedRouterId: assignedRouterId || null
      });

      res.status(201).json(user);
    } catch (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Email already exists' });
      }
      res.status(500).json({ error: error.message });
    }
  }
);

// Update user
router.put('/users/:id',
  authenticateToken,
  requireRole('super_admin'),
  async (req, res) => {
    try {
      const updates = { ...req.body };
      
      if (updates.password) {
        updates.passwordHash = await bcrypt.hash(updates.password, 10);
        delete updates.password;
      }

      const user = await User.update(req.params.id, updates);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

// Assign router to staff
router.post('/users/:id/assign-router',
  authenticateToken,
  requireRole('super_admin', 'manager'),
  async (req, res) => {
    try {
      const { routerId } = req.body;
      const result = await routerService.assignRouterToStaff(routerId, req.params.id);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

// Get all alerts
router.get('/alerts',
  authenticateToken,
  requireRole('super_admin', 'manager'),
  async (req, res) => {
    try {
      const alerts = await alertService.getAlerts({
        resolved: req.query.resolved === 'true' ? true : req.query.resolved === 'false' ? false : undefined,
        severity: req.query.severity,
        type: req.query.type,
        limit: parseInt(req.query.limit || 100)
      });
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Resolve alert
router.put('/alerts/:id/resolve',
  authenticateToken,
  requireRole('super_admin', 'manager'),
  async (req, res) => {
    try {
      const alert = await alertService.resolveAlert(req.params.id);
      res.json(alert);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get system statistics
router.get('/stats',
  authenticateToken,
  requireRole('super_admin'),
  async (req, res) => {
    try {
      const [users, routers, tokens, alerts] = await Promise.all([
        pool.query('SELECT COUNT(*) as count FROM users'),
        pool.query('SELECT COUNT(*) as count FROM routers WHERE active = true'),
        pool.query('SELECT COUNT(*) as count FROM token_transactions'),
        pool.query('SELECT COUNT(*) as count FROM alerts WHERE resolved = false')
      ]);

      res.json({
        users: parseInt(users.rows[0].count),
        routers: parseInt(routers.rows[0].count),
        tokens: parseInt(tokens.rows[0].count),
        unreadAlerts: parseInt(alerts.rows[0].count)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;

