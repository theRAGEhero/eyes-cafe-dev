import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { errorHandler } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';
import { jobQueue } from '@/services/jobQueue';

// Import routes
import sessionRoutes from '@/routes/sessions';
import analysisRoutes from '@/routes/analysis';
import conversationAnalysisRoutes from '@/routes/conversationAnalysis';
import reportRoutes from '@/routes/reports';
import jobRoutes from '@/routes/jobs';
import chatRoutes from '@/routes/chat';
import healthRoutes from '@/routes/health';
import { aiAnalysisRouter } from '@/routes/ai-analysis';

// Load environment variables
dotenv.config({ path: '../.env.local' });

const app = express();
const PORT = process.env.BACKEND_PORT || 3002;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3001',
    'http://localhost:3000',
    `http://${process.env.EYES_CAFE_DOMAIN}`,
    `https://${process.env.EYES_CAFE_DOMAIN}`,
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id'],
}));

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
}

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/conversation-analysis', conversationAnalysisRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ai-analysis', aiAnalysisRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Eyes Café API',
    version: '1.0.0',
    description: 'Advanced conversation analysis platform',
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Eyes Café API server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`World Café API: ${process.env.WORLD_CAFE_API_URL}`);
  logger.info(`Job Queue Manager initialized and ready`);
  
  // Schedule daily session cleanup at 2 AM
  setInterval(async () => {
    try {
      const now = new Date();
      if (now.getHours() === 2 && now.getMinutes() === 0) {
        logger.info('Starting scheduled session cleanup');
        await jobQueue.queueSessionCleanup(false, 30); // Delete sessions older than 30 days
      }
    } catch (error) {
      logger.error('Failed to schedule session cleanup:', error);
    }
  }, 60 * 1000); // Check every minute
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await jobQueue.shutdown();
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await jobQueue.shutdown();
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

export default app;