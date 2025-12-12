# MikroTik RouterOS Integration Testing Guide

This guide explains how to test the MikroTik RouterOS API integration using the mock router or a real MikroTik device.

## 🚀 Quick Start - Testing with Mock Router

### Step 1: Start Mock Router Service

The mock-routeros service should already be running. Check status:

```bash
docker-compose ps mock-routeros
```

If not running, start it:

```bash
docker-compose up -d mock-routeros
```

### Step 2: Run Integration Test Script

```bash
cd backend
node scripts/test-mikrotik-connection.js
```

This script will:
- ✅ Test connection to mock router
- ✅ Add router to database
- ✅ Fetch router information
- ✅ Create test package
- ✅ Generate a test token
- ✅ Verify token was added to router
- ✅ Check active users

## 📡 Testing with Real MikroTik Router

### Prerequisites

1. **MikroTik Router with RouterOS 6.0+**
2. **API access enabled** (enabled by default on RouterOS)
3. **API user credentials** (or admin credentials)

### Step 1: Prepare Your Router

1. **Enable API Access** (if not already enabled):
   ```
   /ip service enable api
   ```

2. **Create API User** (recommended, not required):
   ```
   /user add name=api-test password=your-password group=full
   ```

3. **Verify API is Running**:
   ```
   /ip service print
   ```
   Look for `api` service on port 8728

4. **Get Router IP Address**:
   ```
   /ip address print
   ```

### Step 2: Add Router via Dashboard

1. **Login** to Manager or Super Admin dashboard
2. **Navigate** to Routers tab
3. **Click** "Add New Router"
4. **Fill in details**:
   - **Router Name**: e.g., "Main Office Router"
   - **Location**: e.g., "Main Office"
   - **IP Address**: Your router's IP (e.g., `192.168.88.1`)
   - **API Port**: `8728` (default)
   - **API Username**: `admin` (or your API user)
   - **API Password**: Your router password
   - **Province**: Select province
   - **District**: Select district (after province)
   - **Town**: Enter town name
   - **Location**: Auto-filled from province/district/town

5. **Click** "Test Connection" button
6. **Verify** connection success message
7. **Click** "Create Router"

### Step 3: Test Router Connection via API

```bash
# Set environment variables for real router
export MOCK_ROUTER_IP=192.168.88.1  # Your router IP
export MOCK_ROUTEROS_PORT=8728

# Run test script (modify to use real router IP)
cd backend
node scripts/test-mikrotik-connection.js
```

### Step 4: Generate Test Token

1. **Login** as Staff user (assigned to the router)
2. **Navigate** to Token Generator
3. **Select** a package
4. **Click** "Generate Token"
5. **Verify**:
   - Token code is displayed
   - Success message appears
   - Token appears in "My Tokens" list

### Step 5: Verify Token on Router

SSH into your MikroTik router and check:

```
/ip hotspot user print
```

You should see the generated voucher code with:
- Name = voucher code
- Password = voucher code
- Limit Uptime = package duration
- Limit Bytes Total = package data limit
- Profile = default (or custom profile)

### Step 6: Test Token Usage

1. **Connect** a device to the router's hotspot network
2. **Open** browser (should redirect to hotspot login)
3. **Enter** the voucher code as both username and password
4. **Verify** connection is established

## 🔧 Troubleshooting

### Connection Issues

**Problem**: "Connection test failed"

**Solutions**:
- ✅ Verify router IP address is correct and reachable
- ✅ Check if API service is enabled: `/ip service enable api`
- ✅ Verify firewall isn't blocking port 8728
- ✅ Test with RouterOS Winbox or API tool
- ✅ Check username/password are correct
- ✅ Verify API user has proper permissions

### Token Generation Issues

**Problem**: "Failed to add hotspot user"

**Solutions**:
- ✅ Verify router has hotspot configured
- ✅ Check if default profile exists
- ✅ Verify API user has write permissions
- ✅ Check router logs: `/log print where topics~"hotspot"`

### Active Users Not Showing

**Problem**: "No active users found"

**Solutions**:
- ✅ Token may not be in use yet (normal for unused tokens)
- ✅ Check router hotspot active sessions: `/ip hotspot active print`
- ✅ Verify hotspot server is running: `/ip hotspot print`

## 📊 Testing Checklist

- [ ] Mock router service is running
- [ ] Integration test script completes successfully
- [ ] Router added to database via dashboard
- [ ] Connection test succeeds
- [ ] Router info fetched correctly
- [ ] Package created and active
- [ ] Staff user assigned to router
- [ ] Token generated successfully
- [ ] Token appears in router's hotspot users
- [ ] Token can be used to connect
- [ ] Active users are tracked
- [ ] Router statistics are fetched

## 🔐 Security Notes

1. **Never commit** router passwords to git
2. **Use encrypted passwords** in database (automatically handled)
3. **Create dedicated API users** with minimal required permissions
4. **Use firewall rules** to restrict API access if needed
5. **Regularly rotate** API passwords

## 📝 API Endpoints Tested

The integration test verifies these RouterOS API endpoints:

- `/login` - Authentication
- `/system/identity/print` - Router identity
- `/system/routerboard/print` - Router hardware info
- `/system/resource/print` - Router statistics
- `/ip/hotspot/user/profile/print` - List profiles
- `/ip/hotspot/user/profile/add` - Create profile
- `/ip/hotspot/user/add` - Add hotspot user (token)
- `/ip/hotspot/user/print` - List hotspot users
- `/ip/hotspot/active/print` - List active sessions

## 🎯 Next Steps

After successful testing:

1. **Configure** hotspot on real router
2. **Create** production packages
3. **Assign** routers to staff members
4. **Train** staff on token generation
5. **Monitor** router health and statistics
6. **Set up** alerts for offline routers


