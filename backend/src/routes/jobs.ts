import express from 'express';
import { asyncHandler, CustomError } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';
import { jobQueue } from '@/services/jobQueue';
import { ApiResponse } from '@/types';

const router = express.Router();

// Root endpoint - Jobs API documentation
router.get('/', asyncHandler(async (req, res) => {
  const response: ApiResponse<any> = {
    success: true,
    data: {
      service: 'Jobs API',
      version: '1.0.0',
      endpoints: [
        'POST /analysis/:sessionId - Queue analysis job',
        'POST /report/:sessionId - Queue report generation', 
        'POST /sync - Queue session sync',
        'GET /stats - Get queue statistics',
        'GET /history/:queueName - Get job history'
      ]
    },
    timestamp: new Date().toISOString(),
  };
  res.json(response);
}));

// Queue analysis job for a session
router.post('/analysis/:sessionId', asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { analysisTypes = ['complete'], priority = 5 } = req.body;
  
  logger.info(`Queueing analysis for session ${sessionId}: ${analysisTypes.join(', ')}`);

  try {
    let jobs;
    
    if (analysisTypes.includes('complete') || analysisTypes.length > 1) {
      // Queue complete analysis
      jobs = await jobQueue.queueCompleteAnalysis(sessionId, priority);
    } else if (analysisTypes.includes('speaking-time')) {
      jobs = [await jobQueue.queueSpeakingTimeAnalysis(sessionId, priority)];
    } else if (analysisTypes.includes('bias-detection')) {
      jobs = [await jobQueue.queueBiasDetection(sessionId, priority)];
    } else {
      throw new CustomError('Invalid analysis type. Use: speaking-time, bias-detection, or complete', 400);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: {
        sessionId,
        analysisTypes,
        jobs: jobs.map(job => ({
          id: job.id,
          type: job.name,
          status: 'queued',
          priority: job.opts.priority,
          queuedAt: new Date().toISOString()
        })),
        message: `${jobs.length} analysis job(s) queued successfully`
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    logger.error(`Failed to queue analysis for session ${sessionId}:`, error);
    throw new CustomError(
      `Analysis queueing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500
    );
  }
}));

// Queue report generation job
router.post('/reports/:sessionId', asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { reportType = 'comprehensive', format = 'pdf', userId } = req.body;
  
  logger.info(`Queueing ${format} report generation for session ${sessionId}`);

  try {
    const job = await jobQueue.queueReportGeneration(sessionId, reportType, format, userId);

    const response: ApiResponse<any> = {
      success: true,
      data: {
        sessionId,
        reportType,
        format,
        jobId: job.id,
        status: 'queued',
        queuedAt: new Date().toISOString(),
        estimatedCompletionTime: '2-5 minutes'
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    logger.error(`Failed to queue report for session ${sessionId}:`, error);
    throw new CustomError(
      `Report queueing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500
    );
  }
}));

// Queue session sync job
router.post('/sync', asyncHandler(async (req, res) => {
  const { sessionId, force = false } = req.body;
  
  logger.info(`Queueing session sync ${sessionId ? `for ${sessionId}` : 'for all sessions'} ${force ? '(forced)' : ''}`);

  try {
    const job = await jobQueue.queueSessionSync(sessionId, force);

    const response: ApiResponse<any> = {
      success: true,
      data: {
        sessionId: sessionId || 'all',
        jobId: job.id,
        status: 'queued',
        force,
        queuedAt: new Date().toISOString(),
        estimatedCompletionTime: sessionId ? '30-60 seconds' : '2-5 minutes'
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    logger.error(`Failed to queue sync job:`, error);
    throw new CustomError(
      `Sync queueing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500
    );
  }
}));

// Get queue statistics
router.get('/stats', asyncHandler(async (req, res) => {
  logger.info('Fetching job queue statistics');

  try {
    const stats = await jobQueue.getQueueStats();

    const response: ApiResponse<any> = {
      success: true,
      data: {
        queues: stats,
        summary: {
          totalActive: (stats.analysis.active || 0) + (stats.reports.active || 0) + (stats.sync.active || 0),
          totalWaiting: (stats.analysis.waiting || 0) + (stats.reports.waiting || 0) + (stats.sync.waiting || 0),
          totalCompleted: (stats.analysis.completed || 0) + (stats.reports.completed || 0) + (stats.sync.completed || 0),
          totalFailed: (stats.analysis.failed || 0) + (stats.reports.failed || 0) + (stats.sync.failed || 0)
        }
      },
      timestamp: stats.timestamp,
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to fetch queue statistics:', error);
    throw new CustomError(
      `Statistics fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500
    );
  }
}));

// Get job history for a specific queue
router.get('/history/:queueName', asyncHandler(async (req, res) => {
  const { queueName } = req.params;
  const limit = parseInt(req.query.limit as string) || 20;
  
  logger.info(`Fetching job history for queue ${queueName}`);

  try {
    const history = await jobQueue.getJobHistory(queueName, limit);

    const response: ApiResponse<any> = {
      success: true,
      data: {
        queueName,
        limit,
        jobs: history.map(job => ({
          id: job.id,
          name: job.name,
          data: job.data,
          status: job.finishedOn ? (job.failedReason ? 'failed' : 'completed') : 'processing',
          createdAt: job.timestamp ? new Date(job.timestamp).toISOString() : null,
          finishedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
          failedReason: job.failedReason,
          progress: job.progress(),
          attempts: job.attemptsMade,
          delay: job.delay
        }))
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    logger.error(`Failed to fetch job history for queue ${queueName}:`, error);
    throw new CustomError(
      `Job history fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500
    );
  }
}));

// Get job status
router.get('/status/:jobId', asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  
  logger.info(`Fetching status for job ${jobId}`);

  try {
    // Try to find job in all queues
    const stats = await jobQueue.getQueueStats();
    
    // For now, return a simple response since Bull doesn't have easy job lookup by ID across queues
    const response: ApiResponse<any> = {
      success: true,
      data: {
        jobId,
        message: 'Job status lookup requires queue name. Use /api/jobs/history/:queueName to find specific jobs.',
        availableQueues: ['analysis', 'reports', 'sync'],
        currentStats: stats
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    logger.error(`Failed to fetch job status for ${jobId}:`, error);
    throw new CustomError(
      `Job status fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500
    );
  }
}));

// Cleanup old jobs
router.post('/cleanup', asyncHandler(async (req, res) => {
  logger.info('Triggering job cleanup');

  try {
    await jobQueue.cleanupJobs();

    const response: ApiResponse<any> = {
      success: true,
      data: {
        message: 'Job cleanup completed successfully',
        cleanupRules: {
          completed: '24 hours retention',
          failed: '72 hours retention',
          syncCompleted: '6 hours retention'
        }
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    logger.error('Job cleanup failed:', error);
    throw new CustomError(
      `Job cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500
    );
  }
}));

export default router;