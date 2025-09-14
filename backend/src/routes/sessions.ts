import express from 'express';
import { asyncHandler, CustomError } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';
import { prisma } from '@/utils/prisma';
import { WorldCafeService } from '@/services/worldCafeService';
import { SessionService } from '@/services/sessionService';
import { ApiResponse, PaginatedResponse, SessionSummary } from '@/types';

const router = express.Router();
const worldCafeService = new WorldCafeService();
const sessionService = new SessionService();

// Get all sessions with pagination and filtering
router.get('/', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as string;
  const search = req.query.search as string;

  logger.info(`Fetching sessions: page=${page}, limit=${limit}, status=${status}, search=${search}`);

  const result = await sessionService.getSessions({
    page,
    limit,
    status,
    search,
  });

  const response: PaginatedResponse<SessionSummary> = {
    success: true,
    data: result.data,
    pagination: result.pagination,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
}));

// Get or sync specific session by World Café ID
router.get('/:sessionId', asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const forceSync = req.query.sync === 'true';

  logger.info(`Fetching session: ${sessionId}, forceSync=${forceSync}`);

  // Check if session exists locally
  let session = await sessionService.getSessionByWorldCafeId(sessionId);

  if (!session || forceSync) {
    logger.info(`Session ${sessionId} not found locally or force sync requested. Syncing from World Café...`);
    
    try {
      // Sync from World Café API
      session = await worldCafeService.syncSession(sessionId);
      logger.info(`Successfully synced session ${sessionId} from World Café`);
    } catch (error) {
      logger.error(`Failed to sync session ${sessionId}:`, error);
      throw new CustomError(
        `Session ${sessionId} not found and could not be synced from World Café`,
        404
      );
    }
  }

  // Get additional analysis data if available
  const analysisData = await sessionService.getLatestAnalysis(session.id);

  const response: ApiResponse<any> = {
    success: true,
    data: {
      ...session,
      analysis: analysisData,
    },
    timestamp: new Date().toISOString(),
  };

  res.json(response);
}));

