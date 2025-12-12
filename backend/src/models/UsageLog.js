import pool from '../config/database.js';

class UsageLog {
  static async create({ transactionId, routerId, voucherCode, bytesUploaded = 0, bytesDownloaded = 0, sessionDurationSeconds = 0, sessionStart, sessionEnd }) {
    const totalBytes = bytesUploaded + bytesDownloaded;
    const result = await pool.query(
      `INSERT INTO usage_logs 
       (transaction_id, router_id, voucher_code, bytes_uploaded, bytes_downloaded, 
        total_bytes, session_duration_seconds, session_start, session_end)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [transactionId, routerId, voucherCode, bytesUploaded, bytesDownloaded, 
       totalBytes, sessionDurationSeconds, sessionStart, sessionEnd]
    );
    return result.rows[0];
  }

  static async findByVoucherCode(voucherCode) {
    const result = await pool.query(
      `SELECT * FROM usage_logs 
       WHERE voucher_code = $1 
       ORDER BY synced_at DESC`,
      [voucherCode]
    );
    return result.rows;
  }

  static async findByRouter(routerId, limit = 100) {
    const result = await pool.query(
      `SELECT * FROM usage_logs 
       WHERE router_id = $1 
       ORDER BY synced_at DESC 
       LIMIT $2`,
      [routerId, limit]
    );
    return result.rows;
  }

  static async findByTransaction(transactionId) {
    const result = await pool.query(
      `SELECT * FROM usage_logs 
       WHERE transaction_id = $1 
       ORDER BY synced_at DESC`,
      [transactionId]
    );
    return result.rows;
  }

  static async getRouterUsageStats(routerId, startDate, endDate) {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_sessions,
        SUM(bytes_uploaded) as total_uploaded,
        SUM(bytes_downloaded) as total_downloaded,
        SUM(total_bytes) as total_bytes,
        SUM(session_duration_seconds) as total_duration_seconds,
        AVG(session_duration_seconds) as avg_duration_seconds
       FROM usage_logs
       WHERE router_id = $1 
         AND synced_at >= $2 
         AND synced_at <= $3`,
      [routerId, startDate, endDate]
    );
    return result.rows[0];
  }
}

export default UsageLog;

