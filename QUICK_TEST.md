# Quick Test Guide - Mock MikroTik Router

## 🚀 Mock Router is Running!

The mock MikroTik RouterOS API server is now available for testing.

## ✅ Current Status

- ✅ Mock RouterOS Server: Running on port 8728
- ✅ Backend API: Running on port 3000  
- ✅ Frontend: Running on port 5173
- ✅ Database: Running and migrated

## 🧪 Quick Test Steps

### 1. Add Mock Router to System

**Via Frontend:**
1. Go to http://localhost:5173
2. Login as super admin (create one if needed)
3. Navigate to "Routers" tab
4. Add router with:
   - **IP Address**: `localhost` (or `mock-routeros` if using Docker network)
   - **Port**: `8728`
   - **Username**: `admin`
   - **Password**: `admin`

**Via API:**
```bash
# First, get auth token by logging in
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password"}' | jq -r '.token')

# Add router
curl -X POST http://localhost:3000/api/routers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mock Router",
    "location": "Test Lab",
    "ip_address": "localhost",
    "api_port": 8728,
    "api_username": "admin",
    "apiPassword": "admin"
  }'
```

### 2. Create Staff User

```bash
curl -X POST http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "staff@test.com",
    "password": "password123",
    "role": "staff",
    "assignedRouterId": "ROUTER_ID_FROM_STEP_1"
  }'
```

### 3. Test Token Generation

1. Login as staff user
2. Select a package
3. Click "Generate Token"
4. ✅ Check mock router console - should show user added!

### 4. Verify Token on Router

```bash
# Get active users from router
curl http://localhost:3000/api/routers/ROUTER_ID/active-users \
  -H "Authorization: Bearer $TOKEN"
```

## 📊 Mock Router Console

Watch the mock router logs:
```bash
docker-compose logs -f mock-routeros
```

You should see:
```
[MockRouterOS] ✅ Client connected
[MockRouterOS] 🔐 User authenticated: admin
[MockRouterOS] ✅ Hotspot user added: ABC1-DEF2-GHI3
```

## 🎯 What to Test

1. ✅ **Router Connection** - Add router, verify connection test passes
2. ✅ **Token Generation** - Generate token, verify it's added to router
3. ✅ **Active Users** - Check active users endpoint
4. ✅ **Router Stats** - Get CPU, memory, uptime stats
5. ✅ **Health Monitoring** - Verify router shows as online
6. ✅ **Multiple Tokens** - Generate multiple tokens, verify all appear

## 🔍 Verify Everything Works

### Check Mock Router Status
```bash
docker-compose ps mock-routeros
# Should show: Up and running
```

### Check Mock Router Logs
```bash
docker-compose logs mock-routeros --tail=50
# Should show server started and ready
```

### Test Direct Connection
```bash
cd mock-routeros
npm test
# Should connect and run tests successfully
```

## 🐛 Troubleshooting

**Mock router not starting:**
```bash
docker-compose up -d mock-routeros
docker-compose logs mock-routeros
```

**Connection refused:**
- Verify mock router is running: `docker-compose ps`
- Check port 8728 is not blocked
- Try connecting from backend container

**Authentication fails:**
- Mock server accepts ANY credentials
- Try admin/admin or test/test
- Check mock server logs for details

## ✨ Success Indicators

When everything works:
- ✅ Router appears in dashboard
- ✅ Router status shows "Online" (green)
- ✅ Token generation succeeds
- ✅ Mock router console shows user added
- ✅ Active users endpoint returns token
- ✅ Router stats endpoint returns data

## 🎉 Next Steps

Once testing is complete:
1. The system works identically with real MikroTik routers
2. Just replace `localhost` with real router IP
3. Update credentials to real router credentials
4. Everything else stays the same!

---

**The mock router is ready for testing!** 🚀