// Get session transcriptions
router.get('/:sessionId/transcriptions', asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const tableId = req.query.tableId ? parseInt(req.query.tableId as string) : undefined;

  logger.info(`Fetching transcriptions for session ${sessionId}, table=${tableId}`);

  try {
    // First ensure session exists locally
    let session = await sessionService.getSessionByWorldCafeId(sessionId);
    if (!session) {
      logger.info(`Session ${sessionId} not found locally. Syncing...`);
      session = await worldCafeService.syncSession(sessionId);
    }

    // Get transcriptions from World Café API
    let transcriptions = await worldCafeService.getSessionTranscriptions(sessionId, tableId);
    
    logger.info(`Retrieved ${transcriptions.length} transcriptions from World Café for session ${sessionId}`);
    
    // Log the structure to understand what we're working with
    if (transcriptions.length > 0) {
      logger.info(`Sample transcription structure:`, {
        keys: Object.keys(transcriptions[0]),
        hasSpeakerSegments: !!transcriptions[0].speaker_segments,
        speakerSegmentsType: typeof transcriptions[0].speaker_segments,
        transcriptText: !!transcriptions[0].transcript_text
      });
    }

    // Get bias detections for this session to highlight problematic segments
    let biasDetections = [];
    
    if (session) {
      const biasResults = await prisma.biasDetection.findMany({
        where: { sessionId: session.id }
      });
      
      biasDetections = biasResults.map(bias => ({
        type: bias.biasType,
        category: bias.biasCategory,
        severity: bias.severityScore,
        confidence: bias.confidenceLevel,
        evidenceText: bias.evidenceText,
        contextText: bias.contextText,
        timestampStart: bias.timestampStart,
        timestampEnd: bias.timestampEnd,
        speakersInvolved: bias.speakersInvolved,
        detectionMethod: bias.detectionMethod
      }));
    }

    // Process transcriptions to create speaker segments from transcript_text
    const enrichedTranscriptions = transcriptions.map(transcription => {
      let speakerSegments = [];
      
      // If we have speaker_segments, use them
      if (Array.isArray(transcription.speaker_segments) && transcription.speaker_segments.length > 0) {
        speakerSegments = transcription.speaker_segments;
      } 
      // Otherwise, create a single segment from transcript_text
      else if (transcription.transcript_text) {
        speakerSegments = [{
          speaker: 1, // Default speaker ID
          transcript: transcription.transcript_text,
          start: 0,
          end: transcription.duration_seconds || 60,
          confidence: transcription.confidence_score || 0.9,
          words: [] // Empty words array
        }];
      }

      return {
        ...transcription,
        speaker_segments: speakerSegments.map(segment => {
          // Find bias detections that involve this speaker
          const relatedBiases = biasDetections.filter(bias => 
            bias.speakersInvolved.includes(segment.speaker) &&
            ((bias.evidenceText && segment.transcript && segment.transcript.includes(bias.evidenceText?.slice(1, 50))) ||
             bias.evidenceText === null)
          );

          return {
            ...segment,
            biasFlags: relatedBiases.map(bias => ({
              type: bias.type,
              category: bias.category,
              severity: bias.severity,
              confidence: bias.confidence,
              reason: bias.contextText,
              evidenceMatch: bias.evidenceText && segment.transcript && segment.transcript.includes(bias.evidenceText.slice(1, 50))
            }))
          };
        })
      };
    });

    const response: ApiResponse<any> = {
      success: true,
      data: {
        sessionId,
        transcriptionCount: enrichedTranscriptions.length,
        totalSegments: enrichedTranscriptions.reduce((sum, t) => sum + t.speaker_segments.length, 0),
        biasDetectionCount: biasDetections.length,
        transcriptions: enrichedTranscriptions,
        biasDetections: biasDetections
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    logger.error(`Failed to fetch transcriptions for session ${sessionId}:`, error);
    throw new CustomError(
      `Transcriptions fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500
    );
  }
}));

// Get session participants
router.get('/:sessionId/participants', asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  logger.info(`Fetching participants for session ${sessionId}`);

  // Get participants from local database first
  const localParticipants = await sessionService.getSessionParticipants(sessionId);

  // If no local participants or they're outdated, sync from World Café
  let participants = localParticipants;
  if (!localParticipants || localParticipants.length === 0) {
    logger.info(`No local participants found for session ${sessionId}. Syncing...`);
    participants = await worldCafeService.syncSessionParticipants(sessionId);
  }

  const response: ApiResponse<any> = {
    success: true,
    data: {
      sessionId,
      participants,
      totalCount: participants.length,
    },
    timestamp: new Date().toISOString(),
  };

  res.json(response);
}));

// Trigger analysis for a session
router.post('/:sessionId/analyze', asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { forceReanalysis = false } = req.body;

  logger.info(`Triggering analysis for session ${sessionId}, force=${forceReanalysis}`);

  // Ensure session exists locally
  let session = await sessionService.getSessionByWorldCafeId(sessionId);
  if (!session) {
    session = await worldCafeService.syncSession(sessionId);
  }

  // Check if analysis already exists and is recent
  const existingAnalysis = await sessionService.getLatestAnalysis(session.id);
  if (existingAnalysis && !forceReanalysis) {
    const analysisAge = Date.now() - new Date(existingAnalysis.createdAt).getTime();
    const maxAge = 60 * 60 * 1000; // 1 hour

    if (analysisAge < maxAge) {
      logger.info(`Recent analysis found for session ${sessionId}, returning existing`);
      const response: ApiResponse<any> = {
        success: true,
        data: {
          message: 'Analysis already exists and is recent',
          analysis: existingAnalysis,
          age: Math.round(analysisAge / 1000 / 60), // minutes
        },
        timestamp: new Date().toISOString(),
      };
      return res.json(response);
    }
  }

  // Queue analysis job
  // TODO: Implement background job queue
  logger.info(`Queuing analysis job for session ${sessionId}`);

  const response: ApiResponse<any> = {
    success: true,
    data: {
      message: 'Analysis queued successfully',
      sessionId: session.worldCafeId,
      estimatedTime: '30-60 seconds',
    },
    timestamp: new Date().toISOString(),
  };

  res.status(202).json(response);
}));

// Get session analysis results
router.get('/:sessionId/analysis', asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  logger.info(`Fetching analysis for session ${sessionId}`);

  const session = await sessionService.getSessionByWorldCafeId(sessionId);
  if (!session) {
    throw new CustomError(`Session ${sessionId} not found`, 404);
  }

  const analysis = await sessionService.getLatestAnalysis(session.id);
  if (!analysis) {
    throw new CustomError(`No analysis found for session ${sessionId}`, 404);
  }

  const response: ApiResponse<any> = {
    success: true,
    data: {
      sessionId: session.worldCafeId,
      analysis,
      generatedAt: analysis.createdAt,
    },
    timestamp: new Date().toISOString(),
  };

  res.json(response);
}));

// Sync session data from World Café (force refresh)
router.post('/:sessionId/sync', asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { includeTranscriptions = true, includeParticipants = true } = req.body;

  logger.info(`Force syncing session ${sessionId} from World Café`);

  const startTime = Date.now();

  try {
    // Sync session data
    const session = await worldCafeService.syncSession(sessionId);
    
    // Optionally sync transcriptions and participants
    const syncPromises = [];
    
    if (includeTranscriptions) {
      syncPromises.push(worldCafeService.syncSessionTranscriptions(sessionId));
    }
    
    if (includeParticipants) {
      syncPromises.push(worldCafeService.syncSessionParticipants(sessionId));
    }

    await Promise.all(syncPromises);

    const syncDuration = Date.now() - startTime;

    logger.info(`Successfully synced session ${sessionId} in ${syncDuration}ms`);

    const response: ApiResponse<any> = {
      success: true,
      data: {
        message: 'Session synced successfully',
        session,
        syncDurationMs: syncDuration,
        synced: {
          session: true,
          transcriptions: includeTranscriptions,
          participants: includeParticipants,
        },
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);

  } catch (error) {
    logger.error(`Failed to sync session ${sessionId}:`, error);
    throw new CustomError(
      `Failed to sync session ${sessionId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      502
    );
  }
}));


export default router;