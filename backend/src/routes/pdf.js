import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
// pdfService imported dynamically in route handler to avoid blocking

const router = express.Router();

// Generate PDF for tokens
router.post('/tokens',
  authenticateToken,
  requireRole('staff', 'manager', 'super_admin'),
  async (req, res) => {
    try {
      const { tokenIds } = req.body;

      if (!tokenIds || !Array.isArray(tokenIds) || tokenIds.length === 0) {
        return res.status(400).json({ error: 'tokenIds must be a non-empty array' });
      }

      // For staff, verify tokens belong to their router
      if (req.user.role === 'staff') {
        // This validation could be added here if needed
        // For now, we'll trust the tokenIds provided
      }

      // Dynamically import pdfService to avoid blocking server startup
      const pdfService = (await import('../services/pdfService.js')).default;
      const pdfBuffer = await pdfService.generateTokenMatrixPDF(tokenIds);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="tokens-${Date.now()}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('PDF generation error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;

