# 📋 Router Registration Values

## ✅ Mock MikroTik Router Status
- **Status**: ✅ Running
- **Container**: `mikrotik_mock_router`
- **Port**: `8728`
- **Accessible from**: `localhost` (host machine)

---

## 🔧 Values to Use for Router Registration

Use these values in the **Add New Router** form (Super Admin or Manager Dashboard):

### **Required Fields:**

| Field | Value |
|-------|-------|
| **Name** | `Mock Test Router` (or any name you prefer) |
| **Location** | `Test Lab` (or any location) |
| **IP Address** | `mock-routeros` (when backend is in Docker) or `localhost` (if backend runs directly on host) |
| **API Port** | `8728` |
| **API Username** | `admin` |
| **API Password** | `admin` (mock router accepts any password) |

### **Optional Fields (Zimbabwe Geography):**

| Field | Example Value |
|-------|---------------|
| **Province** | `Harare` (select from dropdown) |
| **District** | `Harare` (enabled after province selection) |
| **Town** | `Harare` (enabled after district selection) |
| **Router Model** | Leave empty (will auto-detect as `RB750Gr3`) |

---

## 📝 Quick Copy-Paste Values

### Option 1: Basic Registration (Docker)
```
Name: Mock Test Router
Location: Test Lab
IP Address: mock-routeros
API Port: 8728
API Username: admin
API Password: admin
```

### Option 2: With Zimbabwe Geography (Docker)
```
Name: Mock Test Router - Harare
Location: Harare Central
IP Address: mock-routeros
API Port: 8728
API Username: admin
API Password: admin
Province: Harare
District: Harare
Town: Harare
```

**Important**: Use `mock-routeros` (not `localhost`) when the backend runs in Docker, as the backend container needs to reach the mock router via the Docker network.

---

## 🔍 Connection Test

Before registering, click **"Test Connection"** button - it should show:
- ✅ Connection successful
- ✅ Router model: `RB750Gr3`
- ✅ Router identity: `MockRouterOS`

---

## 📍 Alternative IP Addresses

If `localhost` doesn't work, try:
- `127.0.0.1` (IPv4 localhost)
- `0.0.0.0` (might work in some configurations)

For Docker-to-Docker communication (if backend is also in Docker):
- `mock-routeros` (Docker service name)
- `172.21.0.6` (Docker internal IP - may change)

---

## 🎯 Available Provinces (Select One)

1. **Bulawayo**
2. **Harare** ← Good for testing
3. **Manicaland**
4. **Mashonaland Central**
5. **Mashonaland East**
6. **Mashonaland West**
7. **Masvingo**
8. **Matabeleland North**
9. **Matabeleland South**
10. **Midlands**

Each province will show its districts when selected.

---

## ✅ After Registration

Once registered, you can:
1. ✅ View router in the routers list
2. ✅ See router health status
3. ✅ Generate tokens that will be added to this router
4. ✅ View router statistics
5. ✅ Assign this router to staff members

---

## 🔧 Mock Router Details

- **Router Model**: RB750Gr3 (auto-detected)
- **Identity**: MockRouterOS
- **Firmware**: 6.49.7
- **Serial**: MOCK-12345678
- **Accepts**: Any username/password combination for testing

---

## 🐛 Troubleshooting

**Connection fails:**
- ✅ Check mock router is running: `docker ps | grep mock`
- ✅ Verify port 8728: `lsof -i :8728`
- ✅ Check logs: `docker logs mikrotik_mock_router`

**Port already in use:**
- The mock router container is already running on port 8728
- No action needed, just use `localhost:8728`

---

**Ready to register!** 🚀

Use the values above in the **Super Admin Dashboard** → **Routers** → **Add New Router** form.

