# Setup Guide

## Quick Start

### 1. Prerequisites

Ensure you have the following installed:
- **Node.js** 18+ (`node --version`)
- **PostgreSQL** 14+ (`psql --version`)
- **Redis** 6+ (`redis-cli --version`)

### 2. Database Setup

1. Create PostgreSQL database:
```bash
createdb mikrotik_tokens
```

2. Or using psql:
```sql
CREATE DATABASE mikrotik_tokens;
```

### 3. Redis Setup

Ensure Redis is running:
```bash
redis-server
```

Or if using a service:
```bash
brew services start redis  # macOS
sudo systemctl start redis  # Linux
```

### 4. Backend Setup

1. Navigate to backend:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Copy and configure environment:
```bash
cp .env.example .env
```

4. Edit `.env` with your settings:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mikrotik_tokens
DB_USER=postgres
DB_PASSWORD=your_actual_password

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

5. Run database migrations:
```bash
npm run migrate
```

6. Start backend server:
```bash
npm run dev
```

Backend will run on `http://localhost:3000`

### 5. Frontend Setup

1. Navigate to frontend (in a new terminal):
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

### 6. Create First Admin User

You can create the first admin user using the registration endpoint or directly in the database:

```sql
-- Hash a password first (use bcrypt or online tool)
-- Example password hash for "admin123" (DO NOT USE IN PRODUCTION)
INSERT INTO users (email, password_hash, role) 
VALUES (
  'admin@yourdomain.com',
  '$2a$10$YourHashedPasswordHere',
  'super_admin'
);
```

Or use the registration API endpoint (ensure it's protected or temporarily allow it).

## Next Steps

1. **Add Routers**: Configure your MikroTik routers in the database
2. **Create Staff Users**: Add staff members with assigned routers
3. **Configure Token Packages**: Customize token packages as needed
4. **Test Token Generation**: Generate test tokens from staff dashboard

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running: `pg_isready`
- Check database credentials in `.env`
- Ensure database exists: `psql -l | grep mikrotik_tokens`

### Redis Connection Issues
- Verify Redis is running: `redis-cli ping` (should return PONG)
- Check Redis host/port in `.env`

### MikroTik API Issues
- Verify router IP addresses are accessible
- Check API credentials are correct
- Ensure firewall allows API access from server IP
- Test connection manually using RouterOS API client

### Port Already in Use
- Backend (3000): Change `PORT` in `.env`
- Frontend (5173): Change port in `vite.config.js`

## Production Deployment

1. Set `NODE_ENV=production` in backend `.env`
2. Use strong, unique `JWT_SECRET`
3. Set up SSL/TLS certificates
4. Configure reverse proxy (nginx)
5. Use process manager (PM2) for backend
6. Set up database backups
7. Configure firewall rules
8. Enable rate limiting appropriately

