# 🛡️ MikroTik Remote VPN Access Setup Guide

This guide documents the complete setup for enabling remote access to your MikroTik router via L2TP/IPSec VPN for centralized token management.

## 📋 Overview

This setup allows a central server to connect to your MikroTik router remotely via VPN and manage hotspot tokens through the RouterOS API.

## 🔧 Complete Setup Commands

### Step 1: Enable L2TP/IPSec Server

```bash
/interface l2tp-server server set enabled=yes use-ipsec=yes ipsec-secret=MikroTik123! default-profile=default-encryption
```

### Step 2: Create VPN User

```bash
# Remove existing user if exists
/ppp secret remove [find name=server-vpn]

# Create new VPN user
/ppp secret add name=server-vpn password=Server123! service=l2tp
```

### Step 3: Create IP Pool

```bash
# Remove existing pool if exists
/ip pool remove [find name=vpn-pool]

# Create new IP pool for VPN clients
/ip pool add name=vpn-pool ranges=192.168.100.2-192.168.100.10
```

### Step 4: Configure Firewall Rules

```bash
# Allow local network API access
/ip firewall filter add chain=input src-address=192.168.88.0/24 protocol=tcp dst-port=8728 action=accept place-before=0

# Allow VPN traffic (MUST be before drop rules)
/ip firewall filter add chain=input protocol=udp dst-port=500,4500 action=accept place-before=18
/ip firewall filter add chain=input protocol=ipsec-esp action=accept place-before=18
/ip firewall filter add chain=input protocol=udp dst-port=1701 action=accept place-before=18
```

### Step 5: Clean Up Duplicate Rules

```bash
# Remove duplicate API access rules
/ip firewall filter remove [find chain=input protocol=tcp dst-port=8728 src-address=192.168.88.0/24]

# Remove duplicate VPN rules
/ip firewall filter remove [find chain=input protocol=udp dst-port=500,4500]
/ip firewall filter remove [find chain=input protocol=ipsec-esp]

# Keep only one of each rule type
```

## 🔑 Connection Credentials

### VPN Connection Details
- **VPN Type**: L2TP/IPSec
- **Server**: Your MikroTik's public IP address
- **Username**: `server-vpn`
- **Password**: `Server123!`
- **Pre-shared Key**: `MikroTik123!`

### API Access Credentials
- **API Username**: `api-user`
- **API Password**: `Password123!`
- **API Port**: `8728`

## 🧹 Firewall Cleanup Commands

### Remove Duplicate Rules (Run as needed)

```bash
# Check current rules
/ip firewall filter print where chain=input

# Remove specific duplicate rules by number
/ip firewall filter remove 3,4,6,7,8,9,10,12,19

# Or remove by criteria
/ip firewall filter remove [find chain=input protocol=tcp dst-port=8728 src-address=173.212.195.88]
```

## ✅ Verification Commands

### Check VPN Server Status
```bash
/interface l2tp-server server print
```

### Check VPN Users
```bash
/ppp secret print where service=l2tp
```

### Check IP Pools
```bash
/ip pool print
```

### Check Firewall Rules Order
```bash
/ip firewall filter print where chain=input
```

### Check Active VPN Connections
```bash
/ppp active print
```

## 🔍 Expected Configuration Results

### L2TP Server Configuration
```
enabled: yes
max-mtu: 1450
max-mru: 1450
authentication: pap,chap,mschap1,mschap2
use-ipsec: yes
ipsec-secret: MikroTik123!
default-profile: default-encryption
```

### VPN User Configuration
```
name=server-vpn
password=Server123!
service=l2tp
```

### IP Pool Configuration
```
name=vpn-pool
ranges=192.168.100.2-192.168.100.10
```

## 🚨 Critical Firewall Rule Order

**IMPORTANT**: VPN rules MUST come before the default drop rule:

```
# These rules MUST be before rule that drops external traffic
chain=input action=accept protocol=udp dst-port=500,4500
chain=input action=accept protocol=ipsec-esp  
chain=input action=accept protocol=udp dst-port=1701

# This rule blocks external traffic (must come AFTER VPN rules)
chain=input action=drop in-interface-list=!LAN
```

## 🧪 Testing the Setup

### Test VPN Connection
1. Connect to VPN using credentials above
2. Check assigned IP: Should be in range 192.168.100.2-192.168.100.10
3. Test API access: `telnet 192.168.100.1 8728`

### Test API Access
```bash
# From VPN-connected server
curl -v --connect-timeout 5 192.168.100.1:8728
```

## 🔧 Troubleshooting

### VPN Connection Issues
```bash
# Check if L2TP server is running
/interface l2tp-server server print

# Check firewall rules order
/ip firewall filter print where chain=input

# Check for active connections
/ppp active print
```

### API Access Issues
```bash
# Test API service
/ip service print where name=api

# Check API firewall rules
/ip firewall filter print where dst-port=8728
```

### Common Issues
1. **VPN rules after drop rule**: Move VPN rules before rule that drops external traffic
2. **Duplicate rules**: Clean up duplicate firewall rules
3. **Wrong credentials**: Verify VPN and API credentials match documentation

## 📝 Network Topology

```
Internet → MikroTik Router (Public IP) → L2TP/IPSec VPN Server
                ↓
Central Server connects via VPN → Gets IP 192.168.100.x
                ↓
Server accesses MikroTik API at 192.168.100.1:8728
                ↓
Token Management System can now manage router remotely
```

## 🔒 Security Notes

- Change default passwords in production
- Use strong pre-shared keys
- Limit VPN access to specific IP addresses if possible
- Monitor VPN connections regularly
- Keep RouterOS firmware updated

## 📋 Quick Reference

| Component | Value |
|-----------|-------|
| VPN Type | L2TP/IPSec |
| VPN Username | server-vpn |
| VPN Password | Server123! |
| Pre-shared Key | MikroTik123! |
| VPN IP Range | 192.168.100.2-192.168.100.10 |
| API Username | api-user |
| API Password | Password123! |
| API Port | 8728 |
| Local Network | 192.168.88.0/24 |
| VPN Network | 192.168.100.0/24 |

---

**✅ Your MikroTik router is now configured for secure remote VPN access!**

The central token management server can connect via VPN and manage hotspot tokens remotely through the RouterOS API.