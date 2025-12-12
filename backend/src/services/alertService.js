import pool from '../config/database.js';

class AlertService {
  /**
   * Create an alert
   */
  async createAlert({ type, severity, userId = null, routerId = null, message, details = null }) {
    const result = await pool.query(
      `INSERT INTO alerts 
       (type, severity, user_id, router_id, message, details)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [type, severity, userId, routerId, message, details ? JSON.stringify(details) : null]
    );
    return result.rows[0];
  }

  /**
   * Get all alerts
   */
  async getAlerts(filters = {}) {
    let query = `
      SELECT a.*, 
             u.email as user_email,
             r.name as router_name
      FROM alerts a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN routers r ON a.router_id = r.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (filters.resolved !== undefined) {
      query += ` AND a.resolved = $${paramCount++}`;
      params.push(filters.resolved);
    }
    if (filters.severity) {
      query += ` AND a.severity = $${paramCount++}`;
      params.push(filters.severity);
    }
    if (filters.type) {
      query += ` AND a.type = $${paramCount++}`;
      params.push(filters.type);
    }
    if (filters.routerId) {
      query += ` AND a.router_id = $${paramCount++}`;
      params.push(filters.routerId);
    }
    if (filters.userId) {
      query += ` AND a.user_id = $${paramCount++}`;
      params.push(filters.userId);
    }

    query += ' ORDER BY a.created_at DESC LIMIT $' + paramCount++;
    params.push(filters.limit || 100);

    const result = await pool.query(query, params);
    return result.rows.map(row => ({
      ...row,
      details: row.details ? JSON.parse(row.details) : null
    }));
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId) {
    const result = await pool.query(
      `UPDATE alerts 
       SET resolved = true, resolved_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [alertId]
    );
    return result.rows[0];
  }

  /**
   * Check for revenue mismatches and create alerts
   */
  async checkRevenueMismatch(routerId, startDate, endDate, threshold = 0.1) {
    const revenueService = (await import('./revenueService.js')).default;
    const variance = await revenueService.calculateVariance(routerId, startDate, endDate);

    if (Math.abs(variance.variancePercent) > threshold * 100) {
      await this.createAlert({
        type: 'revenue_mismatch',
        severity: variance.variancePercent > 20 ? 'high' : 'medium',
        routerId: routerId,
        message: `Revenue variance detected: ${variance.variancePercent}% (Expected: $${variance.expected}, Confirmed: $${variance.confirmed})`,
        details: variance
      });
      return true;
    }
    return false;
  }

  /**
   * Check for router offline and create alert
   */
  async checkRouterOffline(routerId, routerName) {
    const existingAlert = await pool.query(
      `SELECT * FROM alerts 
       WHERE router_id = $1 
         AND type = 'router_offline' 
         AND resolved = false
       ORDER BY created_at DESC LIMIT 1`,
      [routerId]
    );

    if (existingAlert.rows.length === 0) {
      await this.createAlert({
        type: 'router_offline',
        severity: 'high',
        routerId: routerId,
        message: `Router ${routerName} is offline or unreachable`
      });
    }
  }

  /**
   * Check for unusual activity
   */
  async checkUnusualActivity(staffId, routerId, details) {
    await this.createAlert({
      type: 'unusual_activity',
      severity: 'medium',
      userId: staffId,
      routerId: routerId,
      message: 'Unusual activity detected',
      details: details
    });
  }

  /**
   * Get unread alerts count
   */
  async getUnreadCount(userId = null) {
    let query = 'SELECT COUNT(*) as count FROM alerts WHERE resolved = false';
    const params = [];

    if (userId) {
      query += ' AND (user_id = $1 OR user_id IS NULL)';
      params.push(userId);
    }

    const result = await pool.query(query, params);
    return parseInt(result.rows[0].count);
  }
}

export default new AlertService();

