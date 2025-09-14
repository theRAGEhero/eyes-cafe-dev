import express from 'express';
import { asyncHandler, CustomError } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';
import { AnalysisEngine } from '@/services/analysisEngine';
import { ReportGenerator } from '@/services/reportGenerator';
import { ApiResponse } from '@/types';

const router = express.Router();
const analysisEngine = new AnalysisEngine();
const reportGenerator = new ReportGenerator();

// Root endpoint - Analysis API documentation
router.get('/', asyncHandler(async (req, res) => {
  const response: ApiResponse<any> = {
    success: true,
    data: {
      service: 'Analysis API',
      version: '1.0.0',
      endpoints: [
        'GET /dashboard/metrics - Get dashboard metrics',
        'GET /sessions/:sessionId/speaking-time - Get speaking time analysis',
        'GET /sessions/:sessionId/bias-detection - Get bias detection results',
        'POST /sessions/:sessionId/complete - Run complete analysis'
      ]
    },
    timestamp: new Date().toISOString(),
  };
  res.json(response);
}));

// Get dashboard metrics
router.get('/dashboard/metrics', asyncHandler(async (req, res) => {
  logger.info('Fetching dashboard metrics');

  // TODO: Implement actual dashboard metrics calculation
  const metrics = {
    totalSessions: 0,
    activeSessions: 0,
    analysisInProgress: 0,
    recentInsights: 0,
    averagePolarization: 0,
    averageBalance: 0,
    criticalAlerts: 0,
  };

  const response: ApiResponse<any> = {
    success: true,
    data: metrics,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
}));

// Get speaking time analysis for a session
router.get('/sessions/:sessionId/speaking-time', asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  
  logger.info(`Fetching speaking time analysis for session ${sessionId}`);

  try {
    const result = await analysisEngine.analyzeSession(sessionId);
    
    const response: ApiResponse<any> = {
      success: true,
      data: {
        sessionId,
        speakingTimeAnalysis: result.speakingTimeAnalysis,
        biasDetections: result.biasDetections,
        processingTime: result.processingTime,
        analyzedAt: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    logger.error(`Speaking time analysis failed for session ${sessionId}:`, error);
    throw new CustomError(
      `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500
    );
  }
}));

// Get bias detection for a session
router.get('/sessions/:sessionId/bias-detection', asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  
  logger.info(`Fetching bias detection for session ${sessionId}`);

  try {
    const result = await analysisEngine.analyzeSession(sessionId);
    
    const response: ApiResponse<any> = {
      success: true,
      data: {
        sessionId,
        biasDetections: result.biasDetections,
        summary: {
          totalBiasesDetected: result.biasDetections.length,
          severityDistribution: getBiasSeverityDistribution(result.biasDetections),
          mostCommonBiasType: getMostCommonBiasType(result.biasDetections),
          averageConfidence: calculateAverageConfidence(result.biasDetections)
        },
        processingTime: result.processingTime,
        analyzedAt: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    logger.error(`Bias detection failed for session ${sessionId}:`, error);
    throw new CustomError(
      `Bias detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500
    );
  }
}));

// Get polarization metrics for a session
router.get('/sessions/:sessionId/polarization', asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  
  logger.info(`Fetching polarization metrics for session ${sessionId}`);

  // TODO: Implement polarization analysis
  const analysis = {
    sessionId,
    message: 'Polarization analysis not yet implemented',
    estimatedImplementation: 'Phase 3 - Week 5',
  };

  const response: ApiResponse<any> = {
    success: true,
    data: analysis,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
}));

// Get conversation flow analysis for a session
router.get('/sessions/:sessionId/conversation-flow', asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  
  logger.info(`Fetching conversation flow for session ${sessionId}`);

  // TODO: Implement conversation flow analysis
  const analysis = {
    sessionId,
    message: 'Conversation flow analysis not yet implemented',
    estimatedImplementation: 'Phase 3 - Week 6',
  };

  const response: ApiResponse<any> = {
    success: true,
    data: analysis,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
}));

// Get predictive insights for a session
router.get('/sessions/:sessionId/predictions', asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  
  logger.info(`Fetching predictions for session ${sessionId}`);

  // TODO: Implement predictive analytics
  const predictions = {
    sessionId,
    message: 'Predictive analytics not yet implemented',
    estimatedImplementation: 'Phase 3 - Week 6',
  };

  const response: ApiResponse<any> = {
    success: true,
    data: predictions,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
}));

