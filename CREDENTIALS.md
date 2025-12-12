# 🔐 Application Credentials

## ✅ System Status: RUNNING

All services are operational and ready to use!

## 📋 Login Credentials

### Super Admin
**Full system access - Router management, user management, system configuration**

- **Email**: `admin@mikrotik.local`
- **Password**: `Admin123!`
- **Access**: http://localhost:5173 (redirects to Super Admin Dashboard)

### Manager
**Analytics and monitoring - View all routers, tokens, revenue**

- **Email**: `manager@mikrotik.local`
- **Password**: `Manager123!`
- **Access**: http://localhost:5173 (redirects to Manager Dashboard)

### Staff
**Token generation only - Generate tokens for assigned router**

- **Email**: `staff@mikrotik.local`
- **Password**: `Staff123!`
- **Access**: http://localhost:5173 (redirects to Staff Dashboard)

## 🚀 Quick Start

1. **Open Application**
   ```
   http://localhost:5173
   ```

2. **Login**
   - Use any of the credentials above
   - System will redirect to appropriate dashboard based on role

3. **First Steps**
   - **Super Admin**: Add a router (use mock router: `localhost:8728`)
   - **Manager**: View analytics and router status
   - **Staff**: Generate tokens (after router is assigned)

## 🔗 Service URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Health**: http://localhost:3000/health
- **Mock RouterOS**: localhost:8728

## 🧪 Testing with Mock Router

### Add Mock Router (Super Admin)
1. Login as Super Admin
2. Go to "Routers" tab
3. Click "Add Router"
4. Enter:
   - **Name**: Mock Router
   - **Location**: Test Lab
   - **IP Address**: `localhost`
   - **API Port**: `8728`
   - **Username**: `admin`
   - **Password**: `admin`

### Assign Router to Staff (Super Admin)
1. Go to "Users" tab
2. Find `staff@mikrotik.local`
3. Assign the mock router to staff user

### Generate Token (Staff)
1. Login as Staff
2. Select a package
3. Click "Generate Token"
4. ✅ Token is automatically added to mock router!

## 📊 Default Token Packages

The system comes with 4 pre-configured packages:

1. **1 Hour Package** - $1.00 (1h, 500MB)
2. **3 Hours Package** - $2.50 (3h, 1.5GB)
3. **Daily Package** - $5.00 (24h, 5GB)
4. **Weekly Package** - $15.00 (168h, 20GB)

## 🔄 Reset Users (if needed)

To re-seed users:
```bash
docker-compose exec backend npm run seed
```

## ⚠️ Security Note

These are **default test credentials**. Change them in production!

## 📝 Next Steps

1. ✅ Login and explore dashboards
2. ✅ Add mock router for testing
3. ✅ Assign router to staff
4. ✅ Generate test tokens
5. ✅ View analytics and reports

---

**🎉 Your MikroTik Token Manager is ready to use!**


