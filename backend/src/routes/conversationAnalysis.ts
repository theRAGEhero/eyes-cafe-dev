import express from 'express';
import { asyncHandler, CustomError } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';
import { conversationAnalysisService, AnalysisRequest } from '@/services/conversationAnalysisService';
import { ApiResponse } from '@/types';

const router = express.Router();

// Root endpoint - Conversation Analysis API documentation
router.get('/', asyncHandler(async (req, res) => {
  const response: ApiResponse<any> = {
    success: true,
    data: {
      service: 'Conversation Analysis API',
      version: '1.0.0',
      endpoints: [
        'POST /analyze - Run chain-of-thought conversation analysis',
        'GET /prompts - Get available analysis prompts',
        'GET /results/:sessionId - Get analysis results for session'
      ]
    },
    timestamp: new Date().toISOString(),
  };
  res.json(response);
}));

// Run chain-of-thought conversation analysis
router.post('/analyze', asyncHandler(async (req, res) => {
  const { sessionId, transcription, prompts }: AnalysisRequest = req.body;

  if (!sessionId || !transcription) {
    throw new CustomError('Session ID and transcription are required', 400);
  }

  // Use provided prompts or default ones
  const analysisPrompts = prompts && prompts.length > 0 
    ? prompts 
    : conversationAnalysisService.getDefaultPrompts();

  logger.info(`Starting conversation analysis for session ${sessionId} with ${analysisPrompts.filter(p => p.enabled).length} steps`);

  const startTime = Date.now();
  
  try {
    const analysisResult = await conversationAnalysisService.runAnalysis({
      sessionId,
      transcription,
      prompts: analysisPrompts
    });

    const processingTime = Date.now() - startTime;
    
    logger.info(`Conversation analysis completed for session ${sessionId} in ${processingTime}ms`);

    const response: ApiResponse<typeof analysisResult> = {
      success: true,
      data: analysisResult,
      timestamp: new Date().toISOString(),
    };

    res.json(response);

  } catch (error) {
    logger.error(`Conversation analysis failed for session ${sessionId}:`, error);
    
    // Return partial results if some steps completed
    const response: ApiResponse<any> = {
      success: false,
      error: error instanceof Error ? error.message : 'Analysis failed',
      timestamp: new Date().toISOString(),
    };

    res.status(500).json(response);
  }
}));

// Get default analysis prompts
router.get('/prompts/default', asyncHandler(async (req, res) => {
  const defaultPrompts = conversationAnalysisService.getDefaultPrompts();
  
  const response: ApiResponse<typeof defaultPrompts> = {
    success: true,
    data: defaultPrompts,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
}));

// Get analysis results for a session
router.get('/results/:sessionId', asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  
  logger.info(`Fetching analysis results for session ${sessionId}`);

  // This would fetch from database - for now return a placeholder
  const response: ApiResponse<any> = {
    success: true,
    data: {
      message: `Analysis results for session ${sessionId} - implementation pending`
    },
    timestamp: new Date().toISOString(),
  };

  res.json(response);
}));

// Health check for analysis service
router.get('/health', asyncHandler(async (req, res) => {
  logger.info('Conversation analysis service health check');

  const response: ApiResponse<any> = {
    success: true,
    data: {
      status: 'healthy',
      features: {
        groqIntegration: !!process.env.GROQ_API_KEY,
        model: 'openai/gpt-oss-120b',
        chainOfThought: true,
        databaseStorage: true,
        customPrompts: true
      },
    },
    timestamp: new Date().toISOString(),
  };

  res.json(response);
}));

export default router;