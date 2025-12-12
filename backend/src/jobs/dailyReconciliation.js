import cron from 'node-cron';
import pool from '../config/database.js';
import revenueService from '../services/revenueService.js';
import alertService from '../services/alertService.js';
import Router from '../models/Router.js';

class DailyReconciliationJob {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Run daily reconciliation for all routers
   */
  async runReconciliation(reportDate = new Date()) {
    if (this.isRunning) {
      console.log('Reconciliation already running, skipping...');
      return;
    }

    this.isRunning = true;
    const dateStr = reportDate.toISOString().split('T')[0];
    console.log(`Starting daily reconciliation for ${dateStr}...`);

    try {
      const routers = await Router.findAll(true);

      for (const router of routers) {
        try {
          await this.reconcileRouter(router.id, reportDate);
        } catch (error) {
          console.error(`Reconciliation failed for router ${router.name}:`, error.message);
        }
      }

      console.log('Daily reconciliation completed');
    } catch (error) {
      console.error('Daily reconciliation failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Reconcile a single router
   */
  async reconcileRouter(routerId, reportDate) {
    const router = await Router.findById(routerId);
    if (!router) {
      return;
    }

    const startDate = new Date(reportDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(reportDate);
    endDate.setHours(23, 59, 59, 999);

    // Get token statistics
    const tokenStats = await pool.query(
      `SELECT 
        COUNT(*) as tokens_generated,
        COUNT(*) FILTER (WHERE status = 'used') as tokens_used,
        SUM(expected_revenue) as expected_revenue
       FROM token_transactions
       WHERE router_id = $1 
         AND DATE(generated_at) = $2`,
      [routerId, reportDate.toISOString().split('T')[0]]
    );

    // Get confirmed revenue
    const confirmedRevenue = await pool.query(
      `SELECT SUM(amount) as confirmed_revenue
       FROM revenue_records
       WHERE router_id = $1 
         AND payment_status = 'confirmed'
         AND DATE(recorded_at) = $2`,
      [routerId, reportDate.toISOString().split('T')[0]]
    );

    const stats = tokenStats.rows[0];
    const confirmed = parseFloat(confirmedRevenue.rows[0].confirmed_revenue || 0);
    const expected = parseFloat(stats.expected_revenue || 0);
    const variance = expected - confirmed;

    // Check for discrepancies
    const discrepancies = [];
    if (variance > expected * 0.1) {
      discrepancies.push({
        type: 'revenue_variance',
        expected,
        confirmed,
        variance
      });
    }

    // Save reconciliation report
    await pool.query(
      `INSERT INTO reconciliation_reports 
       (router_id, report_date, tokens_generated, tokens_used, expected_revenue, confirmed_revenue, variance, discrepancies)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (router_id, report_date) 
       DO UPDATE SET 
         tokens_generated = EXCLUDED.tokens_generated,
         tokens_used = EXCLUDED.tokens_used,
         expected_revenue = EXCLUDED.expected_revenue,
         confirmed_revenue = EXCLUDED.confirmed_revenue,
         variance = EXCLUDED.variance,
         discrepancies = EXCLUDED.discrepancies`,
      [
        routerId,
        reportDate.toISOString().split('T')[0],
        parseInt(stats.tokens_generated || 0),
        parseInt(stats.tokens_used || 0),
        expected,
        confirmed,
        variance,
        JSON.stringify(discrepancies)
      ]
    );

    // Check for alerts
    if (discrepancies.length > 0) {
      await alertService.checkRevenueMismatch(routerId, startDate, endDate);
    }

    console.log(`Reconciled router ${router.name}: Expected $${expected}, Confirmed $${confirmed}, Variance $${variance}`);
  }

  /**
   * Start scheduled reconciliation (runs daily at 1 AM)
   */
  start() {
    console.log('Starting daily reconciliation job (runs at 1:00 AM daily)');
    
    // Run at 1:00 AM every day
    cron.schedule('0 1 * * *', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      this.runReconciliation(yesterday);
    });

    // Also run for yesterday on startup if not already done
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    this.runReconciliation(yesterday);
  }

  stop() {
    console.log('Daily reconciliation job stopped');
  }
}

export default new DailyReconciliationJob();

