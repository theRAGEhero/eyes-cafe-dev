# 👁️ Eyes Café - Conversation Intelligence Platform

Advanced AI-powered conversation analysis platform that integrates with World Café to provide deep insights into discussion dynamics, speaker behavior, bias detection, and predictive analytics.

## 🎯 Overview

Eyes Café transforms World Café's rich conversational data into actionable intelligence through:

- **🎤 Speaking Time Analysis** - Detailed participant engagement metrics
- **🔍 Bias Detection** - AI-powered identification of conversation bias patterns
- **📊 Polarization Measurement** - Real-time polarization index and trend analysis  
- **🌊 Conversation Flow** - Topic evolution and discussion dynamics mapping
- **🔮 Predictive Insights** - ML-powered outcome and intervention predictions
- **📋 Advanced Reporting** - Professional PDF, HTML, and CSV report generation
- **🔗 Cross-Platform Integration** - Seamless navigation between Eyes Café and World Café

## 🚀 Quick Start (Development)

### Prerequisites

- **Node.js 18+**
- **npm or yarn**
- **World Café platform** running on localhost:3005

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd eyes-cafe-dev-clean

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# 4. Set up database
npm run db:generate
npm run db:migrate
npm run db:seed

# 5. Start development servers
npm run dev
```

### Access the Platform

- **Eyes Café Dashboard**: http://localhost:3001
- **Backend API**: http://localhost:3002
- **API Health Check**: http://localhost:3002/api/health

## 🏗️ Architecture

### Current Stack (Phase 1)

```
Frontend (Next.js 14)     Backend (Express.js)      Database
Port 3001          ←→     Port 3002          ←→     SQLite/PostgreSQL
                                ↕
                          World Café API
                          Port 3005
```

### Project Structure

```
eyes-cafe-dev-clean/
├── frontend/           # Next.js 14 React application
├── backend/            # Express.js API server  
├── analytics/          # Python ML services (Phase 4)
├── docs/              # Documentation
├── .env.local         # Environment configuration
└── README.md          # This file
```

## 🔧 Development Environment

### Backend (Express.js + TypeScript)

```bash
cd backend
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests
npm run db:studio    # Open Prisma Studio
```

### Frontend (Next.js 14 + TypeScript)

```bash
cd frontend
npm run dev          # Start development server  
npm run build        # Build for production
npm run lint         # Run ESLint
npm run type-check   # TypeScript check
```

### Database Management

```bash
# Generate Prisma client
npm run db:generate

# Create and run migrations
npm run db:migrate

# Seed database with sample data
npm run db:seed

# Reset database (⚠️ destroys all data)
npm run db:reset

# Open Prisma Studio
npm run db:studio
```

## 🌐 Cross-Platform Integration

Eyes Café is designed for seamless integration with World Café:

### URL Consistency

```
World Café: world-cafe.democracyroutes.com/sessions/abc123
Eyes Café:  eyes-cafe.democracyroutes.com/sessions/abc123
```

Simply change the subdomain to switch between platforms while maintaining session context.

### Session Auto-Discovery

When you visit an Eyes Café URL with a session ID:

1. **Check Local Database** - Look for existing session data
2. **Auto-Sync from World Café** - Fetch session if not found locally  
3. **Display Dashboard** - Show analysis interface
4. **Cross-Platform Navigator** - Floating button to switch to World Café

## 📊 Features by Development Phase

### ✅ Phase 1: Foundation (Completed)
- Project structure and workspace setup
- Express.js backend API with TypeScript
- PostgreSQL database with Prisma ORM  
- Next.js 14 frontend with App Router
- World Café API integration framework
- Cross-platform URL consistency
- Basic dashboard and navigation

### 🚧 Phase 2: Core Analytics (Week 3-4)
- Speaking time analysis from transcriptions
- Basic bias detection algorithms
- PDF/HTML report generation
- Analysis results storage and history
- Background job processing

### 🚧 Phase 3: Advanced Analytics (Week 5-6)
- Polarization measurement and tracking
- Conversation flow analysis
- Advanced bias detection with evidence
- Real-time monitoring dashboard
- Intervention recommendations

### 🚧 Phase 4: ML Intelligence (Week 7-8)
- Python FastAPI analytics microservice
- Machine learning models for predictions
- Cross-session pattern recognition
- Advanced reporting and dashboards

### 🚧 Phase 5: Production Ready (Week 9-10)
- Docker containerization
- Performance optimization
- Monitoring and alerting
- Complete documentation

## 🔌 API Integration

### World Café API Endpoints

Eyes Café integrates with these World Café endpoints:

```javascript
GET  /api/sessions                    // All sessions
GET  /api/sessions/:id               // Session details
GET  /api/sessions/:id/all-transcriptions  // All transcriptions  
GET  /api/sessions/:id/tables/:num/transcriptions // Table transcriptions
GET  /api/sessions/:id/participants   // Session participants
GET  /api/sessions/:id/analysis      // Current analysis (optional)
```

### Polling Strategy

- **Active Sessions**: 30 seconds
- **Recent Sessions**: 5 minutes  
- **Completed Sessions**: 1 hour

### Data Flow

1. **Session Discovery** → 2. **Transcription Sync** → 3. **Analysis Processing** → 4. **Results Storage**

## 📋 Configuration

### Environment Variables

```bash
# World Café Integration
WORLD_CAFE_API_URL=http://localhost:3005
WORLD_CAFE_DOMAIN=world-cafe.democracyroutes.com

