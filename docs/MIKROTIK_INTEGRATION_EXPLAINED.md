# MikroTik Token Manager - How It Integrates with RouterOS

## Overview: Do MikroTik Routers Come with Token Generation?

**Yes, but it's manual!** MikroTik RouterOS has built-in Hotspot functionality that can create voucher codes (tokens), but it requires:

1. Manual configuration via Winbox/WebFig or RouterOS API
2. Individual user creation for each token
3. No centralized management across multiple routers
4. No revenue tracking or reporting
5. No staff management or audit trails

## How This System Takes Over

This MikroTik Token Manager system **leverages RouterOS's native Hotspot feature** but adds a complete business management layer on top of it.

---

## 🔄 The Integration Flow

### **What MikroTik RouterOS Provides (Native):**
- ✅ Hotspot user/voucher system (`/ip/hotspot/user`)
- ✅ Time limits (`limit-uptime`)
- ✅ Data limits (`limit-bytes-total`)
- ✅ User profiles
- ✅ Active user tracking
- ✅ RouterOS API for automation

### **What This System Adds (Business Layer):**
- ✅ Centralized token generation across multiple routers
- ✅ Package management (pre-defined time/data/price combinations)
- ✅ Staff role management (who generated which token)
- ✅ Revenue tracking and reporting
- ✅ Audit logs and transaction history
- ✅ Automatic router sync and monitoring
- ✅ Web-based dashboard for non-technical staff

---

## 🎯 How Token Generation Works

### **Before This System (Manual Process):**
```
1. Staff member needs voucher
2. Admin logs into Winbox/WebFig
3. Manually creates hotspot user with username/password
4. Sets time limit manually
5. Sets data limit manually
6. Gives voucher code to customer
7. No tracking of who created it or when
8. No revenue tracking
```

### **With This System (Automated Process):**
```
1. Staff logs into web dashboard
2. Selects pre-defined package (e.g., "3 Hours - 1.5GB - $2.50")
3. Clicks "Generate Token"
4. System automatically:
   - Generates unique voucher code
   - Connects to MikroTik router via RouterOS API
   - Creates hotspot user on router with:
     * Username = voucher code
     * Password = voucher code
     * Uptime limit = package duration
     * Data limit = package limit
   - Saves transaction in database
   - Records staff member who created it
   - Records expected revenue
   - Returns voucher code to staff
```

---

## 🔌 Technical Integration Details

### **RouterOS API Commands Used:**

When a token is generated, the system executes these RouterOS commands:

```bash
# 1. Check if default profile exists
/ip/hotspot/user/profile/print

# 2. Create profile if missing
/ip/hotspot/user/profile/add name=default shared-users=1

# 3. Create the voucher user
/ip/hotspot/user/add \
  name=VOUCHER123456 \
  password=VOUCHER123456 \
  limit-uptime=3h \
  limit-bytes-total=1572864 \
  profile=default
```

### **Where Tokens Are Stored:**

1. **On MikroTik Router** (Native Hotspot):
   - Stored in `/ip/hotspot/user` table
   - Active when user logs in
   - Automatically removed when time/data limit reached

2. **In This System's Database**:
   - Stored in `token_transactions` table
   - Links voucher code to package, staff, router, revenue
   - Tracks status (pending, active, expired, used)

---

## 📊 What Happens When a Customer Uses a Token

### **Customer Experience:**
1. Customer connects to WiFi hotspot
2. Sees MikroTik login page (RouterOS native)
3. Enters voucher code as username and password
4. Gets access according to package limits
5. RouterOS enforces time/data limits automatically

### **System Monitoring:**
Every 5 minutes, the system automatically:

1. **Syncs with Routers**:
   ```
   - Queries all routers for active hotspot users
   - Updates token status in database
   - Tracks usage statistics
   ```

2. **Updates Token Status**:
   - `pending` → `active` (when customer logs in)
   - `active` → `expired` (when time/data limit reached)

3. **Monitors Router Health**:
   - Checks if router is online
   - Gets active user count
   - Monitors CPU/memory usage

