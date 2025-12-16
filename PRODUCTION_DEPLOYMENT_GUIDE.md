# 🚀 Production Deployment Guide

Complete guide for deploying the MikroTik Token Management System to a remote server with VPN access.

## 📋 Server Information

- **Server IP**: `173.212.195.88`
- **OS**: Linux (Ubuntu/Debian recommended)
- **Access**: SSH as root
- **Domain**: Configure as needed

## 🔧 Pre-Deployment Setup

### 1. Server Preparation

```bash
# SSH to server
ssh root@173.212.195.88

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### 2. Firewall Configuration

```bash
# Allow SSH, HTTP, HTTPS
ufw allow 22
ufw allow 80
ufw allow 443
ufw allow 3000
ufw allow 5173
ufw --force enable
```

## 📁 Project Deployment

### 1. Transfer Project Files

**Option A: Direct Copy**
```bash
# From local machine
scp -r /Users/devoop/Dev/personal/mikrotik-token-manager root@173.212.195.88:/opt/
```

**Option B: Git Clone**
```bash
# On server
cd /opt
git clone [your-repository-url] mikrotik-token-manager
cd mikrotik-token-manager
```

### 2. Production Environment Configuration

```bash
# On server
cd /opt/mikrotik-token-manager

# Copy environment template
cp backend/.env.example backend/.env

# Edit production environment
nano backend/.env
```

**Production .env Configuration:**
```env
# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=mikrotik_tokens
DB_USER=postgres
DB_PASSWORD=ProductionPassword123!

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379

# Network Configuration
HOST_IP=173.212.195.88

# JWT Configuration
JWT_SECRET=production-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=24h

# Encryption Key
ENCRYPTION_KEY=production-32-char-encryption-key

# Server Configuration
PORT=3000
NODE_ENV=production

# Default Users (Change in production)
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=SecureAdmin123!
MANAGER_EMAIL=manager@yourdomain.com
MANAGER_PASSWORD=SecureManager123!
STAFF_EMAIL=staff@yourdomain.com
STAFF_PASSWORD=SecureStaff123!
```

### 3. Production Docker Compose

Create `docker-compose.prod.yml`:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: mikrotik_tokens
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ProductionPassword123!
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build: ./frontend
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
  redis_data:
```

## 🛡️ MikroTik Router Configuration

### 1. Allow Server Access

```bash
# From MikroTik terminal
/ip firewall filter add chain=input src-address=173.212.195.88 protocol=tcp dst-port=8728 action=accept place-before=0

# Allow VPN access from server
/ip firewall filter add chain=input src-address=173.212.195.88 protocol=udp dst-port=500,4500 action=accept place-before=0
/ip firewall filter add chain=input src-address=173.212.195.88 protocol=ipsec-esp action=accept place-before=0
/ip firewall filter add chain=input src-address=173.212.195.88 protocol=udp dst-port=1701 action=accept place-before=0
```

### 2. Update Router Configuration in Database

**Option A: Direct Access (Local Network)**
```bash
# Update router IP to local address
UPDATE routers SET ip_address = '192.168.88.1' WHERE name = 'Main Router';
```

**Option B: VPN Access (Remote)**
```bash
# Update router IP to VPN gateway
UPDATE routers SET ip_address = '192.168.100.1' WHERE name = 'Main Router';
```

## 🚀 Deployment Commands

### 1. Build and Start Services

```bash
# On server
cd /opt/mikrotik-token-manager

# Build and start in production mode
docker-compose -f docker-compose.prod.yml up -d --build

# Check services
docker-compose -f docker-compose.prod.yml ps
```

### 2. Initialize Database

```bash
# Run migrations
docker-compose -f docker-compose.prod.yml exec backend npm run migrate

# Seed initial users
docker-compose -f docker-compose.prod.yml exec backend node scripts/seed-users.js
```

### 3. Verify Deployment

```bash
# Check service health
curl http://173.212.195.88:3000/health

# Check frontend
curl http://173.212.195.88

# Check logs
docker-compose -f docker-compose.prod.yml logs backend
```

