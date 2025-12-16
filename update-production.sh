#!/bin/bash
# Production configuration update script

echo "🔧 Updating configuration for production server 173.212.195.88..."

# Update any remaining localhost references in JavaScript files
find frontend/src -type f -name "*.js" -o -name "*.jsx" | xargs sed -i.bak 's/localhost:3000/173.212.195.88:3000/g'
find frontend/src -type f -name "*.js" -o -name "*.jsx" | xargs sed -i.bak 's/localhost:5173/173.212.195.88/g'

# Update backend environment
sed -i.bak 's/NODE_ENV=development/NODE_ENV=production/' backend/.env

# Clean up backup files
find . -name "*.bak" -delete

echo "✅ Production configuration updated!"
echo "📋 Next steps:"
echo "1. Copy project to server: scp -r . root@173.212.195.88:/opt/mikrotik-token-manager"
echo "2. On server: docker-compose -f docker-compose.prod.yml up -d --build"
echo "3. Initialize database: docker-compose -f docker-compose.prod.yml exec backend npm run migrate"
echo "4. Seed users: docker-compose -f docker-compose.prod.yml exec backend node scripts/seed-users.js"