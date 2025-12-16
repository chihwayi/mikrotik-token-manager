# Hybrid Remote Setup for RouterOS 6+ and 7

## Solution: ZeroTier + Dynamic Connection Detection

ZeroTier works on both RouterOS 6 and 7, providing unified remote access.

## Setup Steps

### 1. Create ZeroTier Network
1. Go to https://my.zerotier.com
2. Create new network
3. Note Network ID (e.g., `a1b2c3d4e5f6g7h8`)
4. Set network to Private
5. Configure IP range (e.g., 192.168.100.0/24)

### 2. Server Setup
```bash
# Install ZeroTier
curl -s https://install.zerotier.com | sudo bash
sudo zerotier-cli join NETWORK_ID

# Authorize server in ZeroTier dashboard
# Note server ZeroTier IP (e.g., 192.168.100.1)
```

### 3. RouterOS 6 Setup
```bash
# Download ZeroTier package
/tool fetch url="https://download.zerotier.com/dist/zerotier-one_1.10.6_mips.ipk"

# Install (method varies by RouterOS 6.x version)
# For newer 6.x versions:
/system package install zerotier-one_1.10.6_mips.ipk

# Configure
/zerotier instance add name=zt1 network=NETWORK_ID
/zerotier instance enable zt1
```

### 4. RouterOS 7 Setup
```bash
# Built-in ZeroTier support
/zerotier instance add name=zt1 network=NETWORK_ID
/zerotier instance enable zt1
```

### 5. Authorize Devices
- Go to ZeroTier dashboard
- Authorize all MikroTik routers
- Note assigned IPs (192.168.100.x)

## Dynamic Connection System

The system now supports multiple connection methods with automatic fallback:

1. **ZeroTier** (primary for all RouterOS versions)
2. **Tailscale** (RouterOS 7+ only)
3. **VPN** (OpenVPN/WireGuard)
4. **Direct** (port forwarding/public IP)

## Implementation

### 1. Database Migration
```bash
cd backend
node migrations/run.js  # Runs new migration 004
```

### 2. Start Hybrid System
```bash
# Set environment variables
export ZEROTIER_NETWORK_ID=your_network_id
export ZEROTIER_API_SECRET=your_api_secret

# Start with ZeroTier support
docker-compose -f docker-compose.hybrid.yml up -d
```

### 3. Router Registration
When adding routers, specify all available connection methods:

```json
{
  "name": "Cafe-Router-1",
  "location": "Main Cafe",
  "ip_address": "203.0.113.1",        // Direct/public IP
  "zerotier_ip": "192.168.100.10",    // ZeroTier IP
  "tailscale_ip": "100.64.1.10",      // Tailscale IP (if RouterOS 7)
  "vpn_ip": "10.8.0.10",              // VPN IP (if configured)
  "connection_priority": "auto"        // auto, zerotier, tailscale, vpn, direct
}
```

### 4. Connection Testing
The system automatically tests all methods and uses the first successful one:

```bash
# Test all connection methods for a router
curl -X POST http://localhost:3000/api/routers/test-all-connections \
  -H "Content-Type: application/json" \
  -d '{"routerId": "router-uuid"}'  \
  -H "Authorization: Bearer your-jwt-token"
```

## RouterOS Configuration Scripts

### For RouterOS 6.x (ZeroTier)
```bash
# Method 1: Manual package install
/tool fetch url="https://download.zerotier.com/dist/zerotier-one_1.10.6_mips.ipk"
# Install via Files in Winbox, then reboot

# Method 2: Container (if supported)
/container add remote-image=zerotier/zerotier:latest interface=veth1 root-dir=zerotier
/container start 0
/container shell 0
# Inside container: zerotier-cli join NETWORK_ID
```

### For RouterOS 7.x (ZeroTier + Tailscale)
```bash
# ZeroTier (built-in)
/zerotier instance add name=zt1 network=NETWORK_ID
/zerotier instance enable zt1

# Tailscale (built-in)
/tailscale up auth-key=YOUR_AUTH_KEY
```

## Troubleshooting

### Check Connection Status
```bash
# View router connection status
GET /api/routers/:id/connection-status

# Response:
{
  "router_id": "uuid",
  "active_method": "zerotier",
  "last_successful": "2024-01-15T10:30:00Z",
  "methods": {
    "zerotier": { "status": "success", "ip": "192.168.100.10" },
    "direct": { "status": "timeout", "ip": "203.0.113.1" }
  }
}
```

### Force Connection Method
```bash
# Force specific connection method
PUT /api/routers/:id/connection-priority
{
  "priority": "zerotier"  // zerotier, tailscale, vpn, direct, auto
}
```