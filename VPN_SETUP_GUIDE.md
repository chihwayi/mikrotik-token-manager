# MikroTik VPN Integration Setup Guide

## Overview

Your MikroTik Token Management System now includes built-in VPN functionality supporting:
- **PPTP** - Basic VPN protocol (fastest setup)
- **L2TP/IPSec** - More secure than PPTP
- **OpenVPN** - Most secure and flexible

## Quick Setup

### 1. Database Migration ✅
The VPN tables have been added to your database:
- `vpn_packages` - VPN service packages
- `vpn_users` - VPN user accounts
- `vpn_sessions` - Active VPN sessions
- Router VPN configuration fields

### 2. Backend Integration ✅
- VPN service (`/backend/src/services/vpnService.js`)
- VPN API routes (`/backend/src/routes/vpn.js`)
- Integrated with existing MikroTik service

### 3. Frontend Interface ✅
- VPN Manager component added to Staff Dashboard
- Tab-based interface: Hotspot Tokens | VPN Access
- Create VPN users, view active sessions, download configs

## MikroTik Router Configuration

### Enable VPN Services on Your Router

#### PPTP Setup
```bash
/interface pptp-server server
set enabled=yes default-profile=default-encryption

# Create IP pool for VPN clients
/ip pool add name=vpn-pool ranges=192.168.100.2-192.168.100.100

# Configure profile
/ppp profile add name=vpn-profile local-address=192.168.100.1 remote-address=vpn-pool
```

#### L2TP/IPSec Setup
```bash
/interface l2tp-server server
set enabled=yes use-ipsec=yes ipsec-secret=mikrotik123 default-profile=default-encryption

# Same IP pool as above
```

#### OpenVPN Setup
```bash
/interface ovpn-server server
set enabled=yes port=1194 mode=ip default-profile=default

# Generate certificates (simplified)
/certificate add name=ca-template common-name=myCa key-usage=key-cert-sign,crl-sign
/certificate sign ca-template ca-crl-host=127.0.0.1 name=myCa
/certificate add name=server-template common-name=server
/certificate sign server-template ca=myCa name=server
```

## Usage

### For Staff Users

1. **Access VPN Tab**: Click "VPN Access" tab in Staff Dashboard
2. **Select Router**: Choose the target router
3. **Choose VPN Type**: PPTP, L2TP, or OpenVPN
4. **Select Package**: Pick duration and data limits
5. **Generate**: Click "Create VPN User"
6. **Get Credentials**: Username and password will be displayed
7. **Download Config**: For OpenVPN, download .ovpn file

### VPN Packages Available

- **PPTP 1 Hour** - $1.50 (500MB)
- **PPTP Daily** - $5.00 (2GB)
- **L2TP 1 Hour** - $2.00 (500MB)
- **L2TP Daily** - $6.00 (2GB)
- **OpenVPN 1 Hour** - $2.50 (1GB)
- **OpenVPN Daily** - $8.00 (5GB)

## API Endpoints

```bash
# Get VPN packages
GET /api/vpn/packages

# Create VPN user
POST /api/vpn/create
{
  "packageId": "uuid",
  "routerId": "uuid", 
  "vpnType": "pptp|l2tp|openvpn"
}

# Get active VPN users
GET /api/vpn/active/:routerId

# Get VPN statistics
GET /api/vpn/stats/:routerId

# Download OpenVPN config
GET /api/vpn/openvpn-config/:routerId/:username
```

## Security Considerations

### PPTP
- ⚠️ **Least secure** but fastest to set up
- Good for basic internet access
- Not recommended for sensitive data

### L2TP/IPSec
- ✅ **More secure** than PPTP
- Built-in encryption
- Good balance of security and performance

### OpenVPN
- ✅ **Most secure** option
- Highly configurable
- Best for business/sensitive use
- Requires certificate setup

## Firewall Rules

Add these firewall rules to allow VPN traffic:

```bash
# PPTP
/ip firewall filter add chain=input protocol=tcp dst-port=1723 action=accept
/ip firewall filter add chain=input protocol=gre action=accept

# L2TP
/ip firewall filter add chain=input protocol=udp dst-port=500,4500 action=accept
/ip firewall filter add chain=input protocol=ipsec-esp action=accept

# OpenVPN
/ip firewall filter add chain=input protocol=udp dst-port=1194 action=accept
```

## Client Setup Examples

### Windows PPTP/L2TP
1. Settings → Network & Internet → VPN
2. Add VPN Connection
3. Enter server IP and credentials

### OpenVPN Client
1. Download OpenVPN client
2. Import .ovpn config file
3. Connect with generated credentials

## Monitoring

The system provides:
- **Real-time VPN sessions** - See who's connected
- **Data usage tracking** - Monitor bandwidth consumption
- **Revenue tracking** - Track VPN service income
- **Session logs** - Audit trail for connections

## Troubleshooting

### Common Issues

1. **VPN server not starting**
   - Check if ports are open in firewall
   - Verify router has sufficient resources

2. **Clients can't connect**
   - Verify firewall rules
   - Check if VPN service is enabled
   - Confirm credentials are correct

3. **No internet through VPN**
   - Check NAT rules
   - Verify routing configuration

### Debug Commands

```bash
# Check VPN server status
/interface pptp-server server print
/interface l2tp-server server print
/interface ovpn-server server print

# View active connections
/ppp active print

# Check VPN users
/ppp secret print
```

## Business Benefits

- **Additional Revenue Stream** - Monetize VPN access
- **Centralized Management** - Control all VPN users from one dashboard
- **Flexible Packages** - Different tiers for different needs
- **Complete Audit Trail** - Track usage and revenue
- **Multi-Router Support** - Manage VPN across locations

---

**Your MikroTik Token Management System now includes professional VPN capabilities!**

For setup assistance or custom configurations, contact: chihwayii@outlook.com