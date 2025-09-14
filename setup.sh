#!/bin/bash

# Eyes Café Platform - Development Setup Script
# This script sets up the Eyes Café development environment

set -e  # Exit on any error

echo "🎯 Eyes Café Platform - Development Setup"
echo "========================================="

# Check Node.js version
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js $(node --version) detected"

# Install root dependencies
echo ""
echo "📦 Installing root dependencies..."
npm install

# Install backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies  
echo ""
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo ""
    echo "⚙️  Setting up environment configuration..."
    cp .env.example .env.local
    echo "✅ Created .env.local from .env.example"
    echo "📝 Please edit .env.local with your API keys and configuration"
else
    echo "✅ .env.local already exists"
fi

# Setup database
echo ""
echo "🗄️  Setting up database..."
cd backend

# Generate Prisma client
echo "📋 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "📋 Running database migrations..."
npx prisma migrate dev --name init

# Seed database with sample data
echo "📋 Seeding database with sample data..."
npm run seed

cd ..

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "📍 Next steps:"
echo "   1. Edit .env.local with your API keys (optional for basic functionality)"
echo "   2. Start the development servers:"
echo "      npm run dev"
echo ""
echo "🌐 Access points:"
echo "   • Eyes Café Dashboard: http://localhost:3001"
echo "   • Backend API: http://localhost:3002"
echo "   • Health Check: http://localhost:3002/api/health"
echo ""
echo "🔗 Integration:"
echo "   • Ensure World Café is running on localhost:3005 for full integration"
echo "   • Use the floating navigation button to switch between platforms"
echo ""
echo "📚 Documentation:"
echo "   • Complete development plan: ./EYES_CAFE_DEVELOPMENT_PLAN.md"
echo "   • Setup instructions: ./README.md"
echo ""
echo "Happy analyzing! 👁️✨"