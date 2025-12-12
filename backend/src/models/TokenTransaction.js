import pool from '../config/database.js';

class TokenTransaction {
  static async findById(id) {
    const result = await pool.query(
      `SELECT tt.*, tp.name as package_name, tp.duration_hours, tp.data_limit_mb,
              u.email as staff_email, r.name as router_name, r.location
       FROM token_transactions tt
       JOIN token_packages tp ON tt.package_id = tp.id
       JOIN users u ON tt.staff_id = u.id
       JOIN routers r ON tt.router_id = r.id
       WHERE tt.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByVoucherCode(voucherCode) {
    const result = await pool.query(
      `SELECT tt.*, tp.name as package_name, tp.duration_hours, tp.data_limit_mb,
              u.email as staff_email, r.name as router_name, r.location
       FROM token_transactions tt
       JOIN token_packages tp ON tt.package_id = tp.id
       JOIN users u ON tt.staff_id = u.id
       JOIN routers r ON tt.router_id = r.id
       WHERE tt.voucher_code = $1`,
      [voucherCode]
    );
    return result.rows[0] || null;
  }

  static async create({ voucherCode, packageId, staffId, routerId, expectedRevenue, status = 'pending' }) {
    const result = await pool.query(
      `INSERT INTO token_transactions 
       (voucher_code, package_id, staff_id, router_id, expected_revenue, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [voucherCode, packageId, staffId, routerId, expectedRevenue, status]
    );
    return result.rows[0];
  }

  static async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updates.status) {
      fields.push(`status = $${paramCount++}`);
      values.push(updates.status);
    }
    if (updates.activatedAt) {
      fields.push(`activated_at = $${paramCount++}`);
      values.push(updates.activatedAt);
    }
    if (updates.expiresAt) {
      fields.push(`expires_at = $${paramCount++}`);
      values.push(updates.expiresAt);
    }
    if (updates.clientMac) {
      fields.push(`client_mac = $${paramCount++}`);
      values.push(updates.clientMac);
    }
    if (updates.clientIp) {
      fields.push(`client_ip = $${paramCount++}`);
      values.push(updates.clientIp);
    }

    if (fields.length === 0) {
      return await this.findById(id);
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE token_transactions SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async findByStaff(staffId, limit = 50) {
    const result = await pool.query(
      `SELECT tt.*, tp.name as package_name, tp.price, r.name as router_name, r.location
       FROM token_transactions tt
       JOIN token_packages tp ON tt.package_id = tp.id
       JOIN routers r ON tt.router_id = r.id
       WHERE tt.staff_id = $1
       ORDER BY tt.generated_at DESC
       LIMIT $2`,
      [staffId, limit]
    );
    return result.rows;
  }

  static async findAll(filters = {}) {
    let query = `
      SELECT tt.*, tp.name as package_name, tp.price, 
             u.email as staff_email, r.name as router_name, r.location
      FROM token_transactions tt
      JOIN token_packages tp ON tt.package_id = tp.id
      JOIN users u ON tt.staff_id = u.id
      JOIN routers r ON tt.router_id = r.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (filters.routerId) {
      query += ` AND tt.router_id = $${paramCount++}`;
      params.push(filters.routerId);
    }
    if (filters.staffId) {
      query += ` AND tt.staff_id = $${paramCount++}`;
      params.push(filters.staffId);
    }
    if (filters.status) {
      query += ` AND tt.status = $${paramCount++}`;
      params.push(filters.status);
    }
    if (filters.startDate) {
      query += ` AND tt.generated_at >= $${paramCount++}`;
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      query += ` AND tt.generated_at <= $${paramCount++}`;
      params.push(filters.endDate);
    }

    query += ` ORDER BY tt.generated_at DESC LIMIT ${filters.limit || 100}`;
    const result = await pool.query(query, params);
    return result.rows;
  }

  static async getStats(filters = {}) {
    let query = `
      SELECT 
        COUNT(*) as total_tokens,
        COUNT(*) FILTER (WHERE status = 'active') as active_tokens,
        COUNT(*) FILTER (WHERE status = 'used') as used_tokens,
        COUNT(*) FILTER (WHERE status = 'expired') as expired_tokens,
        SUM(expected_revenue) as total_revenue
      FROM token_transactions
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
      query += ` AND generated_at >= $${paramCount++}`;
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      query += ` AND generated_at <= $${paramCount++}`;
      params.push(filters.endDate);
    }

    const result = await pool.query(query, params);
    return result.rows[0];
  }
}

export default TokenTransaction;


