import cron from 'node-cron';
import mikrotikService from '../services/mikrotikService.js';
import routerService from '../services/routerService.js';
import UsageLog from '../models/UsageLog.js';
import TokenTransaction from '../models/TokenTransaction.js';
import Router from '../models/Router.js';

class RouterSyncJob {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Sync usage data from all routers
   */
  async syncAllRouters() {
    if (this.isRunning) {
      console.log('Sync job already running, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('Starting router sync job...');

    try {
      const routers = await Router.findAll(true); // Active routers only

      for (const router of routers) {
        try {
          await this.syncRouter(router.id);
        } catch (error) {
          console.error(`Failed to sync router ${router.name}:`, error.message);
        }
      }

      console.log('Router sync job completed');
    } catch (error) {
      console.error('Router sync job failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Sync a single router
   */
  async syncRouter(routerId) {
    const router = await Router.findById(routerId);
    if (!router || !router.active) {
      return;
    }

    try {
      // Get usage data from router
      const usageData = await mikrotikService.syncUsageData(routerId);
      
      // Update token statuses based on active users
      const activeVouchers = usageData.active.map(u => u.username);
      
      // Mark tokens as active if they're in active users list
      if (activeVouchers.length > 0) {
        await TokenTransaction.update(routerId, {
          status: 'active',
          activatedAt: new Date()
        });
      }

      // Update last sync time
      await Router.updateLastSync(routerId);

      console.log(`Synced router ${router.name}: ${usageData.activeUsers} active users`);
    } catch (error) {
      console.error(`Error syncing router ${router.name}:`, error.message);
      throw error;
    }
  }

  /**
   * Start scheduled sync job
   */
  start(intervalMinutes = 5) {
    // Run every X minutes
    const cronExpression = `*/${intervalMinutes} * * * *`;
    
    console.log(`Starting router sync job (every ${intervalMinutes} minutes)`);
    
    cron.schedule(cronExpression, () => {
      this.syncAllRouters();
    });

    // Run immediately on start
    this.syncAllRouters();
  }

  /**
   * Stop sync job
   */
  stop() {
    // Cron jobs are managed by node-cron, this is a placeholder
    console.log('Router sync job stopped');
  }
}

export default new RouterSyncJob();

