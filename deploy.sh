#!/bin/bash

# Production Deployment Script for VPS
# Usage: ./deploy.sh

set -e  # Exit on error

echo "🚀 Starting deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.example...${NC}"
    cp .env.example .env
    echo -e "${RED}❌ Please edit .env file with your production values and run again!${NC}"
    exit 1
fi

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ docker-compose is not installed. Please install docker-compose first.${NC}"
    exit 1
fi

echo "✅ Docker and docker-compose found"

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down || true

# Build images
echo "🏗️  Building Docker images..."
docker-compose build --no-cache

# Start services
echo "🚀 Starting services..."
docker-compose up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Run database migrations
echo "📦 Running database migrations..."
docker-compose exec -T app npx prisma migrate deploy

# Check health
echo "🏥 Checking application health..."
sleep 5

MAX_RETRIES=12
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Application is healthy!${NC}"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        echo "⏳ Waiting for application to start... ($RETRY_COUNT/$MAX_RETRIES)"
        sleep 5
    fi
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo -e "${RED}❌ Application failed to start. Check logs with: docker-compose logs app${NC}"
    exit 1
fi

# Show running containers
echo ""
echo "📊 Running containers:"
docker-compose ps

echo ""
echo -e "${GREEN}🎉 Deployment successful!${NC}"
echo ""
echo "📝 Next steps:"
echo "  - Access application: http://localhost:3000"
echo "  - Check logs: docker-compose logs -f app"
echo "  - Check health: curl http://localhost:3000/api/health"
echo "  - View database: docker-compose exec postgres psql -U chatbot -d chatbot_db"
echo "  - View Redis: docker-compose exec redis redis-cli"
echo ""
echo "🔧 Useful commands:"
echo "  - Stop: docker-compose stop"
echo "  - Restart: docker-compose restart"
echo "  - View logs: docker-compose logs -f [service]"
echo "  - Shell into app: docker-compose exec app sh"
echo ""
