import cron from 'node-cron';
import routerService from '../services/routerService.js';
import alertService from '../services/alertService.js';
import Router from '../models/Router.js';

class HealthCheckJob {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Check health of all routers
   */
  async checkAllRouters() {
    if (this.isRunning) {
      console.log('Health check already running, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('Starting router health check...');

    try {
      const results = await routerService.checkAllRoutersHealth();
      
      // Check for offline routers and create alerts
      const routers = await Router.findAll(true);
      
      for (const router of routers) {
        const result = results.find(r => r.routerId === router.id);
        if (!result || !result.success) {
          await alertService.checkRouterOffline(router.id, router.name);
        }
      }

      console.log(`Health check completed: ${results.length} routers checked`);
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Start scheduled health check
   */
  start(intervalMinutes = 5) {
    const cronExpression = `*/${intervalMinutes} * * * *`;
    
    console.log(`Starting router health check job (every ${intervalMinutes} minutes)`);
    
    cron.schedule(cronExpression, () => {
      this.checkAllRouters();
    });

    // Run immediately on start
    this.checkAllRouters();
  }

  stop() {
    console.log('Health check job stopped');
  }
}

export default new HealthCheckJob();

