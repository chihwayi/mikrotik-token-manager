# Network Architecture & Customer Login Page

## 🌐 Question 1: Website Access (Starlink vs Router Network)

### **The Answer: Both (or Either)**

The website can be accessed from **any network** - it depends on how you deploy it.

### **Deployment Options:**

#### **Option 1: Server on Starlink Network (Recommended)**

```
┌─────────────────────────────────────────┐
│         Starlink Network                │
│                                         │
│  ┌──────────────┐                      │
│  │   Server     │                      │
│  │  (Docker)    │                      │
│  │              │                      │
│  │ - Frontend   │                      │
│  │ - Backend    │                      │
│  │ - Database   │                      │
│  └──────┬───────┘                      │
│         │                               │
│         │ RouterOS API (Port 8728)     │
│         │                               │
└─────────┼───────────────────────────────┘
          │
          │ Internet/VPN
          │
┌─────────┼───────────────────────────────┐
│         ▼                               │
│   MikroTik Router Locations             │
│   (45 routers across Zimbabwe)          │
│                                         │
│   - Router 1 (Harare)                   │
│   - Router 2 (Bulawayo)                 │
│   - Router 3 (Mutare)                   │
│   - ...                                 │
└─────────────────────────────────────────┘
```

**Access Pattern:**
- ✅ Staff access website via Starlink (or any internet connection)
- ✅ Website hosted on server connected to Starlink
- ✅ Backend connects to routers via RouterOS API (over internet/VPN)
- ✅ Routers must be accessible from server (static IP or VPN)

**Requirements:**
- Server with static IP or dynamic DNS
- Routers must have internet access
- RouterOS API port (8728) accessible from server IP
- VPN recommended for security

#### **Option 2: Server on Router Network (Less Common)**

```
┌─────────────────────────────────────────┐
│      Router's Local Network             │
│                                         │
│  ┌──────────────┐                      │
│  │   Server     │                      │
│  │  (Docker)    │                      │
│  └──────┬───────┘                      │
│         │                               │
│         │ RouterOS API (Local)          │
│         │                               │
│  ┌──────▼───────┐                      │
│  │   MikroTik   │                      │
│  │    Router    │                      │
│  └──────────────┘                      │
│                                         │
│  WiFi Hotspot ← Customers connect here │
└─────────────────────────────────────────┘
```

**Access Pattern:**
- ⚠️ Staff must be on router's local network to access website
- ⚠️ Only works for single router location
- ⚠️ Not practical for 45 routers across Zimbabwe

**Not Recommended For:**
- Multiple locations
- Centralized management
- Remote staff access

#### **Option 3: Hybrid (Best for Production)**

```
┌─────────────────────────────────────────┐
│         Starlink Network                │
│                                         │
│  ┌──────────────┐                      │
│  │   Server     │ ◄── Staff access     │
│  │  (Docker)    │    (Starlink/Any)    │
│  └──────┬───────┘                      │
│         │                               │
└─────────┼───────────────────────────────┘
          │
          │ VPN/Internet
          │
┌─────────▼───────────────────────────────┐
│                                         │
│  ┌──────────────┐                      │
│  │   MikroTik   │                      │
│  │    Router    │                      │
│  └──────┬───────┘                      │
│         │                               │
│         │ RouterOS API                  │
│         │                               │
│  WiFi Hotspot ← Customers connect here │
│                                         │
│  (45 locations across Zimbabwe)         │
└─────────────────────────────────────────┘
```

**Access Pattern:**
- ✅ Staff access website from anywhere (Starlink, mobile data, etc.)
- ✅ Website/server on Starlink network
- ✅ Routers connected via VPN or public IP
- ✅ Secure communication between server and routers

### **Current Configuration:**

Looking at `docker-compose.yml`, the system is configured for **local deployment**:

```yaml
frontend:
  ports:
    - "5173:80"  # Accessible on localhost:5173

backend:
  ports:
    - "3000:3000"  # API on localhost:3000
```

**For Production:**
- Change to server's IP address
- Or use domain name with DNS
- Ensure routers can reach backend API

### **Key Points:**

1. **Website Access**: From **any network** where staff need access
   - Starlink ✅
   - Mobile data ✅
   - Router's WiFi ✅ (if configured)
   - Office network ✅

2. **Router Communication**: Backend must reach routers via RouterOS API
   - Routers need internet connection
   - Or VPN connection to server
   - RouterOS API (port 8728) must be accessible

3. **Security**: Use VPN for router connections
   - Don't expose RouterOS API to public internet
   - VPN tunnel between server and each router location
   - Firewall rules to restrict API access

---

## 🎨 Question 2: Customer Login Page

### **The Answer: MikroTik's Native Hotspot Login Page**

**You do NOT need to create a custom login page!** MikroTik RouterOS provides this automatically.

### **How It Works:**

#### **Step 1: Customer Connects to WiFi**
```
Customer Device
    │
    │ Connects to WiFi SSID
    │ (e.g., "Cafe_WiFi")
    ▼
MikroTik Router
    │
    │ Captive Portal Detects Connection
    │
    ▼
Redirects to Hotspot Login Page
```

