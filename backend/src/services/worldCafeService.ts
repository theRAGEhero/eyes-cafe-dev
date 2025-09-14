import axios, { AxiosInstance, AxiosError } from 'axios';
import { logger } from '@/utils/logger';
import { prisma } from '@/utils/prisma';
import { 
  WorldCafeSession, 
  WorldCafeTranscription, 
  WorldCafeParticipant,
  SyncStatus 
} from '@/types';

export class WorldCafeService {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.WORLD_CAFE_API_URL || 'http://localhost:3005';
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Eyes-Cafe/1.0.0',
      },
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`World Café API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('World Café API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging and error handling
    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`World Café API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error: AxiosError) => {
        logger.error(`World Café API Error: ${error.response?.status} ${error.config?.url}`, {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
        return Promise.reject(error);
      }
    );
  }

  // Test connection to World Café API
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/');
      logger.info('World Café API connection test successful');
      return response.status === 200;
    } catch (error) {
      logger.error('World Café API connection test failed:', error);
      return false;
    }
  }

  // Sync a single session from World Café
  async syncSession(worldCafeId: string): Promise<any> {
    const startTime = Date.now();
    
    try {
      logger.info(`Syncing session ${worldCafeId} from World Café`);

      // Fetch session data from World Café API
      const response = await this.client.get(`/api/sessions/${worldCafeId}`);
      const worldCafeSession: WorldCafeSession = response.data;

      // Check if session already exists in our database
      const existingSession = await prisma.session.findUnique({
        where: { worldCafeId },
      });

      let session;
      
      if (existingSession) {
        // Update existing session
        session = await prisma.session.update({
          where: { worldCafeId },
          data: {
            title: worldCafeSession.title,
            description: worldCafeSession.description,
            tableCount: worldCafeSession.table_count,
            status: worldCafeSession.status,
            language: worldCafeSession.language,
            lastSyncedAt: new Date(),
            syncStatus: 'completed',
          },
        });
        logger.info(`Updated existing session ${worldCafeId}`);
      } else {
        // Create new session
        session = await prisma.session.create({
          data: {
            worldCafeId,
            title: worldCafeSession.title,
            description: worldCafeSession.description,
            tableCount: worldCafeSession.table_count,
            status: worldCafeSession.status,
            language: worldCafeSession.language,
            lastSyncedAt: new Date(),
            syncStatus: 'completed',
          },
        });
        logger.info(`Created new session ${worldCafeId}`);
      }

      // Log the sync operation
      await this.logSyncOperation({
        endpoint: `/api/sessions/${worldCafeId}`,
        sessionId: worldCafeId,
        syncType: 'session',
        syncStatus: 'success',
        syncDurationMs: Date.now() - startTime,
        responseData: worldCafeSession,
      });

      return session;

    } catch (error) {
      logger.error(`Failed to sync session ${worldCafeId}:`, error);
      
      // Log the failed sync operation
      await this.logSyncOperation({
        endpoint: `/api/sessions/${worldCafeId}`,
        sessionId: worldCafeId,
        syncType: 'session',
        syncStatus: 'error',
        syncDurationMs: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  // Get all sessions from World Café API
  async getAllSessions(): Promise<WorldCafeSession[]> {
    try {
      logger.info('Fetching all sessions from World Café');
      
      const response = await this.client.get('/api/sessions');
      const sessions: WorldCafeSession[] = response.data;
      
      logger.info(`Fetched ${sessions.length} sessions from World Café`);
      return sessions;
      
    } catch (error) {
      logger.error('Failed to fetch sessions from World Café:', error);
      throw error;
    }
  }

  // Get transcriptions for a session
  async getSessionTranscriptions(
    worldCafeId: string, 
    tableId?: number
  ): Promise<WorldCafeTranscription[]> {
    try {
      if (tableId !== undefined) {
        // Fetch transcriptions for a specific table
        const endpoint = `/api/sessions/${worldCafeId}/tables/${tableId}/transcriptions`;
        logger.info(`Fetching transcriptions: ${endpoint}`);
        
        const response = await this.client.get(endpoint);
        const transcriptions: WorldCafeTranscription[] = response.data;
        
        logger.info(`Fetched ${transcriptions.length} transcriptions for table ${tableId} in session ${worldCafeId}`);
        return transcriptions;
      } else {
        // Fetch transcriptions from all tables (since general endpoint doesn't exist)
        logger.info(`Fetching transcriptions for all tables in session ${worldCafeId}`);
        
        // Get session info to determine table count
        const sessionResponse = await this.client.get(`/api/sessions/${worldCafeId}`);
        const session = sessionResponse.data;
        const tableCount = session.table_count || 10; // Default to 10 if not specified
        
        const allTranscriptions: WorldCafeTranscription[] = [];
        
        // Fetch transcriptions from each table
        for (let i = 1; i <= tableCount; i++) {
          try {
            const endpoint = `/api/sessions/${worldCafeId}/tables/${i}/transcriptions`;
            logger.debug(`Fetching transcriptions: ${endpoint}`);
            
            const response = await this.client.get(endpoint);
            const tableTranscriptions: WorldCafeTranscription[] = response.data;
            
            // Add table metadata to each transcription
            const enrichedTranscriptions = tableTranscriptions.map(transcription => ({
              ...transcription,
              table_id: i // Ensure table_id is set
            }));
            
            allTranscriptions.push(...enrichedTranscriptions);
            logger.debug(`Fetched ${tableTranscriptions.length} transcriptions from table ${i}`);
          } catch (tableError: any) {
            // Log but don't fail for individual tables that might not have transcriptions
            logger.debug(`No transcriptions found for table ${i} in session ${worldCafeId}: ${tableError.message}`);
          }
        }
        
        logger.info(`Fetched ${allTranscriptions.length} total transcriptions from ${tableCount} tables for session ${worldCafeId}`);
        return allTranscriptions;
      }
      
    } catch (error) {
      logger.error(`Failed to fetch transcriptions for session ${worldCafeId}:`, error);
      throw error;
    }
  }

  // Sync transcriptions for a session
  async syncSessionTranscriptions(worldCafeId: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      logger.info(`Syncing transcriptions for session ${worldCafeId}`);
      
      const transcriptions = await this.getSessionTranscriptions(worldCafeId);
      
      // Store transcriptions in our database for caching/analysis
      // For now, we'll just log them as we're primarily using the API
      logger.info(`Successfully fetched ${transcriptions.length} transcriptions for session ${worldCafeId}`);
      
      await this.logSyncOperation({
        endpoint: `/api/sessions/${worldCafeId}/transcriptions`,
        sessionId: worldCafeId,
        syncType: 'transcription',
        syncStatus: 'success',
        syncDurationMs: Date.now() - startTime,
        responseData: { count: transcriptions.length },
      });

    } catch (error) {
      logger.error(`Failed to sync transcriptions for session ${worldCafeId}:`, error);
      
      await this.logSyncOperation({
        endpoint: `/api/sessions/${worldCafeId}/transcriptions`,
        sessionId: worldCafeId,
        syncType: 'transcription',
        syncStatus: 'error',
        syncDurationMs: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  // Get participants for a session
  async getSessionParticipants(worldCafeId: string): Promise<WorldCafeParticipant[]> {
    try {
      logger.info(`Fetching participants for session ${worldCafeId}`);
      
      // Note: This endpoint might not exist in World Café API yet
      // We'll try it and fallback gracefully
      const response = await this.client.get(`/api/sessions/${worldCafeId}/participants`);
      const participants: WorldCafeParticipant[] = response.data;
      
      logger.info(`Fetched ${participants.length} participants for session ${worldCafeId}`);
      return participants;
      
    } catch (error) {
      logger.warn(`Could not fetch participants for session ${worldCafeId}:`, error);
      // Return empty array if endpoint doesn't exist
      return [];
    }
  }

  // Sync participants for a session
  async syncSessionParticipants(worldCafeId: string): Promise<any[]> {
    const startTime = Date.now();
    
    try {
      logger.info(`Syncing participants for session ${worldCafeId}`);
      
      const participants = await this.getSessionParticipants(worldCafeId);
      
      // Sync participants to our database
      const session = await prisma.session.findUnique({
        where: { worldCafeId },
      });

      if (!session) {
        throw new Error(`Session ${worldCafeId} not found in local database`);
      }

      const syncedParticipants = [];
      
      for (const participant of participants) {
        const existing = await prisma.participant.findFirst({
          where: {
            sessionId: session.id,
            worldCafeParticipantId: participant.id,
          },
        });

        if (existing) {
          // Update existing participant
          const updated = await prisma.participant.update({
            where: { id: existing.id },
            data: {
              name: participant.name,
              email: participant.email,
              tableAssignments: participant.table_id ? [participant.table_id] : [],
            },
          });
          syncedParticipants.push(updated);
        } else {
          // Create new participant
          const created = await prisma.participant.create({
            data: {
              sessionId: session.id,
              worldCafeParticipantId: participant.id,
              name: participant.name,
              email: participant.email,
              tableAssignments: participant.table_id ? [participant.table_id] : [],
            },
          });
          syncedParticipants.push(created);
        }
      }

      await this.logSyncOperation({
        endpoint: `/api/sessions/${worldCafeId}/participants`,
        sessionId: worldCafeId,
        syncType: 'participant',
        syncStatus: 'success',
        syncDurationMs: Date.now() - startTime,
        responseData: { count: syncedParticipants.length },
      });

      logger.info(`Successfully synced ${syncedParticipants.length} participants for session ${worldCafeId}`);
      return syncedParticipants;

    } catch (error) {
      logger.error(`Failed to sync participants for session ${worldCafeId}:`, error);
      
      await this.logSyncOperation({
        endpoint: `/api/sessions/${worldCafeId}/participants`,
        sessionId: worldCafeId,
        syncType: 'participant',
        syncStatus: 'error',
        syncDurationMs: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  // Get current World Café analysis for comparison
  async getWorldCafeAnalysis(worldCafeId: string): Promise<any> {
    try {
      logger.info(`Fetching World Café analysis for session ${worldCafeId}`);
      
      const response = await this.client.get(`/api/sessions/${worldCafeId}/analysis`);
      const analysis = response.data;
      
      logger.info(`Fetched World Café analysis for session ${worldCafeId}`);
      return analysis;
      
    } catch (error) {
      logger.warn(`Could not fetch World Café analysis for session ${worldCafeId}:`, error);
      return null;
    }
  }

  // Log sync operations for monitoring and debugging
  private async logSyncOperation(data: {
    endpoint: string;
    sessionId: string;
    syncType: string;
    syncStatus: string;
    syncDurationMs: number;
    requestData?: any;
    responseData?: any;
    errorMessage?: string;
  }): Promise<void> {
    try {
      // Only use sessionId if it's a valid CUID format, otherwise set to null
      const validSessionId = data.sessionId && data.sessionId.match(/^c[a-zA-Z0-9]{24}$/) 
        ? data.sessionId 
        : null;
        
      await prisma.apiSyncLog.create({
        data: {
          endpoint: data.endpoint,
          sessionId: validSessionId,
          syncType: data.syncType,
          syncStatus: data.syncStatus,
          syncDurationMs: data.syncDurationMs,
          requestData: data.requestData,
          responseData: data.responseData,
          errorMessage: data.errorMessage,
        },
      });
    } catch (error) {
      logger.error('Failed to log sync operation:', error);
      // Don't throw here as it's just logging
    }
  }

  // Sync all sessions from World Café
  async syncAllSessions(): Promise<{ synced: number; errors: number; sessions: any[] }> {
    const startTime = Date.now();
    const results = { synced: 0, errors: 0, sessions: [] as any[] };
    
    try {
      logger.info('Starting sync of all sessions from World Café');
      
      // Get all sessions from World Café
      const worldCafeSessions = await this.getAllSessions();
      logger.info(`Found ${worldCafeSessions.length} sessions in World Café`);
      
      // Sync each session
      for (const worldCafeSession of worldCafeSessions) {
        try {
          const session = await this.syncSession(worldCafeSession.id);
          results.sessions.push(session);
          results.synced++;
          logger.info(`Synced session: ${worldCafeSession.title} (${worldCafeSession.id})`);
        } catch (error) {
          logger.error(`Failed to sync session ${worldCafeSession.id}:`, error);
          results.errors++;
        }
      }

      await this.logSyncOperation({
        endpoint: '/api/sessions',
        sessionId: 'all',
        syncType: 'session',
        syncStatus: results.errors > 0 ? 'partial' : 'success',
        syncDurationMs: Date.now() - startTime,
        responseData: results,
      });

      logger.info(`Completed sync: ${results.synced} synced, ${results.errors} errors`);
      return results;
      
    } catch (error) {
      logger.error('Failed to sync all sessions:', error);
      
      await this.logSyncOperation({
        endpoint: '/api/sessions',
        sessionId: 'all',
        syncType: 'session',
        syncStatus: 'error',
        syncDurationMs: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      
      throw error;
    }
  }

  // Get sync status for monitoring
  async getSyncStatus(sessionId?: string): Promise<SyncStatus[]> {
    try {
      const where = sessionId ? { sessionId } : {};
      
      const logs = await prisma.apiSyncLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      return logs.map(log => ({
        sessionId: log.sessionId || '',
        lastSyncedAt: log.createdAt.toISOString(),
        status: log.syncStatus as any,
        error: log.errorMessage,
      }));
    } catch (error) {
      logger.error('Failed to get sync status:', error);
      return [];
    }
  }

  // Find stale sessions (not synced recently or in error state)
  async findStaleSessions(cutoffDate: Date): Promise<any[]> {
    try {
      const staleSessions = await prisma.session.findMany({
        where: {
          OR: [
            {
              lastSyncedAt: {
                lt: cutoffDate
              }
            },
            {
              lastSyncedAt: null,
              createdAt: {
                lt: cutoffDate
              }
            },
            {
              syncStatus: 'error'
            }
          ]
        },
        select: {
          id: true,
          worldCafeId: true,
          title: true,
          lastSyncedAt: true,
          syncStatus: true,
          createdAt: true
        }
      });
      
      logger.info(`Found ${staleSessions.length} stale sessions older than ${cutoffDate.toISOString()}`);
      return staleSessions;
    } catch (error) {
      logger.error('Failed to find stale sessions:', error);
      throw error;
    }
  }

  // Delete a session and all its related data
  async deleteSession(sessionId: string): Promise<void> {
    try {
      // Prisma will handle cascading deletes automatically
      await prisma.session.delete({
        where: { id: sessionId }
      });
      
      logger.info(`Successfully deleted session ${sessionId}`);
    } catch (error) {
      logger.error(`Failed to delete session ${sessionId}:`, error);
      throw error;
    }
  }
}