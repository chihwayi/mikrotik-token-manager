import pool from '../config/database.js';
import TokenTransaction from '../models/TokenTransaction.js';

class RevenueService {
  /**
   * Create revenue record
   */
  async createRevenueRecord(transactionId, staffId, routerId, amount, paymentStatus = 'expected', notes = null) {
    const result = await pool.query(
      `INSERT INTO revenue_records 
       (transaction_id, staff_id, router_id, amount, payment_status, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [transactionId, staffId, routerId, amount, paymentStatus, notes]
    );
    return result.rows[0];
  }

  /**
   * Get revenue statistics
   */
  async getRevenueStats(filters = {}) {
    let query = `
      SELECT 
        COUNT(*) as total_transactions,
        SUM(amount) as total_revenue,
        SUM(amount) FILTER (WHERE payment_status = 'confirmed') as confirmed_revenue,
        SUM(amount) FILTER (WHERE payment_status = 'expected') as expected_revenue,
        SUM(amount) FILTER (WHERE payment_status = 'disputed') as disputed_revenue,
        COUNT(*) FILTER (WHERE payment_status = 'confirmed') as confirmed_count,
        COUNT(*) FILTER (WHERE payment_status = 'expected') as expected_count,
        COUNT(*) FILTER (WHERE payment_status = 'disputed') as disputed_count
      FROM revenue_records
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (filters.routerId) {
      query += ` AND router_id = $${paramCount++}`;
      params.push(filters.routerId);
    }
    if (filters.staffId) {
      query += ` AND staff_id = $${paramCount++}`;
      params.push(filters.staffId);
    }
    if (filters.startDate) {
      query += ` AND recorded_at >= $${paramCount++}`;
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      query += ` AND recorded_at <= $${paramCount++}`;
      params.push(filters.endDate);
    }

    const result = await pool.query(query, params);
    return result.rows[0];
  }

  /**
   * Get revenue by router
   */
  async getRevenueByRouter(routerId, startDate, endDate) {
    const result = await pool.query(
      `SELECT 
        r.name as router_name,
        r.location,
        COUNT(rr.id) as transaction_count,
        SUM(rr.amount) as total_revenue,
        SUM(rr.amount) FILTER (WHERE rr.payment_status = 'confirmed') as confirmed_revenue,
        SUM(rr.amount) FILTER (WHERE rr.payment_status = 'expected') as expected_revenue
       FROM revenue_records rr
       JOIN routers r ON rr.router_id = r.id
       WHERE rr.router_id = $1 
         AND rr.recorded_at >= $2 
         AND rr.recorded_at <= $3
       GROUP BY r.id, r.name, r.location`,
      [routerId, startDate, endDate]
    );
    return result.rows[0];
  }

  /**
   * Get revenue by staff
   */
  async getRevenueByStaff(staffId, startDate, endDate) {
    const result = await pool.query(
      `SELECT 
        u.email as staff_email,
        COUNT(rr.id) as transaction_count,
        SUM(rr.amount) as total_revenue,
        SUM(rr.amount) FILTER (WHERE rr.payment_status = 'confirmed') as confirmed_revenue,
        SUM(rr.amount) FILTER (WHERE rr.payment_status = 'expected') as expected_revenue
       FROM revenue_records rr
       JOIN users u ON rr.staff_id = u.id
       WHERE rr.staff_id = $1 
         AND rr.recorded_at >= $2 
         AND rr.recorded_at <= $3
       GROUP BY u.id, u.email`,
      [staffId, startDate, endDate]
    );
    return result.rows[0];
  }

  /**
   * Get daily revenue breakdown
   */
  async getDailyRevenue(startDate, endDate, routerId = null) {
    let query = `
      SELECT 
        DATE(recorded_at) as date,
        COUNT(*) as transaction_count,
        SUM(amount) as daily_revenue,
        SUM(amount) FILTER (WHERE payment_status = 'confirmed') as confirmed_revenue
      FROM revenue_records
      WHERE recorded_at >= $1 AND recorded_at <= $2
    `;
    const params = [startDate, endDate];

    if (routerId) {
      query += ` AND router_id = $3`;
      params.push(routerId);
    }

    query += ` GROUP BY DATE(recorded_at) ORDER BY date ASC`;
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(revenueRecordId, paymentStatus, notes = null) {
    const result = await pool.query(
      `UPDATE revenue_records 
       SET payment_status = $1, notes = $2
       WHERE id = $3
       RETURNING *`,
      [paymentStatus, notes, revenueRecordId]
    );
    return result.rows[0];
  }

  /**
   * Calculate variance (expected vs confirmed)
   */
  async calculateVariance(routerId, startDate, endDate) {
    const stats = await this.getRevenueStats({ routerId, startDate, endDate });
    
    const variance = parseFloat(stats.expected_revenue || 0) - parseFloat(stats.confirmed_revenue || 0);
    const variancePercent = stats.expected_revenue > 0 
      ? ((variance / parseFloat(stats.expected_revenue)) * 100).toFixed(2)
      : 0;

    return {
      expected: parseFloat(stats.expected_revenue || 0),
      confirmed: parseFloat(stats.confirmed_revenue || 0),
      variance: variance,
      variancePercent: parseFloat(variancePercent)
    };
  }
}

export default new RevenueService();