## 🔐 Security Configuration

### 1. SSL/TLS Setup (Recommended)

```bash
# Install Certbot
apt install certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d yourdomain.com

# Auto-renewal
crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 2. Nginx Reverse Proxy

Create `/etc/nginx/sites-available/mikrotik-tokens`:
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 3. Firewall Hardening

```bash
# Restrict SSH access
ufw limit 22

# Allow only necessary ports
ufw deny 3000  # Block direct backend access
ufw deny 5173  # Block direct frontend access

# Reload firewall
ufw reload
```

## 📊 Monitoring Setup

### 1. Log Management

```bash
# Configure log rotation
cat > /etc/logrotate.d/docker-containers << EOF
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    size=1M
    missingok
    delaycompress
    copytruncate
}
EOF
```

### 2. Health Monitoring

```bash
# Create monitoring script
cat > /opt/monitor-services.sh << 'EOF'
#!/bin/bash
cd /opt/mikrotik-token-manager
docker-compose -f docker-compose.prod.yml ps --services --filter "status=running" | wc -l
EOF

chmod +x /opt/monitor-services.sh

# Add to crontab for monitoring
crontab -e
# Add: */5 * * * * /opt/monitor-services.sh
```

## 🔄 Backup Strategy

### 1. Database Backup

```bash
# Create backup script
cat > /opt/backup-db.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose -f /opt/mikrotik-token-manager/docker-compose.prod.yml exec -T postgres pg_dump -U postgres mikrotik_tokens > /opt/backups/db_backup_$DATE.sql
find /opt/backups -name "db_backup_*.sql" -mtime +7 -delete
EOF

chmod +x /opt/backup-db.sh
mkdir -p /opt/backups

# Schedule daily backups
crontab -e
# Add: 0 2 * * * /opt/backup-db.sh
```

## 🧪 Testing Production Deployment

### 1. Connection Tests

```bash
# Test API health
curl http://173.212.195.88:3000/health

# Test frontend
curl -I http://173.212.195.88

# Test database connection
docker-compose -f docker-compose.prod.yml exec backend node -e "
import pool from './src/config/database.js';
pool.query('SELECT NOW()').then(r => console.log('DB OK:', r.rows[0])).catch(console.error);
"
```

### 2. VPN Connection Test

```bash
# From server, test VPN to MikroTik
# Configure VPN client on server first
```

### 3. Token Generation Test

1. Access `http://173.212.195.88`
2. Login with production credentials
3. Generate test token
4. Verify token appears on MikroTik: `/ip hotspot user print`

## 📋 Production Checklist

- [ ] Server prepared with Docker
- [ ] Project files deployed
- [ ] Environment variables configured
- [ ] Database initialized
- [ ] MikroTik firewall rules added
- [ ] Router IP updated in database
- [ ] SSL certificate installed
- [ ] Nginx reverse proxy configured
- [ ] Firewall hardened
- [ ] Monitoring setup
- [ ] Backup strategy implemented
- [ ] Connection tests passed
- [ ] Token generation tested

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   docker-compose -f docker-compose.prod.yml logs postgres
   ```

2. **API Connection Timeout**
   ```bash
   # Check MikroTik firewall rules
   /ip firewall filter print where dst-port=8728
   ```

3. **VPN Connection Issues**
   ```bash
   # Check VPN server status
   /interface l2tp-server server print
   /ppp active print
   ```

### Emergency Commands

```bash
# Restart all services
docker-compose -f docker-compose.prod.yml restart

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Emergency stop
docker-compose -f docker-compose.prod.yml down
```

## 📞 Support Information

- **Server IP**: `173.212.195.88`
- **Frontend URL**: `http://173.212.195.88`
- **API URL**: `http://173.212.195.88:3000`
- **VPN Credentials**: See REMOTE_VPN_ACCESS_SETUP.md
- **API Credentials**: `api-user` / `Password123!`

---

**✅ Production deployment complete!** Your MikroTik Token Management System is now running on the remote server with secure VPN access.