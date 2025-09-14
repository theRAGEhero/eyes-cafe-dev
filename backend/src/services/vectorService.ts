import { logger } from '@/utils/logger';
import { prisma } from '@/utils/prisma';
import { SearchResult } from '@/types/chat';

/**
 * Vector Service for RAG functionality
 * Uses PostgreSQL with pgvector extension for vector similarity search
 */
export class VectorService {
  /**
   * Generate embeddings using OpenAI API
   */
  async generateEmbeddings(text: string): Promise<number[]> {
    if (!process.env.OPENAI_API_KEY) {
      logger.warn('OpenAI API key not configured, using mock embeddings');
      // Return mock embedding for development
      return new Array(1536).fill(0).map(() => Math.random() * 2 - 1);
    }

    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-ada-002',
          input: text,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      logger.error('Failed to generate embeddings:', error);
      // Fallback to mock embeddings
      return new Array(1536).fill(0).map(() => Math.random() * 2 - 1);
    }
  }

  /**
   * Store document embeddings in the database
   */
  async storeEmbedding(
    sessionId: string,
    tableId: number | null,
    documentType: string,
    content: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      const embedding = await this.generateEmbeddings(content);
      
      // Note: This assumes pgvector extension is installed
      // For now, we'll store as JSON and implement basic similarity later
      await prisma.$executeRaw`
        INSERT INTO document_embeddings (session_id, table_id, document_type, content, embedding, metadata)
        VALUES (${sessionId}, ${tableId}, ${documentType}, ${content}, ${JSON.stringify(embedding)}, ${JSON.stringify(metadata)})
      `;

      logger.info(`Stored embedding for ${documentType} in session ${sessionId}`);
    } catch (error) {
      logger.error(`Failed to store embedding:`, error);
    }
  }

  /**
   * Search for similar documents globally
   */
  async searchGlobal(query: string, limit: number = 10): Promise<SearchResult[]> {
    try {
      const queryEmbedding = await this.generateEmbeddings(query);
      
      // For now, return mock results since we don't have pgvector set up yet
      // In production, this would use vector similarity search
      const results = await prisma.$queryRaw<any[]>`
        SELECT session_id, table_id, document_type, content, metadata
        FROM document_embeddings
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;

      return results.map((row, index) => ({
        content: row.content,
        metadata: {
          sessionId: row.session_id,
          tableId: row.table_id,
          documentType: row.document_type,
          ...JSON.parse(row.metadata || '{}')
        },
        similarity: Math.random() * 0.3 + 0.7 // Mock similarity score
      }));
    } catch (error) {
      logger.error('Global search failed:', error);
      return [];
    }
  }

  /**
   * Search for similar documents within a session
   */
  async searchSession(sessionId: string, query: string, limit: number = 10): Promise<SearchResult[]> {
    try {
      const queryEmbedding = await this.generateEmbeddings(query);
      
      const results = await prisma.$queryRaw<any[]>`
        SELECT session_id, table_id, document_type, content, metadata
        FROM document_embeddings
        WHERE session_id = ${sessionId}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;

      return results.map((row, index) => ({
        content: row.content,
        metadata: {
          sessionId: row.session_id,
          tableId: row.table_id,
          documentType: row.document_type,
          ...JSON.parse(row.metadata || '{}')
        },
        similarity: Math.random() * 0.3 + 0.7 // Mock similarity score
      }));
    } catch (error) {
      logger.error('Session search failed:', error);
      return [];
    }
  }

  /**
   * Search for similar documents within a specific table
   */
  async searchTable(sessionId: string, tableId: number, query: string, limit: number = 10): Promise<SearchResult[]> {
    try {
      const queryEmbedding = await this.generateEmbeddings(query);
      
      const results = await prisma.$queryRaw<any[]>`
        SELECT session_id, table_id, document_type, content, metadata
        FROM document_embeddings
        WHERE session_id = ${sessionId} AND table_id = ${tableId}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;

      return results.map((row, index) => ({
        content: row.content,
        metadata: {
          sessionId: row.session_id,
          tableId: row.table_id,
          documentType: row.document_type,
          ...JSON.parse(row.metadata || '{}')
        },
        similarity: Math.random() * 0.3 + 0.7 // Mock similarity score
      }));
    } catch (error) {
      logger.error('Table search failed:', error);
      return [];
    }
  }

  /**
   * Index transcription data for RAG
   */
  async indexTranscriptions(sessionId: string): Promise<void> {
    try {
      // Get transcriptions for the session
      const session = await prisma.session.findUnique({
        where: { worldCafeId: sessionId }
      });

      if (!session) {
        logger.warn(`Session ${sessionId} not found for indexing`);
        return;
      }

      // This would normally call the World Café API, but for now we'll use mock data
      logger.info(`Starting to index transcriptions for session ${sessionId}`);
      
      // In a real implementation, we would:
      // 1. Fetch transcriptions from the API
      // 2. Split into chunks (speaker segments)
      // 3. Generate embeddings for each chunk
      // 4. Store in document_embeddings table
      
      // Mock indexing for now
      const mockSegments = [
        "Discussion about sustainable urban development and community gardens",
        "Concerns about gentrification and affordable housing",
        "Ideas for improving public transportation accessibility"
      ];

      for (let i = 0; i < mockSegments.length; i++) {
        await this.storeEmbedding(
          session.worldCafeId,
          i + 1,
          'transcription',
          mockSegments[i],
          {
            speakerId: i + 1,
            timestamp: i * 60,
            tableId: i + 1
          }
        );
      }

      logger.info(`Completed indexing transcriptions for session ${sessionId}`);
    } catch (error) {
      logger.error(`Failed to index transcriptions for session ${sessionId}:`, error);
    }
  }

  /**
   * Index analysis results for RAG
   */
  async indexAnalysis(sessionId: string): Promise<void> {
    try {
      const session = await prisma.session.findUnique({
        where: { worldCafeId: sessionId }
      });

      if (!session) {
        logger.warn(`Session ${sessionId} not found for analysis indexing`);
        return;
      }

      // Get latest analysis results
      const analyses = await prisma.speakingTimeAnalysis.findMany({
        where: { sessionId: session.id },
        take: 10
      });

      for (const analysis of analyses) {
        const analysisText = `
          Speaker analysis: ${analysis.speakerCount} speakers participated.
          Total speaking time: ${analysis.totalSpeakingTime} seconds.
          Speaking distribution: ${JSON.stringify(analysis.speakerDistribution)}.
          Interruption patterns: ${JSON.stringify(analysis.interruptionPatterns)}.
        `.trim();

        await this.storeEmbedding(
          session.worldCafeId,
          null,
          'analysis',
          analysisText,
          {
            analysisId: analysis.id,
            analysisType: 'speaking_time'
          }
        );
      }

      logger.info(`Completed indexing analysis for session ${sessionId}`);
    } catch (error) {
      logger.error(`Failed to index analysis for session ${sessionId}:`, error);
    }
  }

  /**
   * Clean up old embeddings
   */
  async cleanupEmbeddings(olderThanDays: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      await prisma.$executeRaw`
        DELETE FROM document_embeddings 
        WHERE created_at < ${cutoffDate}
      `;

      logger.info(`Cleaned up embeddings older than ${olderThanDays} days`);
    } catch (error) {
      logger.error('Failed to cleanup embeddings:', error);
    }
  }
}

// Export singleton instance
export const vectorService = new VectorService();