import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponse } from '../types/api';
import { prisma } from '../lib/prisma';
import { jobQueue } from '../services/jobQueue';

const router = Router();

// AI Analysis Configuration Types
interface AIAnalysisConfig {
  models: string[];
  analysisTypes: string[];
  parameters: {
    confidence_threshold: number;
    sentiment_analysis: boolean;
    emotion_detection: boolean;
    topic_modeling: boolean;
    bias_detection: boolean;
    polarization_analysis: boolean;
    speaking_time_analysis: boolean;
    interruption_detection: boolean;
    language_complexity: boolean;
    custom_prompts: string[];
  };
  filters: {
    date_range?: { start: string; end: string };
    session_ids?: string[];
    table_ids?: string[];
    participant_filters?: {
      demographics?: string[];
      roles?: string[];
      organizations?: string[];
    };
    language?: string;
  };
  output: {
    formats: string[];
    visualizations: string[];
    aggregation_level: 'conversation' | 'table' | 'session' | 'global';
    include_raw_data: boolean;
    include_confidence_scores: boolean;
  };
}

// Get available AI models and capabilities
router.get('/models', asyncHandler(async (req, res) => {
  const models = [
    {
      id: 'gpt-4-turbo',
      name: 'GPT-4 Turbo',
      provider: 'OpenAI',
      capabilities: ['text-analysis', 'sentiment', 'summarization', 'bias-detection'],
      maxTokens: 128000,
      costPer1kTokens: 0.01
    },
    {
      id: 'claude-3-opus',
      name: 'Claude 3 Opus',
      provider: 'Anthropic',
      capabilities: ['text-analysis', 'sentiment', 'reasoning', 'summarization'],
      maxTokens: 200000,
      costPer1kTokens: 0.015
    },
    {
      id: 'gemini-pro',
      name: 'Gemini Pro',
      provider: 'Google',
      capabilities: ['text-analysis', 'multimodal', 'reasoning'],
      maxTokens: 30720,
      costPer1kTokens: 0.0005
    },
    {
      id: 'llama-2-70b',
      name: 'Llama 2 70B',
      provider: 'Meta (Local)',
      capabilities: ['text-analysis', 'sentiment', 'summarization'],
      maxTokens: 4096,
      costPer1kTokens: 0.0 // Local model
    }
  ];

  const response: ApiResponse<typeof models> = {
    success: true,
    data: models,
    message: 'Available AI models retrieved successfully'
  };

  res.json(response);
}));

// Get available analysis types and templates
router.get('/analysis-types', asyncHandler(async (req, res) => {
  const analysisTypes = [
    {
      id: 'comprehensive',
      name: 'Comprehensive Analysis',
      description: 'Full conversation analysis including sentiment, bias, and patterns',
      duration: '5-10 minutes',
      outputs: ['summary', 'insights', 'recommendations', 'visualizations']
    },
    {
      id: 'sentiment-deep-dive',
      name: 'Sentiment Deep Dive',
      description: 'Detailed emotional analysis of conversations',
      duration: '3-5 minutes',
      outputs: ['sentiment-timeline', 'emotion-heatmap', 'mood-shifts']
    },
    {
      id: 'bias-detection',
      name: 'Bias Detection',
      description: 'Identify various types of cognitive and social biases',
      duration: '5-7 minutes',
      outputs: ['bias-report', 'fairness-metrics', 'recommendations']
    },
    {
      id: 'polarization-mapping',
      name: 'Polarization Mapping',
      description: 'Analyze opinion divergence and consensus patterns',
      duration: '4-6 minutes',
      outputs: ['polarization-index', 'consensus-map', 'bridge-topics']
    },
    {
      id: 'participation-equity',
      name: 'Participation Equity',
      description: 'Analyze speaking time, interruptions, and participation balance',
      duration: '2-3 minutes',
      outputs: ['speaking-time-analysis', 'interruption-matrix', 'equity-score']
    },
    {
      id: 'topic-evolution',
      name: 'Topic Evolution',
      description: 'Track how topics develop and change throughout the conversation',
      duration: '6-8 minutes',
      outputs: ['topic-timeline', 'concept-map', 'evolution-paths']
    },
    {
      id: 'custom-analysis',
      name: 'Custom Analysis',
      description: 'Define your own analysis parameters and prompts',
      duration: 'Variable',
      outputs: ['custom-report', 'custom-visualizations']
    }
  ];

  const response: ApiResponse<typeof analysisTypes> = {
    success: true,
    data: analysisTypes,
    message: 'Available analysis types retrieved successfully'
  };

  res.json(response);
}));

