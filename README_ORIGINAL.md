# MikroTik Token Management System

A centralized token management system for monitoring and managing MikroTik routers across multiple locations. Designed for internet cafe businesses to track token generation, usage, revenue, and prevent staff corruption through comprehensive audit trails.

## Features

- **Centralized Token Management**: All tokens generated from central server, ensuring uniformity across all 45 routers
- **Role-Based Access Control**: Three distinct user roles (Super Admin, Manager, Staff)
- **Real-Time Monitoring**: Track token generation vs usage, bandwidth consumption, and router health
- **Anti-Corruption Mechanisms**: Immutable audit logs, session control, and automated reconciliation
- **Revenue Tracking**: Expected vs actual revenue tracking with variance detection
- **MikroTik Integration**: Seamless integration with RouterOS API for all router operations

## System Architecture

```
Client Layer (React Dashboards)
    ↓
API Gateway (Express.js)
    ↓
Business Logic Layer
    ↓
MikroTik Integration Layer
    ↓
Data Layer (PostgreSQL + Redis)
```

## Project Structure

```
mikrotik-token-manager/
├── backend/          # Node.js/Express API server
│   ├── src/
│   │   ├── config/      # Database & Redis config
│   │   ├── middleware/  # Auth, roles, audit
│   │   ├── models/      # Database models
│   │   ├── services/    # Business logic
│   │   ├── routes/      # API routes
│   │   └── server.js    # Entry point
│   └── migrations/      # Database migrations
└── frontend/        # React application
    └── src/
        ├── components/   # React components
        ├── services/     # API client
        └── context/      # Auth context
```

## Prerequisites

**For Docker setup (Recommended):**
- Docker Desktop (or Docker Engine + Docker Compose)
- 4GB+ RAM allocated to Docker

**For local development:**
- Node.js 18+ 
- PostgreSQL 14+
- Redis 6+
- MikroTik RouterOS API access (v6+)

## Installation

### Option 1: Docker (Recommended) 🐳

The easiest way to get started is using Docker Compose:

```bash
# Start all services (PostgreSQL, Redis, Backend, Frontend)
docker-compose up -d

# Run database migrations
docker-compose exec backend npm run migrate

# Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:3000
```

For development with hot reload:
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

See [README.DOCKER.md](./README.DOCKER.md) for detailed Docker instructions.

### Option 2: Local Development

#### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment file:
```bash
cp .env.example .env
```

4. Update `.env` with your database and configuration details

5. Ensure PostgreSQL and Redis are running locally

6. Run database migrations:
```bash
npm run migrate
```

7. Start the server:
```bash
npm run dev
```

#### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

## Database Schema

The system uses PostgreSQL with the following key tables:

- **users**: User accounts with role-based access
- **routers**: MikroTik router configurations
- **token_packages**: Uniform token packages across all routers
- **token_transactions**: Immutable audit log of all token operations
- **usage_logs**: Bandwidth and session data from routers
- **revenue_records**: Expected vs confirmed revenue tracking
- **reconciliation_reports**: Daily variance analysis
- **audit_logs**: System-wide action logging

See `backend/migrations/001_initial_schema.sql` for complete schema.

## User Roles

### Super Admin
- Full system access
- Database monitoring
- Event logs access
- System configuration
- Emergency override capabilities

### Manager
- Real-time dashboard for all locations
- Token generation vs usage reports
- Revenue analytics per location/staff
- Bandwidth consumption monitoring
- Discrepancy alerts

### Staff
- Token dispensing interface only
- View own generated tokens
- Today's revenue counter
- Session-based access with clock in/out

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration (admin only)

### Tokens
- `POST /api/tokens/generate` - Generate new token (staff)
- `GET /api/tokens/my-tokens` - Get staff's tokens
- `GET /api/tokens/all` - Get all tokens (manager/admin)

## MikroTik Integration

The system uses the `node-routeros` library to connect to MikroTik routers via RouterOS API. Each router requires:

- Static IP address or VPN connection
- API user credentials
- Firewall rule allowing API access from central server

## Security Features

- JWT-based authentication
- Role-based access control
- Immutable audit logs
- Rate limiting
- Helmet.js security headers
- Password hashing with bcrypt

## Development

### Backend Development
```bash
cd backend
npm run dev  # Starts with nodemon for auto-reload
```

### Frontend Development
```bash
cd frontend
npm run dev  # Starts Vite dev server on port 5173
```

## Production Deployment

1. Set `NODE_ENV=production` in backend `.env`
2. Build frontend: `cd frontend && npm run build`
3. Serve frontend build files with a web server (nginx, etc.)
4. Use PM2 or similar for backend process management
5. Set up SSL certificates
6. Configure firewall rules for database and Redis access

## License

ISC

## Support

For issues and questions, please refer to the project documentation or contact the development team.

