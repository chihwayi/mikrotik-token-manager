# Real MikroTik Router Registration

## ✅ Router Connection Test: SUCCESSFUL!

Your router is ready for registration.

## 📋 Registration Values

Use these values in **Super Admin Dashboard** → **Routers** → **Add New Router**:

### Required Fields:

| Field | Value |
|-------|-------|
| **Name** | `Main Router` (or your preferred name) |
| **Location** | Your physical location |
| **IP Address** | `192.168.88.1` (use this for local network access) |
| **API Port** | `8728` |
| **API Username** | `admin` |
| **API Password** | `Password123!` |

### Optional Fields:

| Field | Value |
|-------|-------|
| **Province** | Select from dropdown (e.g., Harare) |
| **District** | Select after choosing province |
| **Town** | Enter town name |
| **Router Model** | Leave empty (will auto-detect: RouterBOARD 962UiGS-5HacT2HnT) |

## 🌐 IP Address Selection

**Important:** Choose the correct IP based on where your backend is running:

### If backend is in Docker (current setup):
- **Use**: `192.168.1.138` (internet IP)
- **Why**: Docker container needs to reach router via your network
- Docker containers may not have access to `192.168.88.x` network directly

### If backend runs directly on your machine:
- **Use**: `192.168.88.1` (local IP)
- **Why**: Direct network access from your machine

## 🔍 Connection Test Results

✅ Connection successful
✅ Router Model: RouterBOARD 962UiGS-5HacT2HnT
✅ Serial: 8A770951C771
✅ Firmware: 6.44.1
✅ Hotspot configured (1 profile: default)
✅ Ready for token management

## 📝 Quick Registration Steps

1. Go to **Super Admin Dashboard**
2. Click **"Add New Router"** button
3. Fill in the form with values above
4. Click **"Test Connection"** - should show success
5. Click **"Create Router"** to register
6. Router will appear in your routers list

## 🔒 Security Note

- Your router API is accessible
- Consider restricting API access to specific IPs if needed
- Current setup allows API access from any IP (0.0.0.0)

To restrict API access:
```
/ip service set api address=192.168.88.0/24
```
This limits API access to your local network only.

## ✅ Next Steps

After registration:
1. Router will show as "Online"
2. Model will auto-detect
3. You can assign this router to staff
4. Staff can generate tokens that will be added to this router's hotspot users
5. Tokens will work immediately on this router

