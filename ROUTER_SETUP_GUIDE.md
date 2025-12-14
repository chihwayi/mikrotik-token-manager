# MikroTik Router Setup Guide

## Before Testing - Enable RouterOS API

Your MikroTik router needs the API service enabled before you can register it in the system.

### Option 1: Using Winbox/WebFig (Recommended)

1. **Connect to your router:**
   - Open Winbox or access via browser: `http://192.168.88.1`
   - Login with your credentials

2. **Enable API Service:**
   - Go to: **IP → Services**
   - Find **api** in the list
   - Double-click it
   - Check **"Enabled"**
   - Click **OK**

3. **Verify API is running:**
   - The **api** service should show status: **running**
   - Port should be: **8728** (default)

4. **API User Configuration:**
   - The API uses the same credentials as your router login
   - For RouterOS v6.44.3, plaintext login is supported
   - Username: `admin` (or your login username)
   - Password: `Password123!` (your current password)

### Option 2: Using Terminal/SSH

If you have SSH access to the router:

```bash
# Connect via SSH
ssh admin@192.168.88.1

# Enable API service
/ip service enable api

# Verify it's running
/ip service print
```

You should see:
```
0   name=api port=8728 address=0.0.0.0 disabled=no
```

### Option 3: Using Command Line (from your computer)

If Winbox is not available, you can use MikroTik's command line tools or test directly:

```bash
# Test if API is accessible
telnet 192.168.88.1 8728
# Or
nc -zv 192.168.88.1 8728
```

## Register Router in System

Once API is enabled, register your router using:

**Router Registration Values:**
- **Name:** Your router name (e.g., "Main Office Router")
- **Location:** Physical location
- **IP Address:** `192.168.88.1` (use local IP for local network access)
  - **Note:** If testing from Docker/remote, you may need to use `192.168.1.138` (internet IP)
- **API Port:** `8728` (default)
- **API Username:** `admin` (or your router username)
- **API Password:** `Password123!`
- **Province/District/Town:** Select from dropdowns
- **Router Model:** Will auto-detect after registration

## Testing Connection

After registration:
1. Click **"Test Connection"** button
2. Should see: "Connection successful"
3. Router status should show: "Online"
4. Router model should auto-detect

## Troubleshooting

**If connection fails:**

1. **Check API is enabled:**
   ```bash
   /ip service print | grep api
   ```

2. **Check firewall rules:**
   - Make sure port 8728 is not blocked
   - Check: **IP → Firewall → Filter Rules**

3. **Network accessibility:**
   - From Docker: Use `192.168.1.138` (internet IP) if router is on different network
   - From local: Use `192.168.88.1` (local IP)
   - Make sure backend can reach the router

4. **Test from backend container:**
   ```bash
   docker-compose exec backend node -e "
   const { RouterOSAPI } = require('node-routeros');
   const conn = new RouterOSAPI({
     host: '192.168.88.1',
     user: 'admin',
     password: 'Password123!',
     port: 8728
   });
   conn.connect().then(() => {
     console.log('✅ Connection successful!');
     return conn.write('/system/identity/print');
   }).then(identity => {
     console.log('Router identity:', identity);
     conn.close();
   }).catch(err => {
     console.error('❌ Connection failed:', err.message);
   });
   "
   ```

## Security Note

- RouterOS API uses plaintext password authentication
- Only enable API on trusted networks
- Consider creating a separate API user with limited permissions
- API should ideally be restricted to specific IP addresses

