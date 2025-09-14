import Bull from 'bull';
import { logger } from '@/utils/logger';
import { AnalysisEngine } from './analysisEngine';
import { BiasDetectionEngine } from './biasDetectionEngine';
import { ReportGenerator } from './reportGenerator';
import { WorldCafeService } from './worldCafeService';

// Job types
export interface AnalysisJob {
  sessionId: string;
  analysisTypes?: string[];
  priority?: number;
}

export interface ReportJob {
  sessionId: string;
  reportType: string;
  format: string;
  userId?: string;
}

export interface SyncJob {
  sessionId?: string;
  force?: boolean;
}

export interface CleanupJob {
  dryRun?: boolean;
  olderThanDays?: number;
}

export interface CustomAnalysisJob {
  config: {
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
  };
  priority?: number;
  estimatedDuration: number;
  createdAt: string;
}

// Queue configuration
const queueConfig = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
};

export class JobQueueManager {
  private analysisQueue: Bull.Queue;
  private reportQueue: Bull.Queue;
  private syncQueue: Bull.Queue;
  private cleanupQueue: Bull.Queue;
  
  private analysisEngine: AnalysisEngine;
  private biasDetectionEngine: BiasDetectionEngine;
  private reportGenerator: ReportGenerator;
  private worldCafeService: WorldCafeService;

  constructor() {
    // Initialize queues
    this.analysisQueue = new Bull('analysis', queueConfig);
    this.reportQueue = new Bull('reports', queueConfig);
    this.syncQueue = new Bull('sync', queueConfig);
    this.cleanupQueue = new Bull('cleanup', queueConfig);

    // Initialize services
    this.analysisEngine = new AnalysisEngine();
    this.biasDetectionEngine = new BiasDetectionEngine();
    this.reportGenerator = new ReportGenerator();
    this.worldCafeService = new WorldCafeService();

    // Setup queue processors
    this.setupProcessors();
    this.setupEventHandlers();
    
    logger.info('Job Queue Manager initialized');
  }