// Create custom AI analysis job
router.post('/analyze', asyncHandler(async (req, res) => {
  const config: AIAnalysisConfig = req.body;

  // Validate configuration
  if (!config.models || config.models.length === 0) {
    return res.status(400).json({
      success: false,
      error: { message: 'At least one AI model must be selected' }
    });
  }

  // Create analysis job
  const analysisJob = await jobQueue.queueCustomAnalysis({
    config,
    priority: 2,
    estimatedDuration: calculateEstimatedDuration(config),
    createdAt: new Date().toISOString()
  });

  const response: ApiResponse<{ jobId: string; estimatedDuration: number }> = {
    success: true,
    data: {
      jobId: analysisJob.id,
      estimatedDuration: calculateEstimatedDuration(config)
    },
    message: 'Analysis job queued successfully'
  };

  res.json(response);
}));

// Get analysis results
router.get('/results/:jobId', asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  // In a real implementation, this would check job status and return results
  const mockResults = {
    jobId,
    status: 'completed',
    progress: 100,
    results: {
      summary: 'Analysis completed successfully',
      insights: [
        'High engagement detected in first 30 minutes',
        'Polarization decreased over time',
        'Gender bias detected in speaking time distribution'
      ],
      data: {
        sentiment_scores: [0.7, 0.8, 0.6, 0.9],
        bias_indicators: {
          gender: 0.3,
          age: 0.1,
          cultural: 0.2
        },
        polarization_index: 45
      },
      visualizations: [
        {
          type: 'sentiment_timeline',
          data: 'base64_chart_data',
          title: 'Sentiment Over Time'
        },
        {
          type: 'bias_heatmap',
          data: 'base64_heatmap_data',
          title: 'Bias Detection Heatmap'
        }
      ],
      downloadUrls: {
        pdf: `/api/ai-analysis/download/${jobId}/report.pdf`,
        excel: `/api/ai-analysis/download/${jobId}/data.xlsx`,
        json: `/api/ai-analysis/download/${jobId}/raw-data.json`
      }
    },
    metadata: {
      modelsUsed: ['gpt-4-turbo', 'claude-3-opus'],
      analysisTypes: ['comprehensive', 'bias-detection'],
      processingTime: 420, // seconds
      tokensUsed: 15000,
      estimatedCost: 1.25
    }
  };

  const response: ApiResponse<typeof mockResults> = {
    success: true,
    data: mockResults,
    message: 'Analysis results retrieved successfully'
  };

  res.json(response);
}));

// Get analysis templates
router.get('/templates', asyncHandler(async (req, res) => {
  const templates = [
    {
      id: 'world-cafe-standard',
      name: 'World Café Standard Analysis',
      description: 'Standard analysis template for World Café sessions',
      config: {
        models: ['gpt-4-turbo'],
        analysisTypes: ['comprehensive', 'participation-equity'],
        parameters: {
          confidence_threshold: 0.7,
          sentiment_analysis: true,
          bias_detection: true,
          polarization_analysis: true,
          speaking_time_analysis: true,
          interruption_detection: true,
          language_complexity: false,
          emotion_detection: false,
          topic_modeling: true,
          custom_prompts: []
        },
        output: {
          formats: ['pdf', 'excel'],
          visualizations: ['sentiment_timeline', 'participation_chart'],
          aggregation_level: 'session' as const,
          include_raw_data: false,
          include_confidence_scores: true
        }
      }
    },
    {
      id: 'research-deep-dive',
      name: 'Research Deep Dive',
      description: 'Comprehensive research-focused analysis with all features',
      config: {
        models: ['gpt-4-turbo', 'claude-3-opus'],
        analysisTypes: ['comprehensive', 'sentiment-deep-dive', 'bias-detection', 'topic-evolution'],
        parameters: {
          confidence_threshold: 0.8,
          sentiment_analysis: true,
          emotion_detection: true,
          topic_modeling: true,
          bias_detection: true,
          polarization_analysis: true,
          speaking_time_analysis: true,
          interruption_detection: true,
          language_complexity: true,
          custom_prompts: [
            'Analyze the effectiveness of the facilitation techniques used',
            'Identify moments of breakthrough or insight',
            'Assess the quality of listening and building on others\' ideas'
          ]
        },
        output: {
          formats: ['pdf', 'excel', 'json'],
          visualizations: ['all'],
          aggregation_level: 'conversation' as const,
          include_raw_data: true,
          include_confidence_scores: true
        }
      }
    },
    {
      id: 'quick-insights',
      name: 'Quick Insights',
      description: 'Fast analysis for immediate feedback',
      config: {
        models: ['gemini-pro'],
        analysisTypes: ['sentiment-deep-dive', 'participation-equity'],
        parameters: {
          confidence_threshold: 0.6,
          sentiment_analysis: true,
          bias_detection: false,
          polarization_analysis: true,
          speaking_time_analysis: true,
          interruption_detection: false,
          language_complexity: false,
          emotion_detection: false,
          topic_modeling: false,
          custom_prompts: []
        },
        output: {
          formats: ['pdf'],
          visualizations: ['sentiment_timeline', 'participation_chart'],
          aggregation_level: 'session' as const,
          include_raw_data: false,
          include_confidence_scores: false
        }
      }
    }
  ];

  const response: ApiResponse<typeof templates> = {
    success: true,
    data: templates,
    message: 'Analysis templates retrieved successfully'
  };

  res.json(response);
}));

