#!/bin/bash

echo "🐳 Eyes Café Docker Test Script"
echo "================================="

# Test database connections
echo "📊 Testing Database Services..."

# Test PostgreSQL
if docker exec eyes-cafe-dev-postgres-1 pg_isready -U eyes_cafe > /dev/null 2>&1; then
    echo "✅ PostgreSQL: Connected successfully"
else
    echo "❌ PostgreSQL: Connection failed"
fi

# Test Redis
if docker exec eyes-cafe-dev-redis-1 redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis: Connected successfully"
else
    echo "❌ Redis: Connection failed"
fi

echo ""
echo "🔗 Service URLs:"
echo "• Frontend: http://localhost:3001"
echo "• Backend API: http://localhost:3002"
echo "• Analytics API: http://localhost:8001"
echo "• PostgreSQL: localhost:5433"
echo "• Redis: localhost:6380"

echo ""
echo "🚀 To start all services:"
echo "  docker-compose up -d"

echo ""
echo "🔧 To stop all services:"
echo "  docker-compose down"

echo ""
echo "📋 Service status:"
docker-compose ps