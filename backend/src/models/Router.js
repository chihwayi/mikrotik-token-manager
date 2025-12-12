import pool from '../config/database.js';

class Router {
  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM routers WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByIp(ipAddress) {
    const result = await pool.query(
      'SELECT * FROM routers WHERE ip_address = $1',
      [ipAddress]
    );
    return result.rows[0] || null;
  }

  static async create({ name, location, ipAddress, apiPort = 8728, apiUsername, apiPasswordEncrypted, routerModel = null, province = null, district = null, town = null }) {
    const result = await pool.query(
      `INSERT INTO routers (name, location, ip_address, api_port, api_username, api_password_encrypted, router_model, province, district, town)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [name, location, ipAddress, apiPort, apiUsername, apiPasswordEncrypted, routerModel, province, district, town]
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
    if (updates.location) {
      fields.push(`location = $${paramCount++}`);
      values.push(updates.location);
    }
    if (updates.ipAddress) {
      fields.push(`ip_address = $${paramCount++}`);
      values.push(updates.ipAddress);
    }
    if (updates.apiPort) {
      fields.push(`api_port = $${paramCount++}`);
      values.push(updates.apiPort);
    }
    if (updates.apiUsername) {
      fields.push(`api_username = $${paramCount++}`);
      values.push(updates.apiUsername);
    }
    if (updates.apiPasswordEncrypted) {
      fields.push(`api_password_encrypted = $${paramCount++}`);
      values.push(updates.apiPasswordEncrypted);
    }
    if (updates.routerModel !== undefined) {
      fields.push(`router_model = $${paramCount++}`);
      values.push(updates.routerModel);
    }
    if (updates.province !== undefined) {
      fields.push(`province = $${paramCount++}`);
      values.push(updates.province);
    }
    if (updates.district !== undefined) {
      fields.push(`district = $${paramCount++}`);
      values.push(updates.district);
    }
    if (updates.town !== undefined) {
      fields.push(`town = $${paramCount++}`);
      values.push(updates.town);
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
      `UPDATE routers SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async findAll(activeOnly = false) {
    let query = 'SELECT * FROM routers';
    if (activeOnly) {
      query += ' WHERE active = true';
    }
    query += ' ORDER BY name ASC';
    const result = await pool.query(query);
    return result.rows;
  }

  static async updateLastSync(id) {
    await pool.query(
      'UPDATE routers SET last_sync = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
  }

  static async getHealthStatus(id) {
    const result = await pool.query(
      `SELECT * FROM router_health 
       WHERE router_id = $1 
       ORDER BY checked_at DESC 
       LIMIT 1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async delete(id) {
    const result = await pool.query(
      'DELETE FROM routers WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0] || null;
  }
}

export default Router;

