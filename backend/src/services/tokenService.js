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

      // Add to MikroTik router
      await mikrotikService.addHotspotUser(routerId, voucherCode, pkg);

      // Update transaction status to active
      await TokenTransaction.update(transaction.id, {
        status: 'active',
        activatedAt: new Date()
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
}

export default new TokenService();