  /**
   * Setup job processors
   */
  private setupProcessors(): void {
    // Analysis processor
    this.analysisQueue.process('speaking-time-analysis', 2, async (job) => {
      const { sessionId, analysisTypes } = job.data as AnalysisJob;
      logger.info(`Processing speaking time analysis for session ${sessionId}`);
      
      try {
        const result = await this.analysisEngine.analyzeSession(sessionId);
        logger.info(`Speaking time analysis completed for session ${sessionId}`);
        return result;
      } catch (error) {
        logger.error(`Speaking time analysis failed for session ${sessionId}:`, error);
        throw error;
      }
    });

    // Bias detection processor
    this.analysisQueue.process('bias-detection', 2, async (job) => {
      const { sessionId } = job.data as AnalysisJob;
      logger.info(`Processing bias detection for session ${sessionId}`);
      
      try {
        // Get transcription data from our local API (which handles World Café integration)
        let transcriptions;
        try {
          const response = await fetch(`http://localhost:3002/api/sessions/${sessionId}/transcriptions`);
          if (response.ok) {
            const data = await response.json();
            transcriptions = data.data.transcriptions || [];
          } else {
            logger.warn(`Local transcription API returned ${response.status}, falling back to mock data`);
            transcriptions = [];
          }
        } catch (error) {
          logger.error(`Failed to fetch transcriptions from local API:`, error);
          transcriptions = [];
        }
        
        if (transcriptions.length === 0) {
          logger.info(`No real transcriptions found for session ${sessionId}, using mock data for testing`);
          const { getMockTranscriptions } = await import('@/utils/mockTranscriptions');
          transcriptions = getMockTranscriptions();
        }

        // Run speaking time analysis to get speaker dynamics
        const speakingAnalysis = await this.analysisEngine.analyzeSpeakingTime(sessionId, transcriptions);
        
        // Run bias detection
        const biasDetections = await this.biasDetectionEngine.detectBias(sessionId, transcriptions, speakingAnalysis);
        
        logger.info(`Bias detection completed for session ${sessionId}, found ${biasDetections.length} potential biases`);
        return { sessionId, biasDetections, analysisCount: biasDetections.length };
      } catch (error) {
        logger.error(`Bias detection failed for session ${sessionId}:`, error);
        throw error;
      }
    });

    // Report generation processor
    this.reportQueue.process('generate-report', 1, async (job) => {
      const { sessionId, reportType, format, userId } = job.data as ReportJob;
      logger.info(`Generating ${format} ${reportType} report for session ${sessionId}`);
      
      try {
        const report = await this.reportGenerator.generateSessionReport(sessionId, {
          type: reportType as any,
          format: format as any,
          sections: ['overview', 'speaking-analysis', 'bias-detection', 'insights', 'recommendations'],
          customizations: {
            includeRawData: false
          }
        });
        
        logger.info(`Report generation completed for session ${sessionId}: ${report.filePath}`);
        return report;
      } catch (error) {
        logger.error(`Report generation failed for session ${sessionId}:`, error);
        throw error;
      }
    });

    // Session sync processor
    this.syncQueue.process('sync-session', 5, async (job) => {
      const { sessionId, force } = job.data as SyncJob;
      logger.info(`Syncing session ${sessionId} ${force ? '(forced)' : ''}`);
      
      try {
        let result;
        if (sessionId) {
          // Sync specific session
          result = await this.worldCafeService.syncSession(sessionId);
        } else {
          // Sync all sessions
          result = await this.worldCafeService.syncAllSessions();
        }
        
        logger.info(`Session sync completed: ${JSON.stringify(result)}`);
        return result;
      } catch (error) {
        logger.error(`Session sync failed:`, error);
        throw error;
      }
    });

    // Session cleanup processor
    this.cleanupQueue.process('cleanup-sessions', 1, async (job) => {
      const { dryRun = false, olderThanDays = 30 } = job.data as CleanupJob;
      logger.info(`Starting session cleanup ${dryRun ? '(dry run)' : ''} - removing sessions older than ${olderThanDays} days`);
      
      try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
        
        // Find stale sessions
        const staleSessions = await this.worldCafeService.findStaleSessions(cutoffDate);
        
        if (dryRun) {
          logger.info(`Dry run: Found ${staleSessions.length} stale sessions that would be deleted`);
          return { dryRun: true, sessionsFound: staleSessions.length, sessionIds: staleSessions.map(s => s.id) };
        }
        
        // Delete stale sessions (cascading deletes will handle related data)
        let deletedCount = 0;
        for (const session of staleSessions) {
          await this.worldCafeService.deleteSession(session.id);
          deletedCount++;
          logger.info(`Deleted stale session ${session.id} (${session.worldCafeId})`);
        }
        
        logger.info(`Session cleanup completed: ${deletedCount} sessions deleted`);
        return { deletedCount, sessionIds: staleSessions.map(s => s.id) };
      } catch (error) {
        logger.error(`Session cleanup failed:`, error);
        throw error;
      }
    });

