import pool from '../config/database.js';

class TokenPackage {
  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM token_packages WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByName(name) {
    const result = await pool.query(
      'SELECT * FROM token_packages WHERE name = $1',
      [name]
    );
    return result.rows[0] || null;
  }

  static async create({ name, durationHours, dataLimitMb, price, description = null }) {
    const result = await pool.query(
      `INSERT INTO token_packages (name, duration_hours, data_limit_mb, price, description)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, durationHours, dataLimitMb, price, description]
    );
    return result.rows[0];
  }

  static async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updates.name) {
      fields.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }
    if (updates.durationHours !== undefined) {
      fields.push(`duration_hours = $${paramCount++}`);
      values.push(updates.durationHours);
    }
    if (updates.dataLimitMb !== undefined) {
      fields.push(`data_limit_mb = $${paramCount++}`);
      values.push(updates.dataLimitMb);
    }
    if (updates.price !== undefined) {
      fields.push(`price = $${paramCount++}`);
      values.push(updates.price);
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(updates.description);
    }
    if (updates.active !== undefined) {
      fields.push(`active = $${paramCount++}`);
      values.push(updates.active);
    }

    if (fields.length === 0) {
      return await this.findById(id);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    const result = await pool.query(
      `UPDATE token_packages SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async findAll(activeOnly = true) {
    let query = 'SELECT * FROM token_packages';
    if (activeOnly) {
      query += ' WHERE active = true';
    }
    query += ' ORDER BY price ASC';
    const result = await pool.query(query);
    return result.rows;
  }
}

export default TokenPackage;



