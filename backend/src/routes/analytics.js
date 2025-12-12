import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import revenueService from '../services/revenueService.js';
import TokenTransaction from '../models/TokenTransaction.js';
import routerService from '../services/routerService.js';
import pool from '../config/database.js';

const router = express.Router();

// Get overall statistics
router.get('/overview',
  authenticateToken,
  requireRole('manager', 'super_admin'),
  async (req, res) => {
    try {
      const startDate = req.query.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = req.query.endDate || new Date().toISOString();

      const filters = { startDate, endDate };
      if (req.user.role === 'manager' && req.query.routerId) {
        filters.routerId = req.query.routerId;
      }

      const [tokenStats, revenueStats] = await Promise.all([
        TokenTransaction.getStats(filters),
        revenueService.getRevenueStats(filters)
      ]);

      res.json({
        tokens: tokenStats,
        revenue: revenueStats,
        period: { startDate, endDate }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get revenue analytics
router.get('/revenue',
  authenticateToken,
  requireRole('manager', 'super_admin'),
  async (req, res) => {
    try {
      const startDate = req.query.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = req.query.endDate || new Date().toISOString();

      const filters = { startDate, endDate };
      if (req.query.routerId) {
        filters.routerId = req.query.routerId;
      }
      if (req.query.staffId) {
        filters.staffId = req.query.staffId;
      }

      const [stats, dailyRevenue] = await Promise.all([
        revenueService.getRevenueStats(filters),
        revenueService.getDailyRevenue(startDate, endDate, filters.routerId)
      ]);

      res.json({
        summary: stats,
        daily: dailyRevenue
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get router performance
router.get('/routers',
  authenticateToken,
  requireRole('manager', 'super_admin'),
  async (req, res) => {
    try {
      const startDate = req.query.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = req.query.endDate || new Date().toISOString();

      const routers = await routerService.getAllRoutersWithHealth();
      
      const routerStats = await Promise.all(
        routers.map(async (router) => {
          const stats = await routerService.getRouterStatistics(router.id, startDate, endDate);
          return {
            router: {
              id: router.id,
              name: router.name,
              location: router.location
            },
            ...stats
          };
        })
      );

      res.json(routerStats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get staff performance
router.get('/staff',
  authenticateToken,
  requireRole('manager', 'super_admin'),
  async (req, res) => {
    try {
      const startDate = req.query.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = req.query.endDate || new Date().toISOString();

      const result = await pool.query(
        `SELECT 
          u.id,
          u.email,
          u.role,
          COUNT(tt.id) as tokens_generated,
          SUM(tt.expected_revenue) as revenue_generated,
          COUNT(DISTINCT tt.router_id) as routers_used
         FROM users u
         LEFT JOIN token_transactions tt ON u.id = tt.staff_id
           AND tt.generated_at >= $1 
           AND tt.generated_at <= $2
         WHERE u.role = 'staff'
         GROUP BY u.id, u.email, u.role
         ORDER BY tokens_generated DESC`,
        [startDate, endDate]
      );

      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;

