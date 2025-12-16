import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import { auditLog } from './middleware/auditLog.js';
import authRoutes from './routes/auth.js';
import tokenRoutes from './routes/tokens.js';
import routerRoutes from './routes/routers.js';
import packageRoutes from './routes/packages.js';
import analyticsRoutes from './routes/analytics.js';
import adminRoutes from './routes/admin.js';

// Background jobs
import syncRoutersJob from './jobs/syncRouters.js';
import healthCheckJob from './jobs/healthCheck.js';
import dailyReconciliationJob from './jobs/dailyReconciliation.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(limiter);
app.use(auditLog);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/routers', routerRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);

// PDF routes (loaded conditionally)
let pdfRoutesLoaded = false;
(async () => {
  try {
    const pdfRoutes = (await import('./routes/pdf.js')).default;
    app.use('/api/pdf', pdfRoutes);
    pdfRoutesLoaded = true;
    console.log('✅ PDF routes loaded successfully');
  } catch (error) {
    console.warn('⚠️  PDF routes not loaded:', error.message);
    app.post('/api/pdf/*', (req, res) => {
      res.status(503).json({ error: 'PDF generation is temporarily unavailable.' });
    });
  }
})();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Auto-run migrations on startup
async function initializeDatabase() {
  try {
    console.log('🔄 Running database migrations...');
    const { spawn } = await import('child_process');
    
    return new Promise((resolve, reject) => {
      const migration = spawn('node', ['migrations/run.js'], {
        cwd: process.cwd(),
        stdio: 'inherit'
      });
      
      migration.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Database migrations completed');
          resolve();
        } else {
          reject(new Error(`Migration failed with code ${code}`));
        }
      });
    });
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  }
}

// Initialize and start server
async function startServer() {
  try {
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      
      // Start background jobs (only in production or when explicitly enabled)
      if (process.env.NODE_ENV === 'production' || process.env.ENABLE_JOBS === 'true') {
        console.log('⚙️  Starting background jobs...');
        syncRoutersJob.start(5); // Sync every 5 minutes
        healthCheckJob.start(5); // Health check every 5 minutes
        dailyReconciliationJob.start(); // Daily reconciliation at 1 AM
        console.log('✅ Background jobs started');
      }
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

startServer();

