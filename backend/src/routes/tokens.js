import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import tokenService from '../services/tokenService.js';

const router = express.Router();

// Generate new token (staff only for their assigned router)
router.post('/generate', 
  authenticateToken, 
  requireRole('staff'), 
  async (req, res) => {
    try {
      const { packageId } = req.body;
      const staffId = req.user.id;
      const routerId = req.user.assigned_router_id;

      if (!routerId) {
        return res.status(400).json({ error: 'No router assigned to staff' });
      }

      const result = await tokenService.generateToken(staffId, packageId, routerId);
      res.json(result);
    } catch (error) {
      console.error('Token generation error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Get staff's own tokens
router.get('/my-tokens', 
  authenticateToken, 
  requireRole('staff'), 
  async (req, res) => {
    try {
      const tokens = await tokenService.getStaffTokens(req.user.id);
      res.json(tokens);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get all tokens (manager and admin)
router.get('/all',
  authenticateToken, 
  requireRole('manager', 'super_admin'), 
  async (req, res) => {
    try {
      const filters = {
        routerId: req.query.routerId,
        status: req.query.status,
        startDate: req.query.startDate
      };
      
      const tokens = await tokenService.getAllTokens(filters);
      res.json(tokens);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Bulk token generation (staff only for their assigned router)
router.post('/generate-bulk',
  authenticateToken,
  requireRole('staff'),
  async (req, res) => {
    try {
      const { tokenRequests } = req.body; // Array of {packageId, quantity}
      const staffId = req.user.id;
      const routerId = req.user.assigned_router_id;

      if (!routerId) {
        return res.status(400).json({ error: 'No router assigned to staff' });
      }

      if (!tokenRequests || !Array.isArray(tokenRequests) || tokenRequests.length === 0) {
        return res.status(400).json({ error: 'tokenRequests must be a non-empty array' });
      }

      // Validate each request
      for (const request of tokenRequests) {
        if (!request.packageId || !request.quantity || request.quantity < 1) {
          return res.status(400).json({ error: 'Each request must have packageId and quantity >= 1' });
        }
      }

      console.log('🔧 Bulk token generation request:', {
        staffId,
        routerId,
        tokenRequestsCount: tokenRequests.length,
        tokenRequests
      });
      
      const tokens = await tokenService.generateBulkTokens(staffId, routerId, tokenRequests);
      
      console.log('✅ Bulk tokens generated:', tokens.length);
      res.json({ tokens, count: tokens.length });
    } catch (error) {
      console.error('❌ Bulk token generation error:', error);
      console.error('   Error stack:', error.stack);
      res.status(500).json({ error: error.message || 'Failed to generate bulk tokens' });
    }
  }
);

export default router;

