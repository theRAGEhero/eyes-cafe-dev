import { prisma } from '@/utils/prisma';
import { logger } from '@/utils/logger';
import { SessionSummary } from '@/types';

export class SessionService {
  // Get sessions with pagination and filtering
  async getSessions(params: {
    page: number;
    limit: number;
    status?: string;
    search?: string;
  }): Promise<{
    data: SessionSummary[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const { page, limit, status, search } = params;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { worldCafeId: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    try {
      // Get total count for pagination
      const total = await prisma.session.count({ where });

      // Get sessions with related data
      const sessions = await prisma.session.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        include: {
          participants: {
            select: { id: true },
          },
          aiAnalyses: {
            select: { id: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          polarizationMetrics: {
            select: { polarizationIndex: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      // Transform to SessionSummary format
      const data: SessionSummary[] = sessions.map(session => ({
        id: session.id,
        worldCafeId: session.worldCafeId,
        title: session.title,
        status: session.status,
        tableCount: session.tableCount,
        participantCount: session.participants.length || undefined,
        lastAnalyzedAt: session.aiAnalyses[0]?.createdAt.toISOString() || undefined,
        polarizationIndex: session.polarizationMetrics[0]?.polarizationIndex || undefined,
        balanceScore: undefined, // TODO: Calculate from speaker dynamics
        alertLevel: this.calculateAlertLevel(session),
        hasNewInsights: this.checkForNewInsights(session),
      }));

      const totalPages = Math.ceil(total / limit);

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };

    } catch (error) {
      logger.error('Failed to get sessions:', error);
      throw error;
    }
  }

  // Get session by World Café ID
  async getSessionByWorldCafeId(worldCafeId: string): Promise<any> {
    try {
      const session = await prisma.session.findUnique({
        where: { worldCafeId },
        include: {
          participants: true,
          aiAnalyses: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      return session;
    } catch (error) {
      logger.error(`Failed to get session ${worldCafeId}:`, error);
      throw error;
    }
  }

  // Get latest analysis for a session
  async getLatestAnalysis(sessionId: string): Promise<any> {
    try {
      const analysis = await prisma.aiAnalysis.findFirst({
        where: { sessionId },
        orderBy: { createdAt: 'desc' },
      });

      return analysis;
    } catch (error) {
      logger.error(`Failed to get analysis for session ${sessionId}:`, error);
      throw error;
    }
  }

  // Get session participants
  async getSessionParticipants(worldCafeId: string): Promise<any[]> {
    try {
      const session = await prisma.session.findUnique({
        where: { worldCafeId },
        include: {
          participants: true,
        },
      });

      return session?.participants || [];
    } catch (error) {
      logger.error(`Failed to get participants for session ${worldCafeId}:`, error);
      throw error;
    }
  }

  // Calculate alert level based on session data
  private calculateAlertLevel(session: any): 'low' | 'medium' | 'high' | 'critical' {
    // Simple alert level calculation
    // TODO: Implement more sophisticated logic based on analysis results
    
    const polarization = session.polarizationMetrics[0]?.polarizationIndex;
    
    if (polarization >= 80) return 'critical';
    if (polarization >= 60) return 'high';
    if (polarization >= 40) return 'medium';
    return 'low';
  }

  // Check if session has new insights
  private checkForNewInsights(session: any): boolean {
    // Simple check based on recent analysis
    // TODO: Implement more sophisticated logic
    
    const lastAnalysis = session.aiAnalyses[0];
    if (!lastAnalysis) return false;
    
    const hoursSinceAnalysis = (Date.now() - lastAnalysis.createdAt.getTime()) / (1000 * 60 * 60);
    return hoursSinceAnalysis < 24; // Consider insights "new" for 24 hours
  }

  // Create or update session analysis
  async saveAnalysis(sessionId: string, analysisData: any): Promise<any> {
    try {
      const analysis = await prisma.aiAnalysis.create({
        data: {
          sessionId,
          analysisVersion: '1.0',
          processingTimeMs: analysisData.processingTimeMs,
          speakingTimeAnalysis: analysisData.speakingTimeAnalysis,
          biasDetections: analysisData.biasDetections,
          polarizationMetrics: analysisData.polarizationMetrics,
          conversationFlow: analysisData.conversationFlow,
          sentimentJourney: analysisData.sentimentJourney,
          predictiveInsights: analysisData.predictiveInsights,
          confidenceScores: analysisData.confidenceScores,
          modelVersions: analysisData.modelVersions,
          dataQualityScore: analysisData.dataQualityScore,
          warnings: analysisData.warnings || [],
        },
      });

      logger.info(`Saved analysis for session ${sessionId}`);
      return analysis;
    } catch (error) {
      logger.error(`Failed to save analysis for session ${sessionId}:`, error);
      throw error;
    }
  }

  // Get dashboard metrics
  async getDashboardMetrics(): Promise<any> {
    try {
      const [
        totalSessions,
        activeSessions,
        recentAnalyses,
        avgPolarization,
      ] = await Promise.all([
        prisma.session.count(),
        prisma.session.count({ where: { status: 'active' } }),
        prisma.aiAnalysis.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
        }),
        prisma.polarizationMetrics.aggregate({
          _avg: { polarizationIndex: true },
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            },
          },
        }),
      ]);

      return {
        totalSessions,
        activeSessions,
        analysisInProgress: 0, // TODO: Implement based on job queue
        recentInsights: recentAnalyses,
        averagePolarization: avgPolarization._avg.polarizationIndex || 0,
        averageBalance: 0, // TODO: Calculate from speaker dynamics
        criticalAlerts: 0, // TODO: Calculate based on analysis results
      };
    } catch (error) {
      logger.error('Failed to get dashboard metrics:', error);
      throw error;
    }
  }
}