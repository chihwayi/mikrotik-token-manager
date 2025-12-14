# Docker Setup Guide

This project is fully containerized using Docker and Docker Compose.

## Prerequisites

- Docker Desktop (or Docker Engine + Docker Compose)
- At least 4GB RAM allocated to Docker

## Quick Start

### 1. Start All Services

```bash
docker-compose up -d
```

This will start:
- PostgreSQL database (port 5432)
- Redis cache (port 6379)
- Backend API (port 3000)
- Frontend app (port 5173)

### 2. Run Database Migrations

```bash
docker-compose exec backend npm run migrate
```

### 3. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

## Development Mode (Hot Reload)

For development with hot reload:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

This enables:
- Hot reload for backend (nodemon)
- Hot reload for frontend (Vite)
- Volume mounts for live code changes

## Useful Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Stop Services
```bash
docker-compose down
```

### Stop and Remove Volumes (⚠️ Deletes database data)
```bash
docker-compose down -v
```

### Rebuild Containers
```bash
docker-compose build
# Or rebuild specific service
docker-compose build backend
```

### Execute Commands in Containers
```bash
# Backend shell
docker-compose exec backend sh

# Run migrations
docker-compose exec backend npm run migrate

# Database shell
docker-compose exec postgres psql -U postgres -d mikrotik_tokens

# Redis CLI
docker-compose exec redis redis-cli
```

### Restart a Service
```bash
docker-compose restart backend
```

## Environment Variables

Environment variables are set in `docker-compose.yml`. To override them:

1. Create a `.env` file in the project root
2. Or modify `docker-compose.yml` directly

Key variables:
- `DB_HOST=postgres` (service name in Docker network)
- `DB_PASSWORD=postgres` (change in production!)
- `REDIS_HOST=redis` (service name in Docker network)
- `JWT_SECRET` (change in production!)

## Production Deployment

For production:

1. Update environment variables in `docker-compose.yml`
2. Set `NODE_ENV=production`
3. Use production Dockerfiles (default)
4. Configure proper secrets management
5. Set up SSL/TLS certificates
6. Configure reverse proxy (nginx) for frontend

## Troubleshooting

### Port Already in Use
If ports 3000, 5173, 5432, or 6379 are already in use:
- Stop conflicting services
- Or modify port mappings in `docker-compose.yml`

### Database Connection Issues
```bash
# Check if postgres is healthy
docker-compose ps

# Check postgres logs
docker-compose logs postgres

# Test connection
docker-compose exec backend node -e "import('./src/config/database.js').then(m => console.log('Connected'))"
```

### Redis Connection Issues
```bash
# Check redis health
docker-compose exec redis redis-cli ping

# Should return: PONG
```

### Rebuild After Dependency Changes
```bash
# After updating package.json
docker-compose build backend
docker-compose up -d backend
```

## Volumes

Data is persisted in Docker volumes:
- `postgres_data`: Database files
- `redis_data`: Redis persistence

To backup:
```bash
docker run --rm -v mikrotik-token-manager_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz /data
```



