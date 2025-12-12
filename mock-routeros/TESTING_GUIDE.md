# Testing Guide - Mock MikroTik Router

## Quick Start

### 1. Start Mock Router Server

**Option A: Using Docker (Recommended)**
```bash
cd /Users/devoop/Dev/personal/mikrotik-token-manager
docker-compose up -d mock-routeros
```

**Option B: Standalone**
```bash
cd mock-routeros
npm install
npm start
```

### 2. Add Mock Router to Your Application

1. **Login as Super Admin**
   - Go to http://localhost:5173
   - Login with super admin credentials

2. **Add Router**
   - Navigate to "Routers" tab
   - Click "Add Router" (or use API directly)
   - Enter:
     ```
     Name: Mock Router
     Location: Test Lab
     IP Address: localhost (or mock-routeros if using Docker)
     API Port: 8728
     Username: admin
     Password: admin
     ```
   - Click "Add" - system will test connection automatically

3. **Verify Connection**
   - Router should appear in the list
   - Status should show "Online" (green indicator)
   - You can click "Test Connection" to verify

### 3. Test Token Generation

1. **Create Staff User**
   - Go to "Users" tab
   - Create a staff user
   - Assign the mock router to the staff user

2. **Login as Staff**
   - Logout and login as staff
   - Select a package
   - Click "Generate Token"

3. **Verify Token Created**
   - Check mock router console logs
   - Should see: `✅ Hotspot user added: [VOUCHER_CODE]`
   - Token appears in staff dashboard
   - Token is now "active" on mock router

### 4. Test Router Operations

**Get Router Stats:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/routers/ROUTER_ID/stats
```

**Get Active Users:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/routers/ROUTER_ID/active-users
```

**Sync Router Data:**
```bash
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/routers/ROUTER_ID/sync
```

## Testing Scenarios

### Scenario 1: Basic Token Generation
1. Add mock router
2. Create staff user assigned to router
3. Generate token
4. ✅ Verify token appears in mock router
5. ✅ Verify token shows as "active"

### Scenario 2: Multiple Routers
1. Start multiple mock servers on different ports:
   ```bash
   MOCK_ROUTEROS_PORT=8729 npm start  # Terminal 2
   MOCK_ROUTEROS_PORT=8730 npm start  # Terminal 3
   ```
2. Add each as separate router
3. Generate tokens for different routers
4. ✅ Verify each router maintains separate user list

### Scenario 3: Router Health Monitoring
1. Add router
2. Check router health status
3. ✅ Should show "Online"
4. Stop mock server
5. ✅ Health check should show "Offline"

### Scenario 4: Token Limits
1. Generate token with 1 hour limit
2. ✅ Verify limit-uptime is set correctly
3. Generate token with 500MB limit
4. ✅ Verify limit-bytes-total is set correctly

## Mock Server Features

✅ **Hotspot User Management**
- Add/remove users
- List all users
- Set time and data limits

✅ **Active Sessions**
- Track active hotspot sessions
- Simulate active users

✅ **Router Information**
- Router identity
- Model information
- Firmware version

✅ **Router Statistics**
- CPU usage (simulated)
- Memory usage (simulated)
- Uptime

✅ **Profile Management**
- Create hotspot profiles
- List profiles

## Troubleshooting

### Connection Refused
```bash
# Check if mock server is running
docker-compose ps mock-routeros

# Check logs
docker-compose logs mock-routeros

# Restart if needed
docker-compose restart mock-routeros
```

### Authentication Failed
- Mock server accepts ANY credentials
- Try: admin/admin or test/test
- Check mock server logs for authentication attempts

### Users Not Appearing
- Check mock server console for errors
- Verify router IP is correct (localhost or mock-routeros)
- Check port is 8728
- Verify backend can reach mock server

### Port Already in Use
```bash
# Use different port
MOCK_ROUTEROS_PORT=8729 npm start

# Update router IP to use new port
# Or stop service using port 8728
```

## Integration Testing

### Test Full Flow
1. ✅ Add router → Connection test passes
2. ✅ Generate token → User added to router
3. ✅ View active users → Token appears
4. ✅ Check router stats → Data returned
5. ✅ Sync router → Data synchronized

### Test Error Handling
1. Stop mock server
2. Try to generate token
3. ✅ Should show error message
4. Start mock server
5. ✅ Should work again

## Mock Server Console Output

When working correctly, you'll see:
```
[MockRouterOS] ✅ Client connected
[MockRouterOS] 🔐 User authenticated: admin
[MockRouterOS] ✅ Hotspot user added: ABC1-DEF2-GHI3
   Profile: default, Uptime: 1h, Data: 1048576
```

## Next Steps

Once testing is complete:
1. Replace mock router IP with real MikroTik router IP
2. Update credentials to real router credentials
3. System will work identically with real hardware!

