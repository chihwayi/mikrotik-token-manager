# 🚀 Quick Test: MikroTik Integration

## Prerequisites

1. **Start all services**:
   ```bash
   docker-compose up -d
   ```

2. **Verify mock router is running**:
   ```bash
   docker-compose ps mock-routeros
   ```
   Should show `Up` status on port `8728`

## Test Steps

### Option 1: Automated Test Script (Recommended)

```bash
cd backend
npm run test:mikrotik
```

This will automatically:
- ✅ Connect to mock router (localhost:8728)
- ✅ Add router to database
- ✅ Fetch router information
- ✅ Create test package
- ✅ Generate test token
- ✅ Verify token on router

### Option 2: Manual Test via Dashboard

1. **Start services**:
   ```bash
   docker-compose up -d
   ```

2. **Login** to Manager or Super Admin dashboard:
   - URL: http://localhost:5173
   - Use seeded credentials (see CREDENTIALS.md)

3. **Add Mock Router**:
   - Go to "Routers" tab
   - Click "Add New Router"
   - Fill in:
     - **Name**: "Test Mock Router"
     - **Location**: "Test Lab"
     - **IP Address**: `mock-routeros` (or `localhost` if running locally)
     - **API Port**: `8728`
     - **API Username**: `admin`
     - **API Password**: `admin` (any password works)
     - **Province**: Select any
     - **District**: Select any
     - **Town**: Enter any
   - Click "Test Connection" (should succeed ✅)
   - Click "Create Router"

4. **Create Package** (if not exists):
   - Go to "Packages" tab
   - Click "Add New Package"
   - Fill in:
     - **Name**: "Test 1 Hour"
     - **Duration**: `1` hour
     - **Data Limit**: `500` MB
     - **Price**: `1.00`
   - Click "Create Package"

5. **Assign Router to Staff**:
   - Go to "Users" tab
   - Find a staff user
   - Click "Assign Router"
   - Select the mock router
   - Click "Assign"

6. **Generate Token**:
   - Login as Staff user
   - Go to Token Generator
   - Select the test package
   - Click "Generate Token"
   - ✅ Token should be generated and added to router!

## Verify Token on Mock Router

Check mock router logs:
```bash
docker-compose logs -f mock-routeros
```

You should see:
```
[MockRouterOS] ✅ Hotspot user added: VOUCHER-XXXXXX
   Profile: default, Uptime: 1h, Data: 524288000
```

## Test with Real MikroTik Router

To test with a real router, simply use the router's actual IP address instead of `mock-routeros`:

1. **Get your router's IP** (e.g., `192.168.88.1`)
2. **Add router** with real IP in dashboard
3. **Use real credentials** for your router
4. **Follow same steps** as mock router test

## Troubleshooting

**Mock router not accessible?**
```bash
# Check if running
docker-compose ps mock-routeros

# Restart if needed
docker-compose restart mock-routeros

# Check logs
docker-compose logs mock-routeros
```

**Connection test fails?**
- Verify mock router is running: `docker-compose ps mock-routeros`
- Check network connectivity: `docker network ls`
- Try IP `localhost` instead of `mock-routeros`

**Token generation fails?**
- Verify router is assigned to staff user
- Check package is active
- Verify router connection is successful
- Check backend logs: `docker-compose logs backend`

## Expected Results

✅ Connection test succeeds
✅ Router info shows: MockRouterOS, RB750Gr3
✅ Router stats show CPU, memory, uptime
✅ Token generation creates voucher code
✅ Token appears in router's hotspot users
✅ Active users can be queried

## Next Steps

After successful test:
1. Configure real MikroTik router
2. Set up production packages
3. Train staff on system
4. Monitor router health

See `TEST_MIKROTIK.md` for detailed documentation.


