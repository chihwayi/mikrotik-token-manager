import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import TokenPackage from '../models/TokenPackage.js';

const router = express.Router();

// Get all packages (all authenticated users)
router.get('/',
  authenticateToken,
  async (req, res) => {
    try {
      const packages = await TokenPackage.findAll(req.query.activeOnly !== 'false');
      res.json(packages);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get single package
router.get('/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const pkg = await TokenPackage.findById(req.params.id);
      if (!pkg) {
        return res.status(404).json({ error: 'Package not found' });
      }
      res.json(pkg);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Create package (admin and manager)
router.post('/',
  authenticateToken,
  requireRole('super_admin', 'manager'),
  async (req, res) => {
    try {
      const { name, durationHours, dataLimitMb, price, description } = req.body;
      
      if (!name || !durationHours || !dataLimitMb || !price) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const pkg = await TokenPackage.create({
        name,
        durationHours,
        dataLimitMb,
        price,
        description
      });
      
      res.status(201).json(pkg);
    } catch (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Package name already exists' });
      }
      res.status(500).json({ error: error.message });
    }
  }
);

// Update package (admin and manager)
router.put('/:id',
  authenticateToken,
  requireRole('super_admin', 'manager'),
  async (req, res) => {
    try {
      const pkg = await TokenPackage.update(req.params.id, req.body);
      res.json(pkg);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

// Delete/Deactivate package (admin and manager)
router.delete('/:id',
  authenticateToken,
  requireRole('super_admin', 'manager'),
  async (req, res) => {
    try {
      const pkg = await TokenPackage.update(req.params.id, { active: false });
      res.json({ message: 'Package deactivated', package: pkg });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;

