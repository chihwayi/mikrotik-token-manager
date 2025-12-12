import pool from '../config/database.js';

export const auditLog = async (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = async (body) => {
    if (req.user && req.method !== 'GET') {
      try {
        await pool.query(
          `INSERT INTO audit_logs (user_id, action, resource, changes, ip_address)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            req.user.id,
            req.method,
            req.path,
            JSON.stringify({ body: req.body, response: body }),
            req.ip
          ]
        );
      } catch (error) {
        console.error('Audit log error:', error);
      }
    }

    return originalJson(body);
  };

  next();
};