---

## 🎛️ RouterOS Configuration Requirements

### **What Must Be Pre-Configured on MikroTik Router:**

1. **Hotspot Interface** (One-time setup):
   ```
   /ip/hotspot/profile/add name=default shared-users=1
   /ip/hotspot/user/profile/add name=default
   ```

2. **RouterOS API Enabled**:
   ```
   /ip/service/enable api
   /ip/service/set api port=8728
   /user/add name=api-user password=secure-password group=full
   ```

3. **Network Access**:
   - Router must be accessible from this system's network
   - Firewall rules must allow RouterOS API port (8728)

### **What This System Automatically Handles:**
- ✅ Creates hotspot users (vouchers) automatically
- ✅ Creates default profile if missing
- ✅ Sets time and data limits per package
- ✅ Monitors active users
- ✅ Syncs usage data

---

## 🔄 Migration from Manual to Automated

### **If You're Currently Using Manual Voucher Generation:**

**Option 1: Gradual Migration**
- Keep existing vouchers on routers
- Start using this system for new vouchers
- Old vouchers continue working normally
- System only tracks new vouchers it creates

**Option 2: Full Migration**
- Export existing vouchers from RouterOS
- Import into system (would need custom script)
- All future vouchers managed through system

### **If Starting Fresh:**
- Just add routers to system
- System handles everything automatically
- No manual router configuration needed beyond initial setup

---

## 💡 Key Advantages

### **Over Manual RouterOS Management:**

1. **Centralized Control**: Manage multiple routers from one dashboard
2. **Staff-Friendly**: Non-technical staff can generate tokens easily
3. **Revenue Tracking**: Know exactly how much revenue each token generates
4. **Audit Trail**: See who created tokens, when, and for which router
5. **Package Management**: Pre-defined packages prevent errors
6. **Reporting**: Revenue reports, usage stats, reconciliation

### **Over MikroTik's Built-in Voucher System:**

1. **Multi-Router**: Works across multiple locations/routers
2. **Business Logic**: Links tokens to staff, revenue, packages
3. **Monitoring**: Automatic health checks and sync
4. **Web Interface**: Modern, responsive web dashboard
5. **Role-Based**: Staff, Manager, Super Admin access levels

---

## 🚀 System Capabilities

### **What This System Can Do:**

✅ **Create vouchers on routers automatically**
✅ **Sync active users from routers**
✅ **Track token usage and expiration**
✅ **Monitor router health and status**
✅ **Generate revenue reports**
✅ **Manage multiple routers centrally**
✅ **Assign staff to specific routers**
✅ **Track who generated which tokens**

### **What RouterOS Still Handles:**

✅ **Actual WiFi hotspot authentication**
✅ **Enforcing time/data limits**
✅ **Active session management**
✅ **Network routing and firewall**
✅ **All network functionality**

---

## 🔒 Security & Data Flow

```
┌─────────────────┐
│  Web Dashboard  │ (Staff logs in, generates token)
└────────┬────────┘
         │ HTTP/HTTPS
         ▼
┌─────────────────┐
│  Backend API    │ (Generates voucher code, saves to DB)
└────────┬────────┘
         │
         ├──► PostgreSQL (Stores transaction, revenue, audit)
         │
         └──► RouterOS API ───┐
                              ▼
                      ┌─────────────────┐
                      │ MikroTik Router │ (Creates hotspot user)
                      └────────┬────────┘
                               │
                               ▼
                    ┌──────────────────┐
                    │ Customer Uses     │
                    │ Voucher Code      │
                    └──────────────────┘
```

---

## 📝 Summary

**This system doesn't replace MikroTik's functionality** - it **enhances it** with business management features. The router still handles all network operations, but the system adds:

- Centralized token generation
- Revenue and staff tracking
- Multi-router management
- Automated monitoring and sync
- Business reporting

**Think of it like this**: MikroTik RouterOS is the engine, and this system is the dashboard and control panel that makes it easy to manage at scale.

