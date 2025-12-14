import mikrotikService from './mikrotikService.js';
import pool from '../config/database.js';
import { generateVoucherCode } from '../utils/tokenGenerator.js';

class VPNService {
  /**
   * Create VPN user on MikroTik router
   */
  async createVPNUser(routerId, vpnType, packageDetails, staffId) {
    const username = generateVoucherCode();
    const password = generateVoucherCode(8);
    
    const { connection } = await mikrotikService.getRouterConnection(routerId);
    
    try {
      switch (vpnType) {
        case 'pptp':
          await this.createPPTPUser(connection, username, password, packageDetails);
          break;
        case 'l2tp':
          await this.createL2TPUser(connection, username, password, packageDetails);
          break;
        case 'openvpn':
          await this.createOpenVPNUser(connection, username, password, packageDetails);
          break;
        default:
          throw new Error('Unsupported VPN type');
      }

      // Store in database
      const result = await pool.query(`
        INSERT INTO vpn_users (username, password, package_id, router_id, staff_id, vpn_type, expires_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        username,
        password,
        packageDetails.id,
        routerId,
        staffId,
        vpnType,
        new Date(Date.now() + packageDetails.duration_hours * 60 * 60 * 1000)
      ]);

      return {
        success: true,
        vpnUser: result.rows[0],
        credentials: { username, password }
      };
    } catch (error) {
      throw new Error(`Failed to create VPN user: ${error.message}`);
    }
  }

  /**
   * Create PPTP user
   */
  async createPPTPUser(connection, username, password, packageDetails) {
    // Check if PPTP server is enabled
    const pptpServer = await connection.write('/interface/pptp-server/server/print');
    if (!pptpServer[0] || pptpServer[0].enabled !== 'true') {
      // Enable PPTP server
      await connection.write('/interface/pptp-server/server/set', [
        '=enabled=yes',
        '=default-profile=default-encryption'
      ]);
    }

    // Create PPTP user
    await connection.write('/ppp/secret/add', [
      `=name=${username}`,
      `=password=${password}`,
      '=service=pptp',
      `=limit-bytes-total=${packageDetails.data_limit_mb * 1024 * 1024}`,
      '=profile=default-encryption'
    ]);
  }

  /**
   * Create L2TP user
   */
  async createL2TPUser(connection, username, password, packageDetails) {
    // Check if L2TP server is enabled
    const l2tpServer = await connection.write('/interface/l2tp-server/server/print');
    if (!l2tpServer[0] || l2tpServer[0].enabled !== 'true') {
      // Enable L2TP server
      await connection.write('/interface/l2tp-server/server/set', [
        '=enabled=yes',
        '=use-ipsec=yes',
        '=ipsec-secret=mikrotik123',
        '=default-profile=default-encryption'
      ]);
    }

    // Create L2TP user
    await connection.write('/ppp/secret/add', [
      `=name=${username}`,
      `=password=${password}`,
      '=service=l2tp',
      `=limit-bytes-total=${packageDetails.data_limit_mb * 1024 * 1024}`,
      '=profile=default-encryption'
    ]);
  }

  /**
   * Create OpenVPN user
   */
  async createOpenVPNUser(connection, username, password, packageDetails) {
    // Check if OpenVPN server is enabled
    const ovpnServer = await connection.write('/interface/ovpn-server/server/print');
    if (!ovpnServer[0] || ovpnServer[0].enabled !== 'true') {
      // Enable OpenVPN server
      await connection.write('/interface/ovpn-server/server/set', [
        '=enabled=yes',
        '=port=1194',
        '=mode=ip',
        '=default-profile=default'
      ]);
    }

    // Create OpenVPN user
    await connection.write('/ppp/secret/add', [
      `=name=${username}`,
      `=password=${password}`,
      '=service=ovpn',
      `=limit-bytes-total=${packageDetails.data_limit_mb * 1024 * 1024}`,
      '=profile=default'
    ]);
  }

  /**
   * Get VPN packages
   */
  async getVPNPackages() {
    const result = await pool.query(`
      SELECT * FROM vpn_packages 
      WHERE active = true 
      ORDER BY vpn_type, price
    `);
    return result.rows;
  }

  /**
   * Get active VPN users for a router
   */
  async getActiveVPNUsers(routerId) {
    const { connection } = await mikrotikService.getRouterConnection(routerId);
    
    try {
      const activeConnections = await connection.write('/ppp/active/print');
      
      return activeConnections.map(conn => ({
        username: conn.name,
        service: conn.service,
        address: conn.address,
        uptime: conn.uptime,
        bytesIn: parseInt(conn['bytes-in'] || 0),
        bytesOut: parseInt(conn['bytes-out'] || 0)
      }));
    } catch (error) {
      throw new Error(`Failed to get active VPN users: ${error.message}`);
    }
  }

  /**
   * Disable VPN user
   */
  async disableVPNUser(vpnUserId) {
    const userResult = await pool.query('SELECT * FROM vpn_users WHERE id = $1', [vpnUserId]);
    if (userResult.rows.length === 0) {
      throw new Error('VPN user not found');
    }

    const vpnUser = userResult.rows[0];
    const { connection } = await mikrotikService.getRouterConnection(vpnUser.router_id);

    try {
      // Find and disable the PPP secret
      const secrets = await connection.write('/ppp/secret/print', [
        `?name=${vpnUser.username}`
      ]);

      if (secrets.length > 0) {
        await connection.write('/ppp/secret/set', [
          `=.id=${secrets[0]['.id']}`,
          '=disabled=yes'
        ]);
      }

      // Update database
      await pool.query('UPDATE vpn_users SET status = $1 WHERE id = $2', ['disabled', vpnUserId]);

      return { success: true, message: 'VPN user disabled' };
    } catch (error) {
      throw new Error(`Failed to disable VPN user: ${error.message}`);
    }
  }

  /**
   * Get VPN statistics for a router
   */
  async getVPNStats(routerId) {
    const { connection } = await mikrotikService.getRouterConnection(routerId);
    
    try {
      const [pptpActive, l2tpActive, ovpnActive, allSecrets] = await Promise.all([
        connection.write('/ppp/active/print', ['?service=pptp']).catch(() => []),
        connection.write('/ppp/active/print', ['?service=l2tp']).catch(() => []),
        connection.write('/ppp/active/print', ['?service=ovpn']).catch(() => []),
        connection.write('/ppp/secret/print').catch(() => [])
      ]);

      return {
        active: {
          pptp: pptpActive.length,
          l2tp: l2tpActive.length,
          openvpn: ovpnActive.length,
          total: pptpActive.length + l2tpActive.length + ovpnActive.length
        },
        totalUsers: allSecrets.filter(s => ['pptp', 'l2tp', 'ovpn'].includes(s.service)).length
      };
    } catch (error) {
      throw new Error(`Failed to get VPN stats: ${error.message}`);
    }
  }

  /**
   * Generate OpenVPN client config
   */
  async generateOpenVPNConfig(routerId, username) {
    const routerResult = await pool.query('SELECT * FROM routers WHERE id = $1', [routerId]);
    if (routerResult.rows.length === 0) {
      throw new Error('Router not found');
    }

    const router = routerResult.rows[0];
    
    const config = `client
dev tun
proto udp
remote ${router.ip_address} 1194
resolv-retry infinite
nobind
persist-key
persist-tun
auth-user-pass
cipher AES-256-CBC
verb 3

# Username: ${username}
# Generated for: ${router.name}
`;

    return config;
  }
}

export default new VPNService();