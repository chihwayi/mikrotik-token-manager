import pool from '../config/database.js';
import { generateVoucherCode } from '../utils/voucherGenerator.js';
import mikrotikService from './mikrotikService.js';
import TokenTransaction from '../models/TokenTransaction.js';
import TokenPackage from '../models/TokenPackage.js';
import revenueService from './revenueService.js';

class TokenService {
  async generateToken(staffId, packageId, routerId) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get package details
      const pkg = await TokenPackage.findById(packageId);
      if (!pkg || !pkg.active) {
        throw new Error('Package not found or inactive');
      }

      const voucherCode = generateVoucherCode();

      // Insert transaction
      const transaction = await TokenTransaction.create({
        voucherCode,
        packageId,
        staffId,
        routerId,
        expectedRevenue: pkg.price,
        status: 'pending'
      });

      // Add to MikroTik router (allow failure in development mode)
      let routerAddSuccess = false;
      try {
        await mikrotikService.addHotspotUser(routerId, voucherCode, pkg);
        routerAddSuccess = true;
        console.log(`✅ Hotspot user ${voucherCode} added to router successfully`);
      } catch (routerError) {
        console.warn(`⚠️  Failed to add hotspot user to router: ${routerError.message}`);
        if (process.env.NODE_ENV === 'production') {
          // In production, rollback if router add fails
          throw new Error(`Failed to add token to router: ${routerError.message}`);
        } else {
          // In development, continue without router (for testing)
          console.warn('   Continuing token generation without router (development mode)');
        }
      }

      // Update transaction status
      // In development, mark as active even if router add failed (for testing)
      // In production, only mark as active if router add succeeded
      const transactionStatus = (process.env.NODE_ENV === 'development' || routerAddSuccess) ? 'active' : 'pending';
      await TokenTransaction.update(transaction.id, {
        status: transactionStatus,
        activatedAt: routerAddSuccess ? new Date() : null
      });

      // Create revenue record
      await revenueService.createRevenueRecord(
        transaction.id,
        staffId,
        routerId,
        pkg.price,
        'expected'
      );

      await client.query('COMMIT');

      return {
        voucher: await TokenTransaction.findById(transaction.id),
        package: pkg
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getStaffTokens(staffId, limit = 50) {
    return await TokenTransaction.findByStaff(staffId, limit);
  }

  async getAllTokens(filters = {}) {
    return await TokenTransaction.findAll(filters);
  }

  /**
   * Generate multiple tokens in bulk
   * @param {string} staffId - Staff user ID
   * @param {string} routerId - Router ID
   * @param {Array} tokenRequests - Array of {packageId, quantity}
   * @returns {Array} Array of generated token transactions
   */
  async generateBulkTokens(staffId, routerId, tokenRequests) {
    const client = await pool.connect();
    const allTokens = [];

    try {
      await client.query('BEGIN');

      for (const request of tokenRequests) {
        const { packageId, quantity } = request;

        // Get package details
        const pkg = await TokenPackage.findById(packageId);
        if (!pkg || !pkg.active) {
          throw new Error(`Package ${packageId} not found or inactive`);
        }

        // Generate tokens for this package
        for (let i = 0; i < quantity; i++) {
          const voucherCode = generateVoucherCode();

          // Insert transaction
          const transaction = await TokenTransaction.create({
            voucherCode,
            packageId,
            staffId,
            routerId,
            expectedRevenue: pkg.price,
            status: 'pending'
          });

          // For bulk generation: skip router connection to speed up (especially in development)
          // Router connections can be done later via sync job or individual token activation
          // In development mode, always skip to avoid timeouts
          // In production, you might want to enable this, but with shorter timeout
          const skipRouterForBulk = process.env.NODE_ENV === 'development' || process.env.SKIP_BULK_ROUTER_SYNC === 'true';
          
          let routerAddSuccess = false;
          if (!skipRouterForBulk) {
            try {
              // Use a shorter timeout for bulk operations
              const routerAddPromise = mikrotikService.addHotspotUser(routerId, voucherCode, pkg);
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Router add timeout (5s)')), 5000)
              );
              
              await Promise.race([routerAddPromise, timeoutPromise]);
              routerAddSuccess = true;
            } catch (routerError) {
              // Log but don't fail bulk generation
              console.warn(`⚠️  Router add failed for token ${voucherCode}: ${routerError.message}`);
              // In production, you might want to throw here, but for now we continue
            }
          } else {
            console.log(`ℹ️  Skipping router sync for bulk token ${voucherCode} (development mode)`);
          }

          // Update transaction status
          // ALWAYS mark as 'active' in development when router is skipped
          // 'pending' should only be used when we're waiting for router sync in production
          const transactionStatus = (skipRouterForBulk || routerAddSuccess) ? 'active' : 'pending';
          await TokenTransaction.update(transaction.id, {
            status: transactionStatus,
            activatedAt: routerAddSuccess ? new Date() : null
          });

          // Create revenue record
          await revenueService.createRevenueRecord(
            transaction.id,
            staffId,
            routerId,
            pkg.price,
            'expected'
          );

          const fullTransaction = await TokenTransaction.findById(transaction.id);
          allTokens.push({
            ...fullTransaction,
            package_name: pkg.name,
            package_price: pkg.price,
            package_duration: pkg.duration_hours,
            package_data_limit: pkg.data_limit_mb
          });
        }
      }

      await client.query('COMMIT');
      return allTokens;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export default new TokenService();

