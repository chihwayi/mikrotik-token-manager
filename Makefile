.PHONY: help up down build logs migrate shell-backend shell-db shell-redis restart clean

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

up: ## Start all services
	docker-compose up -d

up-dev: ## Start all services in development mode (hot reload)
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

down: ## Stop all services
	docker-compose down

build: ## Build all containers
	docker-compose build

logs: ## Show logs from all services
	docker-compose logs -f

logs-backend: ## Show backend logs
	docker-compose logs -f backend

logs-frontend: ## Show frontend logs
	docker-compose logs -f frontend

migrate: ## Run database migrations
	docker-compose exec backend npm run migrate

shell-backend: ## Open shell in backend container
	docker-compose exec backend sh

shell-db: ## Open PostgreSQL shell
	docker-compose exec postgres psql -U postgres -d mikrotik_tokens

shell-redis: ## Open Redis CLI
	docker-compose exec redis redis-cli

restart: ## Restart all services
	docker-compose restart

restart-backend: ## Restart backend service
	docker-compose restart backend

clean: ## Stop and remove all containers, networks, and volumes
	docker-compose down -v

rebuild: ## Rebuild and restart all services
	docker-compose down
	docker-compose build
	docker-compose up -d
	docker-compose exec backend npm run migrate