// Save custom template
router.post('/templates', asyncHandler(async (req, res) => {
  const { name, description, config } = req.body;

  // In a real implementation, this would save to database
  const template = {
    id: `custom-${Date.now()}`,
    name,
    description,
    config,
    createdAt: new Date().toISOString(),
    isCustom: true
  };

  const response: ApiResponse<typeof template> = {
    success: true,
    data: template,
    message: 'Template saved successfully'
  };

  res.json(response);
}));

// Get cost estimation
router.post('/estimate-cost', asyncHandler(async (req, res) => {
  const config: AIAnalysisConfig = req.body;
  
  const estimation = calculateCostEstimation(config);

  const response: ApiResponse<typeof estimation> = {
    success: true,
    data: estimation,
    message: 'Cost estimation calculated successfully'
  };

  res.json(response);
}));

// Download analysis results
router.get('/download/:jobId/:filename', asyncHandler(async (req, res) => {
  const { jobId, filename } = req.params;
  
  // In a real implementation, this would serve the actual file
  res.status(200).json({
    message: `Download ${filename} for job ${jobId} would be served here`,
    jobId,
    filename
  });
}));

// Helper functions
function calculateEstimatedDuration(config: AIAnalysisConfig): number {
  let baseDuration = 60; // 1 minute base
  
  baseDuration += config.models.length * 30; // 30 seconds per model
  baseDuration += config.analysisTypes.length * 45; // 45 seconds per analysis type
  
  if (config.parameters.emotion_detection) baseDuration += 60;
  if (config.parameters.topic_modeling) baseDuration += 90;
  if (config.parameters.language_complexity) baseDuration += 45;
  if (config.parameters.custom_prompts?.length) {
    baseDuration += config.parameters.custom_prompts.length * 30;
  }
  
  return baseDuration;
}

function calculateCostEstimation(config: AIAnalysisConfig) {
  const modelCosts = {
    'gpt-4-turbo': 0.01,
    'claude-3-opus': 0.015,
    'gemini-pro': 0.0005,
    'llama-2-70b': 0.0
  };

  let totalCost = 0;
  let estimatedTokens = 5000; // Base token estimate

  // Adjust token estimate based on analysis complexity
  estimatedTokens += config.analysisTypes.length * 2000;
  if (config.parameters.emotion_detection) estimatedTokens += 1000;
  if (config.parameters.topic_modeling) estimatedTokens += 2000;
  if (config.parameters.custom_prompts?.length) {
    estimatedTokens += config.parameters.custom_prompts.length * 500;
  }

  config.models.forEach(model => {
    const costPerToken = modelCosts[model as keyof typeof modelCosts] || 0.01;
    totalCost += (estimatedTokens / 1000) * costPerToken;
  });

  return {
    estimatedTokens,
    estimatedCost: Math.round(totalCost * 100) / 100,
    breakdown: config.models.map(model => ({
      model,
      tokens: estimatedTokens,
      cost: Math.round(((estimatedTokens / 1000) * (modelCosts[model as keyof typeof modelCosts] || 0.01)) * 100) / 100
    }))
  };
}

export { router as aiAnalysisRouter };