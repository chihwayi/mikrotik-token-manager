# 🔧 Production Configuration Updates

Replace localhost references with server IP `173.212.195.88` for production deployment.

## 📝 Files to Update

### 1. Backend Environment (.env)

```bash
# On server: /opt/mikrotik-token-manager/backend/.env
HOST_IP=173.212.195.88
```

### 2. Frontend API Configuration

**File**: `/opt/mikrotik-token-manager/frontend/src/services/api.js`

```javascript
// Replace localhost with server IP
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'http://173.212.195.88:3000/api'
  : 'http://localhost:3000/api';
```

### 3. Docker Compose Production

**File**: `/opt/mikrotik-token-manager/docker-compose.prod.yml`

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
    networks:
      - mikrotik_network

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - mikrotik_network

  backend:
    build: ./backend
    ports:
      - "173.212.195.88:3000:3000"
    environment:
      - NODE_ENV=production
      - HOST_IP=173.212.195.88
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    networks:
      - mikrotik_network

  frontend:
    build: ./frontend
    ports:
      - "173.212.195.88:80:80"
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - mikrotik_network

volumes:
  postgres_data:
  redis_data:

networks:
  mikrotik_network:
    driver: bridge
```

### 4. Nginx Configuration (if using)

**File**: `/etc/nginx/sites-available/mikrotik-tokens`

```nginx
server {
    listen 80;
    server_name 173.212.195.88;
    
    location / {
        proxy_pass http://173.212.195.88:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    location /api {
        proxy_pass http://173.212.195.88:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## 🚀 Quick Update Script

Create this script on the server:

```bash
#!/bin/bash
# File: /opt/update-production-config.sh

cd /opt/mikrotik-token-manager

# Update backend environment
sed -i 's/HOST_IP=.*/HOST_IP=173.212.195.88/' backend/.env

# Update frontend API base URL
sed -i "s|http://localhost:3000/api|http://173.212.195.88:3000/api|g" frontend/src/services/api.js

# Update any remaining localhost references
find . -type f -name "*.js" -o -name "*.jsx" -o -name "*.json" | xargs sed -i 's/localhost:3000/173.212.195.88:3000/g'
find . -type f -name "*.js" -o -name "*.jsx" -o -name "*.json" | xargs sed -i 's/localhost:5173/173.212.195.88:80/g'

echo "✅ Production configuration updated!"
```

## 🔄 Database Router Configuration

Update router IP in database:

```bash
# On server
docker-compose -f docker-compose.prod.yml exec -T backend node --input-type=module -e "
import pool from './src/config/database.js';
try {
  // For direct connection (if on same network)
  await pool.query('UPDATE routers SET ip_address = \$1 WHERE name = \$2', ['192.168.88.1', 'Main Router']);
  
  // OR for VPN connection (if using VPN)
  // await pool.query('UPDATE routers SET ip_address = \$1 WHERE name = \$2', ['192.168.100.1', 'Main Router']);
  
  console.log('✅ Router IP updated for production');
  process.exit(0);
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}
"
```

## 📋 Deployment Commands

```bash
# On server
cd /opt/mikrotik-token-manager

# Make update script executable
chmod +x /opt/update-production-config.sh

# Run configuration update
/opt/update-production-config.sh

# Build and deploy
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build

# Initialize database
docker-compose -f docker-compose.prod.yml exec backend npm run migrate
docker-compose -f docker-compose.prod.yml exec backend node scripts/seed-users.js

# Test deployment
curl http://173.212.195.88:3000/health
curl http://173.212.195.88
```

## ✅ Verification

After updates, verify:

1. **Frontend loads**: `http://173.212.195.88`
2. **API responds**: `http://173.212.195.88:3000/health`
3. **Login works**: Use production credentials
4. **Token generation**: Test with MikroTik connection

## 🔧 Environment Variables Summary

```env
# Production .env file
DB_HOST=postgres
DB_PORT=5432
DB_NAME=mikrotik_tokens
DB_USER=postgres
DB_PASSWORD=ProductionPassword123!

REDIS_HOST=redis
REDIS_PORT=6379

HOST_IP=173.212.195.88

JWT_SECRET=production-super-secret-jwt-key
JWT_EXPIRES_IN=24h

ENCRYPTION_KEY=production-32-char-encryption-key

PORT=3000
NODE_ENV=production

ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=SecureAdmin123!
MANAGER_EMAIL=manager@yourdomain.com
MANAGER_PASSWORD=SecureManager123!
STAFF_EMAIL=staff@yourdomain.com
STAFF_PASSWORD=SecureStaff123!
```

---

**Run the update script and deploy to production!**