# Database
DATABASE_URL="file:./dev.db"  # SQLite for development
# DATABASE_URL="postgresql://user:pass@localhost:5432/eyes_cafe"  # PostgreSQL

# AI APIs (Required for analysis)
GROQ_API_KEY=your_groq_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Cross-Platform URLs
EYES_CAFE_DOMAIN=eyes-cafe.democracyroutes.com
BASE_DOMAIN=democracyroutes.com
```

### Database Options

**Option 1: SQLite (Quick Setup)**
```bash
DATABASE_URL="file:./dev.db"
```

**Option 2: PostgreSQL (Recommended)**
```bash
# Install PostgreSQL
brew install postgresql  # macOS
sudo apt install postgresql  # Ubuntu

# Create database  
createdb eyes_cafe_dev

# Update .env.local
DATABASE_URL="postgresql://user:password@localhost:5432/eyes_cafe_dev"
```

## 🧪 Testing the Setup

### 1. Backend Health Check

```bash
curl http://localhost:3002/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "services": {
    "database": "connected",
    "worldCafeAPI": "checking...",
    "redis": "memory-queue"
  }
}
```

### 2. Frontend Access

Visit http://localhost:3001 - you should see the Eyes Café dashboard with:

- Navigation sidebar
- Dashboard metrics (initially zeros)
- Development status information
- Cross-platform navigator button

### 3. World Café Integration

With World Café running on localhost:3005:

```bash
# Test session sync
curl http://localhost:3002/api/sessions/test-session-id

# Should either return existing session or attempt sync from World Café
```

## 🐛 Troubleshooting

### Common Issues

**Backend won't start**
```bash
# Check if port is already in use
lsof -i :3002

# Clear node_modules and reinstall
rm -rf backend/node_modules
cd backend && npm install
```

**Database connection errors**
```bash
# Regenerate Prisma client
npm run db:generate

# Reset database if corrupted
npm run db:reset
```

**Frontend build errors**
```bash
# Clear Next.js cache
cd frontend
rm -rf .next
npm run build
```

**World Café API connection fails**
- Ensure World Café is running on localhost:3005
- Check WORLD_CAFE_API_URL in .env.local
- Verify no firewall blocking requests

## 🤝 Contributing

### Development Workflow

1. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes and test**
   ```bash
   npm run dev
   npm run lint
   npm run type-check
   ```

3. **Commit with descriptive message**
   ```bash
   git commit -m "Add speaking time analysis component"
   ```

4. **Push and create pull request**

### Code Style

- **TypeScript** for all new code
- **ESLint + Prettier** for formatting
- **Tailwind CSS** for styling
- **Prisma** for database operations
- **Next.js App Router** for frontend routing

## 📚 Documentation

- **[Development Plan](./EYES_CAFE_DEVELOPMENT_PLAN.md)** - Complete technical specification
- **[API Reference](./docs/api-reference.md)** - Backend API documentation
- **[Database Schema](./backend/prisma/schema.prisma)** - Complete database structure
- **[Frontend Components](./frontend/components/)** - React component library

## 📄 License

This project is licensed under the ISC License.

## 🎯 Phase 1 Status: ✅ Complete

**Eyes Café Phase 1** is now complete and ready for Phase 2 development. The foundation includes:

- ✅ Full project structure with monorepo setup
- ✅ Express.js backend with comprehensive API routes
- ✅ PostgreSQL/SQLite database with Prisma ORM
- ✅ Next.js 14 frontend with modern UI components
- ✅ World Café API integration framework
- ✅ Cross-platform navigation system
- ✅ Development environment with hot reloading
- ✅ Sample data and seeding scripts

**Next Steps**: Begin Phase 2 with speaking time analysis implementation.

---

**Made with ❤️ for meaningful conversations**