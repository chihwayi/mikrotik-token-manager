# MikroTik Token Management System

A professional centralized token management system for MikroTik routers designed for internet cafe businesses.

## 🎯 Overview

This system provides centralized token generation and management across multiple MikroTik routers with comprehensive business features including revenue tracking, staff management, and audit trails.

## ✨ Key Features

- **Centralized Management**: Control multiple MikroTik routers from one dashboard
- **Role-Based Access**: Super Admin, Manager, and Staff roles with appropriate permissions
- **Real-Time Integration**: Direct RouterOS API integration for instant token deployment
- **Revenue Tracking**: Complete financial oversight with reconciliation reports
- **Audit Trails**: Comprehensive logging for compliance and security
- **Modern Interface**: React-based responsive web application

## 🏗️ Architecture

```
React Frontend → Express.js API → RouterOS API → MikroTik Routers
                      ↓
              PostgreSQL + Redis
```

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Node.js, Express.js, PostgreSQL, Redis
- **Integration**: RouterOS API (node-routeros)
- **Security**: JWT authentication, bcrypt, helmet.js
- **Deployment**: Docker & Docker Compose

## 📋 System Requirements

- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Docker (recommended)
- MikroTik RouterOS 6.49+

## 🚀 Quick Start

### Docker Deployment (Recommended)

```bash
# Clone repository
git clone [repository-url]
cd mikrotik-token-manager

# Start all services
docker-compose up -d

# Initialize database
docker-compose exec backend npm run migrate
```

### Manual Installation

```bash
# Backend setup
cd backend
npm install
cp .env.example .env
# Configure .env file
npm run migrate
npm run dev

# Frontend setup
cd ../frontend
npm install
npm run dev
```

## 🔧 Configuration

### Environment Setup

Create `.env` file in backend directory:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mikrotik_tokens
DB_USER=postgres
DB_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Server
PORT=3000
NODE_ENV=development
```

### MikroTik Router Configuration

1. Enable RouterOS API service
2. Create API user with appropriate permissions
3. Configure firewall rules for API access
4. Set up hotspot system

## 📊 User Roles

### Super Admin
- Complete system access
- Router management
- User administration
- System configuration

### Manager
- Multi-location analytics
- Revenue reports
- Staff performance monitoring
- Router health oversight

### Staff
- Token generation interface
- Personal token history
- Daily revenue tracking
- Session management

## 🔐 Security Features

- JWT-based authentication
- Role-based access control
- Password encryption (bcrypt)
- API rate limiting
- Audit logging
- Secure router credential storage

## 📈 Business Features

- **Token Packages**: Pre-configured time/data/price combinations
- **Revenue Tracking**: Expected vs actual revenue monitoring
- **Reconciliation**: Automated daily variance reports
- **Analytics**: Comprehensive business intelligence
- **Multi-Location**: Centralized management across locations

## 🌐 Production Deployment

### Docker Production

```bash
# Production environment
NODE_ENV=production docker-compose up -d

# SSL/TLS setup recommended
# Use reverse proxy (nginx/traefik)
# Configure firewall rules
```

### Manual Production

1. Set `NODE_ENV=production`
2. Configure SSL certificates
3. Set up reverse proxy
4. Configure firewall
5. Set up monitoring
6. Configure backups

## 📚 API Documentation

### Authentication
- `POST /api/auth/login` - User authentication
- `GET /api/auth/me` - Get current user

### Token Management
- `POST /api/tokens/generate` - Generate new token
- `GET /api/tokens/my-tokens` - Get user's tokens
- `GET /api/tokens/all` - Get all tokens (admin)

### Router Management
- `GET /api/routers` - List routers
- `POST /api/routers` - Add router
- `POST /api/routers/:id/test` - Test connection

## 🔧 MikroTik Integration

The system integrates directly with MikroTik RouterOS via API:

- Automatic hotspot user creation
- Real-time usage monitoring
- Health status tracking
- Bandwidth and session management

## 📞 Support & Licensing

This is a commercial software solution. For:

- **Setup assistance**
- **Custom configurations** 
- **Production deployment**
- **Training and support**
- **Licensing information**

**Contact**: chihwayii@outlook.com

## ⚠️ Important Notes

- This system requires proper MikroTik router configuration
- Production deployment needs security hardening
- Regular backups are essential
- Monitor system resources in production

## 🏢 Use Cases

Perfect for:
- Internet cafes
- Hotspot providers
- Guest WiFi management
- Temporary access solutions
- Multi-location businesses

---

**Professional MikroTik token management made simple.** 

For complete setup guides, configuration details, and support, please contact me directly.