#### **Step 2: MikroTik Shows Login Page**

When a customer connects to the WiFi hotspot, MikroTik **automatically**:

1. **Intercepts web traffic** (captive portal)
2. **Redirects to hotspot login page** (built into RouterOS)
3. **Shows login form** with username and password fields
4. **Validates credentials** against hotspot users
5. **Grants access** if credentials match

#### **Step 3: Customer Uses Voucher**

```
┌─────────────────────────────────────┐
│   MikroTik Hotspot Login Page       │
│   (RouterOS Native)                 │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Username: [___________]    │   │
│  │  Password: [___________]    │   │
│  │                             │   │
│  │  [  Login  ]                │   │
│  └─────────────────────────────┘   │
│                                     │
│  Customer enters voucher code as:   │
│  Username: VOUCHER123456            │
│  Password: VOUCHER123456            │
└─────────────────────────────────────┘
```

### **What You See (MikroTik Default):**

MikroTik's default hotspot login page looks like:

```
┌────────────────────────────────────────┐
│                                        │
│        [MikroTik Logo]                 │
│                                        │
│    Hotspot Authentication              │
│                                        │
│    Username: [___________]             │
│    Password: [___________]             │
│                                        │
│            [  Login  ]                 │
│                                        │
│    [Terms of Service]                  │
│                                        │
└────────────────────────────────────────┘
```

### **What This System Does:**

The system **does NOT create or modify the login page**. It only:

1. ✅ Creates hotspot users (vouchers) on the router
2. ✅ Sets time and data limits
3. ✅ Tracks usage and revenue
4. ✅ Monitors active sessions

**MikroTik RouterOS handles:**
- ✅ Login page display
- ✅ Authentication
- ✅ Session management
- ✅ Time/data limit enforcement
- ✅ Automatic logout when limits reached

### **Custom Login Page (Optional):**

If you want a **custom branded login page**, you can:

#### **Option 1: Use RouterOS HTML Templates**

MikroTik supports custom HTML login pages:

```
/ip/hotspot/profile/set default html-directory=hotspot
```

You can customize:
- Logo
- Colors
- Text
- Terms and conditions

But this is **MikroTik configuration**, not done by this system.

#### **Option 2: External Captive Portal**

For advanced customization, you could:
- Host custom login page on separate server
- Use RouterOS's redirect feature
- This system still manages vouchers

But this is **complex and usually unnecessary**.

### **What Happens When Customer Uses Voucher:**

```
1. Customer connects to WiFi
   ↓
2. Browser redirects to hotspot login (automatic)
   ↓
3. Customer enters voucher code (username & password)
   ↓
4. RouterOS validates against /ip/hotspot/user table
   ↓
5. If valid:
   - Session starts
   - Timer begins (e.g., 3 hours)
   - Data counter starts (e.g., 1.5GB)
   - Customer gets internet access
   ↓
6. RouterOS monitors:
   - Time remaining
   - Data used
   - Automatically disconnects when limit reached
```

### **System Monitoring:**

This system **syncs** with routers every 5 minutes to:
- Track which vouchers are active
- Monitor usage statistics
- Update token status in database
- But does NOT modify the login page

---

## 📋 Summary

### **Website Access:**
- ✅ Can be accessed from **Starlink** or **any network**
- ✅ Deploy server on Starlink network (recommended)
- ✅ Staff access from anywhere (Starlink, mobile, etc.)
- ✅ Backend connects to routers via RouterOS API (internet/VPN)

### **Customer Login Page:**
- ✅ **MikroTik's native hotspot login page** (built-in)
- ✅ **No custom page needed** - RouterOS handles it automatically
- ✅ This system only creates vouchers, doesn't modify login page
- ✅ Optional: Can customize via RouterOS HTML templates (separate configuration)

### **Network Flow:**

```
Staff Device (Any Network)
    │
    │ HTTP/HTTPS
    ▼
Website (Server on Starlink)
    │
    │ Backend API
    ▼
RouterOS API (Internet/VPN)
    │
    │ Creates hotspot user
    ▼
MikroTik Router
    │
    │ WiFi Hotspot
    ▼
Customer Device
    │
    │ Sees MikroTik Login Page (Automatic)
    │ Enters voucher code
    │
    ▼
Internet Access (via RouterOS)
```

---

## 🔧 Configuration Notes

### **For Production Deployment:**

1. **Server Setup:**
   ```yaml
   # Update docker-compose.yml
   frontend:
     ports:
       - "0.0.0.0:80:80"  # Accessible from any network
   
   backend:
     ports:
       - "0.0.0.0:3000:3000"
   ```

2. **Router Access:**
   - Ensure routers have internet access
   - Configure VPN tunnel (recommended)
   - Or use static IP with firewall rules
   - RouterOS API must be accessible from server IP

3. **Security:**
   - Use HTTPS for website access
   - VPN for router connections
   - Firewall rules to restrict API access
   - Regular security updates

The login page is handled entirely by MikroTik RouterOS - you don't need to create or modify it!