// Compare multiple sessions
router.post('/compare', asyncHandler(async (req, res) => {
  const { sessionIds } = req.body;
  
  logger.info(`Comparing sessions: ${sessionIds?.join(', ')}`);

  if (!sessionIds || !Array.isArray(sessionIds) || sessionIds.length < 2) {
    throw new CustomError('At least 2 session IDs are required for comparison', 400);
  }

  // TODO: Implement cross-session comparison
  const comparison = {
    sessionIds,
    message: 'Cross-session comparison not yet implemented',
    estimatedImplementation: 'Phase 4 - Week 7',
  };

  const response: ApiResponse<any> = {
    success: true,
    data: comparison,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
}));

// Get analysis history for a session
router.get('/sessions/:sessionId/history', asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  
  logger.info(`Fetching analysis history for session ${sessionId}`);

  // TODO: Implement analysis history retrieval
  const history = {
    sessionId,
    page,
    limit,
    analyses: [],
    message: 'Analysis history not yet implemented',
    estimatedImplementation: 'Phase 2 - Week 4',
  };

  const response: ApiResponse<any> = {
    success: true,
    data: history,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
}));

// Trigger re-analysis of a session
router.post('/sessions/:sessionId/reanalyze', asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { analysisTypes } = req.body; // Optional: specify which analyses to run
  
  logger.info(`Triggering re-analysis for session ${sessionId}`);

  try {
    const result = await analysisEngine.analyzeSession(sessionId);
    
    const response: ApiResponse<any> = {
      success: true,
      data: {
        sessionId,
        analysisTypes: analysisTypes || ['speaking-time'],
        status: 'completed',
        result: {
          speakingTimeAnalysis: result.speakingTimeAnalysis,
          biasDetections: result.biasDetections,
          processingTime: result.processingTime,
        },
        analyzedAt: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    logger.error(`Re-analysis failed for session ${sessionId}:`, error);
    throw new CustomError(
      `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500
    );
  }
}));

// Helper functions for bias analysis
function getBiasSeverityDistribution(biases: any[]) {
  const distribution = { low: 0, medium: 0, high: 0 };
  for (const bias of biases) {
    if (bias.severity < 0.3) distribution.low++;
    else if (bias.severity < 0.7) distribution.medium++;
    else distribution.high++;
  }
  return distribution;
}

function getMostCommonBiasType(biases: any[]) {
  const typeCounts = biases.reduce((acc, bias) => {
    acc[bias.type] = (acc[bias.type] || 0) + 1;
    return acc;
  }, {});
  return Object.keys(typeCounts).reduce((a, b) => 
    typeCounts[a] > typeCounts[b] ? a : b, 'none'
  );
}

function calculateAverageConfidence(biases: any[]) {
  if (biases.length === 0) return 0;
  return biases.reduce((sum, bias) => sum + bias.confidence, 0) / biases.length;
}

// Generate comprehensive session report
router.post('/sessions/:sessionId/reports', asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { format = 'pdf', reportType = 'comprehensive' } = req.body;
  
  logger.info(`Generating ${format} report for session ${sessionId}`);

  try {
    const report = await reportGenerator.generateSessionReport(sessionId, {
      type: reportType as any,
      format: format as any,
      sections: ['overview', 'speaking-analysis', 'bias-detection', 'insights', 'recommendations'],
      customizations: {
        includeRawData: false
      }
    });

    const response: ApiResponse<any> = {
      success: true,
      data: {
        sessionId,
        reportId: report.id,
        format: report.format,
        filePath: report.filePath,
        fileUrl: `/api/analysis/reports/${report.id}/download`,
        generatedAt: report.generatedAt,
        fileSizeBytes: report.fileSizeBytes
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    logger.error(`Report generation failed for session ${sessionId}:`, error);
    throw new CustomError(
      `Report generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500
    );
  }
}));

// Download generated report
router.get('/reports/:reportId/download', asyncHandler(async (req, res) => {
  const { reportId } = req.params;
  
  logger.info(`Downloading report ${reportId}`);

  try {
    const reportFile = await reportGenerator.getReportFile(reportId);
    
    res.setHeader('Content-Type', reportFile.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${reportFile.filename}"`);
    res.send(reportFile.buffer);
    
  } catch (error) {
    logger.error(`Report download failed for ${reportId}:`, error);
    throw new CustomError(
      `Report download failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      404
    );
  }
}));

export default router;