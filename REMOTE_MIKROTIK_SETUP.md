# Remote MikroTik Connection Setup

## Overview
Connect MikroTik routers behind Starlink to your server remotely using VPN or cloud tunneling.

## Option 1: VPN Tunnel (Recommended)

### Server Setup (OpenVPN)
```bash
# 1. Start OpenVPN server
cd vpn-setup
docker-compose -f docker-compose.vpn.yml up -d

# 2. Initialize OpenVPN
docker run -v openvpn-data:/etc/openvpn --rm kylemanna/openvpn ovpn_genconfig -u udp://YOUR_SERVER_IP
docker run -v openvpn-data:/etc/openvpn --rm -it kylemanna/openvpn ovpn_initpki

# 3. Generate client certificates for each MikroTik
docker run -v openvpn-data:/etc/openvpn --rm -it kylemanna/openvpn easyrsa build-client-full mikrotik1 nopass
docker run -v openvpn-data:/etc/openvpn --rm kylemanna/openvpn ovpn_getclient mikrotik1 > mikrotik1.ovpn
```

### MikroTik Configuration
```bash
# Upload certificate and configure VPN client
/certificate import file-name=client.crt
/interface ovpn-client add \
  name=server-vpn \
  connect-to=YOUR_SERVER_IP \
  port=1194 \
  user=mikrotik1 \
  certificate=client.crt \
  add-default-route=no

# Enable VPN connection
/interface ovpn-client enable server-vpn
```

## Option 2: Tailscale (Easiest)

### Server Setup
```bash
# Install Tailscale on server
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# Add to docker-compose
services:
  tailscale:
    image: tailscale/tailscale:latest
    container_name: tailscale
    hostname: mikrotik-server
    environment:
      - TS_AUTHKEY=YOUR_AUTH_KEY
    volumes:
      - /var/lib/tailscale:/var/lib/tailscale
    cap_add:
      - NET_ADMIN
      - SYS_MODULE
    restart: unless-stopped
```

### MikroTik Setup
```bash
# Install Tailscale package on MikroTik (RouterOS v7+)
/system package update download
/system package enable tailscale
/system reboot

# Configure Tailscale
/tailscale up auth-key=YOUR_AUTH_KEY
```

## Option 3: ZeroTier (Alternative)

### Network Setup
1. Create ZeroTier network at my.zerotier.com
2. Install ZeroTier on server
3. Configure MikroTik with ZeroTier

### Server
```bash
curl -s https://install.zerotier.com | sudo bash
sudo zerotier-cli join NETWORK_ID
```

### MikroTik
```bash
# RouterOS v7+ has built-in ZeroTier support
/zerotier instance add name=zt1 network=NETWORK_ID
/zerotier instance enable zt1
```

## Option 4: Port Forwarding (Less Secure)

### Starlink Configuration
1. Access Starlink app/web interface
2. Enable port forwarding for RouterOS API port (8728)
3. Forward to MikroTik's local IP

### Security Considerations
- Change default API port
- Use strong passwords
- Enable API SSL
- Restrict API access by IP

```bash
# MikroTik security hardening
/ip service set api port=8729
/ip service set api-ssl port=8730 certificate=server.crt
/ip service disable api
/ip service enable api-ssl
```

## Recommended Approach: Tailscale

**Why Tailscale is best for your setup:**
- Zero configuration networking
- Works through NAT/firewalls (Starlink)
- Encrypted by default
- Easy management via web dashboard
- No port forwarding needed
- Works on RouterOS v7+

### Implementation Steps:

1. **Server Setup:**
```bash
# Install Tailscale
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# Get server IP
tailscale ip -4
```

2. **MikroTik Setup:**
```bash
# Enable Tailscale (RouterOS v7+)
/system package enable tailscale
/system reboot
/tailscale up auth-key=YOUR_AUTH_KEY
```

3. **Update System Configuration:**
```bash
# In your backend .env
MIKROTIK_CONNECTION_TYPE=tailscale
TAILSCALE_NETWORK=100.64.0.0/10
```

4. **Router Registration:**
- Use Tailscale IP addresses instead of public IPs
- Example: 100.64.1.2 instead of public IP

## Testing Connection

```bash
# Test from server to MikroTik
ping 100.64.1.2  # MikroTik Tailscale IP
telnet 100.64.1.2 8728  # Test API port

# Test API connection
node scripts/test-mikrotik-connection.js
```

## Troubleshooting

### Common Issues:
1. **Starlink CGNAT**: Use VPN/Tailscale, not port forwarding
2. **RouterOS Version**: Ensure v7+ for Tailscale/ZeroTier
3. **Firewall**: Check MikroTik firewall rules
4. **API Access**: Verify API user permissions

### Debug Commands:
```bash
# MikroTik diagnostics
/system resource print
/interface print
/ip address print
/tailscale status  # If using Tailscale
```