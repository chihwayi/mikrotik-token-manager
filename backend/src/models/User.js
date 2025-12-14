import pool from '../config/database.js';

class User {
  static async findById(id) {
    const result = await pool.query(
      'SELECT id, email, role, assigned_router_id, active, created_at, last_login FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  static async create({ email, passwordHash, role, assignedRouterId = null }) {
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, role, assigned_router_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, role, assigned_router_id, active, created_at`,
      [email, passwordHash, role, assignedRouterId]
    );
    return result.rows[0];
  }

  static async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updates.email) {
      fields.push(`email = $${paramCount++}`);
      values.push(updates.email);
    }
    if (updates.passwordHash) {
      fields.push(`password_hash = $${paramCount++}`);
      values.push(updates.passwordHash);
    }
    if (updates.role) {
      fields.push(`role = $${paramCount++}`);
      values.push(updates.role);
    }
    if (updates.assignedRouterId !== undefined) {
      fields.push(`assigned_router_id = $${paramCount++}`);
      values.push(updates.assignedRouterId);
    }
    if (updates.active !== undefined) {
      fields.push(`active = $${paramCount++}`);
      values.push(updates.active);
    }

    if (fields.length === 0) {
      return await this.findById(id);
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING id, email, role, assigned_router_id, active, created_at, last_login`,
      values
    );
    return result.rows[0];
  }

  static async findAll(filters = {}) {
    let query = 'SELECT id, email, role, assigned_router_id, active, created_at, last_login FROM users WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (filters.role) {
      query += ` AND role = $${paramCount++}`;
      params.push(filters.role);
    }
    if (filters.active !== undefined) {
      query += ` AND active = $${paramCount++}`;
      params.push(filters.active);
    }
    if (filters.routerId) {
      query += ` AND assigned_router_id = $${paramCount++}`;
      params.push(filters.routerId);
    }

    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    return result.rows;
  }

  static async updateLastLogin(id) {
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
  }
}

export default User;



