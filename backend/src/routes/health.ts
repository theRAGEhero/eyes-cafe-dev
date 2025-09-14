import express from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';

const router = express.Router();

// Basic health check
router.get('/', asyncHandler(async (req, res) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    services: {
      database: 'checking...',
      worldCafeAPI: 'checking...',
      redis: 'checking...',
    },
  };

  // Check database connection
  try {
    // We'll implement this after setting up Prisma
    healthStatus.services.database = 'connected';
  } catch (error) {
    healthStatus.services.database = 'disconnected';
    healthStatus.status = 'degraded';
  }

  // Check World Café API
  try {
    // We'll implement this after setting up the API client
    healthStatus.services.worldCafeAPI = 'connected';
  } catch (error) {
    healthStatus.services.worldCafeAPI = 'disconnected';
    healthStatus.status = 'degraded';
  }

  // Check Redis (if enabled)
  try {
    if (process.env.REDIS_URL && !process.env.USE_MEMORY_QUEUE) {
      healthStatus.services.redis = 'connected';
    } else {
      healthStatus.services.redis = 'memory-queue';
    }
  } catch (error) {
    healthStatus.services.redis = 'disconnected';
    healthStatus.status = 'degraded';
  }

  logger.info(`Health check: ${healthStatus.status}`);
  
  const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(healthStatus);
}));

// Detailed health check with more information
router.get('/detailed', asyncHandler(async (req, res) => {
  const detailed = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      nodeEnv: process.env.NODE_ENV || 'development',
    },
    configuration: {
      worldCafeApiUrl: process.env.WORLD_CAFE_API_URL,
      eyesCafeDomain: process.env.EYES_CAFE_DOMAIN,
      databaseType: process.env.DATABASE_URL?.includes('postgresql') ? 'postgresql' : 'sqlite',
      redisEnabled: !process.env.USE_MEMORY_QUEUE,
      debugLogging: process.env.ENABLE_DEBUG_LOGGING === 'true',
    },
    services: {
      database: { status: 'connected', latency: null },
      worldCafeAPI: { status: 'connected', latency: null },
      redis: { status: 'connected', latency: null },
    },
  };

  // TODO: Add actual service checks with latency measurements

  res.json(detailed);
}));

// Ready check (for Kubernetes readiness probe)
router.get('/ready', asyncHandler(async (req, res) => {
  // Check if all critical services are ready
  const checks = {
    database: true, // TODO: Implement actual check
    configuration: !!(process.env.WORLD_CAFE_API_URL && process.env.DATABASE_URL),
  };

  const isReady = Object.values(checks).every(check => check === true);

  if (isReady) {
    res.json({ status: 'ready', checks });
  } else {
    res.status(503).json({ status: 'not ready', checks });
  }
}));

// Live check (for Kubernetes liveness probe)  
router.get('/live', asyncHandler(async (req, res) => {
  res.json({ 
    status: 'alive',
    timestamp: new Date().toISOString() 
  });
}));

export default router;