    // Custom AI analysis processor
    this.analysisQueue.process('custom-analysis', 1, async (job) => {
      const jobData = job.data as CustomAnalysisJob;
      const { config } = jobData;
      logger.info(`Processing custom AI analysis job`);
      
      try {
        // Update job progress
        await job.progress(10);

        // Simulate custom AI analysis based on configuration
        const results: any = {
          jobId: job.id,
          status: 'processing',
          progress: 10,
          startTime: new Date().toISOString()
        };

        // Process each analysis type
        for (let i = 0; i < config.analysisTypes.length; i++) {
          const analysisType = config.analysisTypes[i];
          logger.info(`Running ${analysisType} analysis`);
          
          // Simulate processing time
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Update progress
          const progress = 20 + (i + 1) * (60 / config.analysisTypes.length);
          await job.progress(progress);
          
          results[analysisType] = await this.processAnalysisType(analysisType, config);
        }

        // Generate visualizations if requested
        if (config.output.visualizations.length > 0) {
          await job.progress(85);
          results.visualizations = await this.generateVisualizations(config.output.visualizations, results);
        }

        // Generate output formats
        await job.progress(95);
        results.outputs = await this.generateOutputFiles(config.output, results);

        await job.progress(100);
        results.status = 'completed';
        results.endTime = new Date().toISOString();
        
        logger.info(`Custom AI analysis completed for job ${job.id}`);
        return results;
      } catch (error) {
        logger.error(`Custom AI analysis failed for job ${job.id}:`, error);
        throw error;
      }
    });
  }

  private async processAnalysisType(analysisType: string, config: any): Promise<any> {
    // Simulate different analysis types
    switch (analysisType) {
      case 'sentiment-deep-dive':
        return {
          sentimentScores: [0.7, 0.8, 0.6, 0.9, 0.5],
          emotionDistribution: {
            joy: 0.4, anger: 0.1, fear: 0.1, sadness: 0.2, surprise: 0.2
          },
          sentimentTrend: 'positive'
        };
      
      case 'bias-detection':
        return {
          detectedBiases: [
            { type: 'confirmation_bias', confidence: 0.75, instances: 5 },
            { type: 'gender_bias', confidence: 0.60, instances: 3 }
          ],
          biasScore: 0.35,
          recommendations: ['Implement structured turn-taking', 'Use inclusive language guidelines']
        };
        
      case 'polarization-mapping':
        return {
          polarizationIndex: 42,
          consensusTopics: ['climate change urgency', 'need for action'],
          divisiveTopics: ['specific policy measures', 'timeline for implementation'],
          bridgeOpportunities: ['shared values', 'common goals']
        };
        
      case 'participation-equity':
        return {
          speakingTimeDistribution: { equal: 0.6, dominated: 0.3, silent: 0.1 },
          interruptionMatrix: [[0, 2, 1], [1, 0, 3], [0, 1, 0]],
          equityScore: 0.72
        };
        
      default:
        return { analysisType, result: 'completed', data: {} };
    }
  }

  private async generateVisualizations(visualizations: string[], analysisResults: any): Promise<any[]> {
    // Simulate visualization generation
    return visualizations.map(viz => ({
      type: viz,
      title: `${viz.replace('_', ' ').toUpperCase()} Visualization`,
      data: 'base64_encoded_chart_data',
      format: 'png'
    }));
  }

  private async generateOutputFiles(outputConfig: any, results: any): Promise<any[]> {
    // Simulate file generation
    return outputConfig.formats.map((format: string) => ({
      format,
      filename: `analysis_results.${format}`,
      url: `/api/ai-analysis/download/${results.jobId}/analysis_results.${format}`,
      size: Math.floor(Math.random() * 1000000) + 100000 // Random size between 100KB - 1MB
    }));
  }

  /**
   * Setup event handlers for monitoring
   */
  private setupEventHandlers(): void {
    // Analysis queue events
    this.analysisQueue.on('completed', (job, result) => {
      logger.info(`Analysis job ${job.id} completed for session ${job.data.sessionId}`);
    });

    this.analysisQueue.on('failed', (job, err) => {
      logger.error(`Analysis job ${job.id} failed for session ${job.data.sessionId}:`, err.message);
    });

    this.analysisQueue.on('stalled', (job) => {
      logger.warn(`Analysis job ${job.id} stalled for session ${job.data.sessionId}`);
    });

    // Report queue events
    this.reportQueue.on('completed', (job, result) => {
      logger.info(`Report job ${job.id} completed: ${result.filePath}`);
    });

    this.reportQueue.on('failed', (job, err) => {
      logger.error(`Report job ${job.id} failed:`, err.message);
    });

    // Sync queue events
    this.syncQueue.on('completed', (job, result) => {
      logger.info(`Sync job ${job.id} completed: ${JSON.stringify(result)}`);
    });

    this.syncQueue.on('failed', (job, err) => {
      logger.error(`Sync job ${job.id} failed:`, err.message);
    });

    // Cleanup queue events
    this.cleanupQueue.on('completed', (job, result) => {
      logger.info(`Cleanup job ${job.id} completed: ${JSON.stringify(result)}`);
    });

    this.cleanupQueue.on('failed', (job, err) => {
      logger.error(`Cleanup job ${job.id} failed:`, err.message);
    });
  }

  /**
   * Queue speaking time analysis job
   */
  async queueSpeakingTimeAnalysis(sessionId: string, priority: number = 5): Promise<Bull.Job> {
    return this.analysisQueue.add('speaking-time-analysis', {
      sessionId,
      analysisTypes: ['speaking-time'],
      priority
    }, {
      priority,
      delay: 0
    });
  }

  /**
   * Queue bias detection job
   */
  async queueBiasDetection(sessionId: string, priority: number = 5): Promise<Bull.Job> {
    return this.analysisQueue.add('bias-detection', {
      sessionId,
      analysisTypes: ['bias-detection'],
      priority
    }, {
      priority,
      delay: 0
    });
  }

  /**
   * Queue complete analysis (both speaking time and bias detection)
   */
  async queueCompleteAnalysis(sessionId: string, priority: number = 5): Promise<Bull.Job[]> {
    const jobs = await Promise.all([
      this.queueSpeakingTimeAnalysis(sessionId, priority),
      this.queueBiasDetection(sessionId, priority + 1) // Bias detection depends on speaking analysis
    ]);
    
    logger.info(`Queued complete analysis for session ${sessionId}`);
    return jobs;
  }

  /**
   * Queue report generation job
   */
  async queueReportGeneration(sessionId: string, reportType: string = 'comprehensive', format: string = 'pdf', userId?: string): Promise<Bull.Job> {
    return this.reportQueue.add('generate-report', {
      sessionId,
      reportType,
      format,
      userId
    }, {
      priority: 3,
      delay: 0
    });
  }

  /**
   * Queue session sync job
   */
  async queueSessionSync(sessionId?: string, force: boolean = false): Promise<Bull.Job> {
    return this.syncQueue.add('sync-session', {
      sessionId,
      force
    }, {
      priority: force ? 1 : 5,
      delay: 0
    });
  }

  /**
   * Queue custom AI analysis
   */
  async queueCustomAnalysis(jobData: CustomAnalysisJob): Promise<Bull.Job> {
    logger.info('Queueing custom AI analysis job');
    
    return await this.analysisQueue.add('custom-analysis', jobData, {
      priority: jobData.priority || 5,
      attempts: 3,
      backoff: 'exponential',
      removeOnComplete: 50,
      removeOnFail: 10,
      delay: 0
    });
  }

  /**
   * Queue session cleanup job
   */
  async queueSessionCleanup(dryRun: boolean = false, olderThanDays: number = 30): Promise<Bull.Job> {
    return this.cleanupQueue.add('cleanup-sessions', {
      dryRun,
      olderThanDays
    }, {
      priority: 7, // Low priority
      delay: 0
    });
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<any> {
    const [analysisStats, reportStats, syncStats, cleanupStats] = await Promise.all([
      this.analysisQueue.getJobCounts(),
      this.reportQueue.getJobCounts(),
      this.syncQueue.getJobCounts(),
      this.cleanupQueue.getJobCounts()
    ]);

    return {
      analysis: analysisStats,
      reports: reportStats,
      sync: syncStats,
      cleanup: cleanupStats,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get recent job history
   */
  async getJobHistory(queueName: string, limit: number = 20): Promise<Bull.Job[]> {
    const queue = this.getQueueByName(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const completed = await queue.getCompleted(0, limit / 2);
    const failed = await queue.getFailed(0, limit / 2);
    
    return [...completed, ...failed]
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, limit);
  }

  /**
   * Get queue by name
   */
  private getQueueByName(name: string): Bull.Queue | null {
    switch (name) {
      case 'analysis': return this.analysisQueue;
      case 'reports': return this.reportQueue;
      case 'sync': return this.syncQueue;
      case 'cleanup': return this.cleanupQueue;
      default: return null;
    }
  }

  /**
   * Clean up old jobs
   */
  async cleanupJobs(): Promise<void> {
    await Promise.all([
      this.analysisQueue.clean(24 * 60 * 60 * 1000, 'completed'), // 24 hours
      this.analysisQueue.clean(72 * 60 * 60 * 1000, 'failed'), // 72 hours
      this.reportQueue.clean(24 * 60 * 60 * 1000, 'completed'),
      this.reportQueue.clean(72 * 60 * 60 * 1000, 'failed'),
      this.syncQueue.clean(6 * 60 * 60 * 1000, 'completed'), // 6 hours
      this.syncQueue.clean(24 * 60 * 60 * 1000, 'failed'),
      this.cleanupQueue.clean(7 * 24 * 60 * 60 * 1000, 'completed'), // 7 days
      this.cleanupQueue.clean(7 * 24 * 60 * 60 * 1000, 'failed')
    ]);
    
    logger.info('Job cleanup completed');
  }

  /**
   * Shutdown queues gracefully
   */
  async shutdown(): Promise<void> {
    await Promise.all([
      this.analysisQueue.close(),
      this.reportQueue.close(),
      this.syncQueue.close(),
      this.cleanupQueue.close()
    ]);
    
    logger.info('Job Queue Manager shutdown completed');
  }
}

// Export singleton instance
export const jobQueue = new JobQueueManager();