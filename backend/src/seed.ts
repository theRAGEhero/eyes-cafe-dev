import { prisma } from '@/utils/prisma';
import { logger } from '@/utils/logger';

async function main() {
  logger.info('Starting database seed...');

  // Clear existing data (optional - be careful in production)
  if (process.env.NODE_ENV === 'development') {
    logger.info('Clearing existing data...');
    
    await prisma.apiSyncLog.deleteMany();
    await prisma.customInsight.deleteMany();
    await prisma.prediction.deleteMany();
    await prisma.sessionPattern.deleteMany();
    await prisma.generatedReport.deleteMany();
    await prisma.polarizationMetrics.deleteMany();
    await prisma.biasDetection.deleteMany();
    await prisma.speakerDynamics.deleteMany();
    await prisma.aiAnalysis.deleteMany();
    await prisma.participant.deleteMany();
    await prisma.session.deleteMany();
    
    logger.info('Existing data cleared');
  }

  // Create sample sessions
  logger.info('Creating sample sessions...');

  const session1 = await prisma.session.create({
    data: {
      worldCafeId: 'sample-session-1',
      title: 'Innovation in Healthcare',
      description: 'Exploring new approaches to healthcare delivery and patient engagement',
      tableCount: 6,
      status: 'completed',
      language: 'en-US',
      syncStatus: 'completed',
      lastSyncedAt: new Date(),
    },
  });

  const session2 = await prisma.session.create({
    data: {
      worldCafeId: 'sample-session-2',
      title: 'Sustainable Urban Development',
      description: 'Discussing strategies for creating sustainable and livable cities',
      tableCount: 8,
      status: 'active',
      language: 'en-US',
      syncStatus: 'completed',
      lastSyncedAt: new Date(),
    },
  });

  const session3 = await prisma.session.create({
    data: {
      worldCafeId: 'sample-session-3',
      title: 'Future of Remote Work',
      description: 'Exploring the long-term implications of remote and hybrid work models',
      tableCount: 4,
      status: 'active',
      language: 'en-US',
      syncStatus: 'completed',
      lastSyncedAt: new Date(),
    },
  });

  logger.info(`Created ${3} sample sessions`);

  // Create sample participants
  logger.info('Creating sample participants...');

  const participants = [
    { name: 'Alice Johnson', email: 'alice@example.com', sessionId: session1.id },
    { name: 'Bob Smith', email: 'bob@example.com', sessionId: session1.id },
    { name: 'Carol Davis', email: 'carol@example.com', sessionId: session1.id },
    { name: 'David Wilson', email: 'david@example.com', sessionId: session2.id },
    { name: 'Eva Martinez', email: 'eva@example.com', sessionId: session2.id },
    { name: 'Frank Brown', email: 'frank@example.com', sessionId: session3.id },
  ];

  for (const participant of participants) {
    await prisma.participant.create({
      data: {
        ...participant,
        worldCafeParticipantId: `participant-${Math.random().toString(36).substr(2, 9)}`,
        tableAssignments: [1, 2], // Sample table assignments
      },
    });
  }

  logger.info(`Created ${participants.length} sample participants`);

  // Create sample analysis data
  logger.info('Creating sample analysis data...');

  const analysis1 = await prisma.aiAnalysis.create({
    data: {
      sessionId: session1.id,
      analysisVersion: '1.0',
      processingTimeMs: 45000,
      speakingTimeAnalysis: {
        totalDuration: 3600,
        participants: [
          { id: 'alice', totalSeconds: 720, percentage: 20, turnsCount: 15 },
          { id: 'bob', totalSeconds: 540, percentage: 15, turnsCount: 12 },
          { id: 'carol', totalSeconds: 900, percentage: 25, turnsCount: 18 },
        ],
      },
      biasDetections: [
        {
          type: 'gender',
          severity: 0.3,
          evidence: 'Mild interruption pattern observed',
          confidence: 0.75,
        },
      ],
      polarizationMetrics: {
        index: 35,
        trend: 'stable',
        echoChambersDetected: false,
      },
      conversationFlow: {
        flowType: 'structured',
        balanceScore: 0.8,
        progressScore: 0.9,
      },
      confidenceScores: {
        overall: 0.85,
        speakingTime: 0.95,
        bias: 0.75,
        polarization: 0.80,
      },
      dataQualityScore: 0.9,
    },
  });

  const analysis2 = await prisma.aiAnalysis.create({
    data: {
      sessionId: session2.id,
      analysisVersion: '1.0',
      processingTimeMs: 52000,
      speakingTimeAnalysis: {
        totalDuration: 4200,
        participants: [
          { id: 'david', totalSeconds: 1050, percentage: 25, turnsCount: 20 },
          { id: 'eva', totalSeconds: 840, percentage: 20, turnsCount: 16 },
        ],
      },
      biasDetections: [
        {
          type: 'participation',
          severity: 0.6,
          evidence: 'Uneven participation distribution',
          confidence: 0.85,
        },
      ],
      polarizationMetrics: {
        index: 67,
        trend: 'increasing',
        echoChambersDetected: true,
      },
      conversationFlow: {
        flowType: 'chaotic',
        balanceScore: 0.4,
        progressScore: 0.6,
      },
      confidenceScores: {
        overall: 0.78,
        speakingTime: 0.90,
        bias: 0.85,
        polarization: 0.88,
      },
      dataQualityScore: 0.85,
    },
  });

  logger.info(`Created ${2} sample analyses`);

  // Create sample polarization metrics
  await prisma.polarizationMetrics.create({
    data: {
      sessionId: session1.id,
      tableId: 1,
      polarizationIndex: 35,
      topicDivergence: 0.3,
      echoChamberDetected: false,
      bridgeBuilders: [1, 3],
      opposingGroups: null,
      trendDirection: 'stable',
      trendVelocity: 0.1,
      interventionRecommended: false,
    },
  });

  await prisma.polarizationMetrics.create({
    data: {
      sessionId: session2.id,
      tableId: 1,
      polarizationIndex: 67,
      topicDivergence: 0.7,
      echoChamberDetected: true,
      bridgeBuilders: [],
      opposingGroups: {
        groups: [
          { members: [1, 2], position: 'pro-development' },
          { members: [3, 4], position: 'environmental-focus' },
        ],
      },
      trendDirection: 'increasing',
      trendVelocity: 0.8,
      interventionRecommended: true,
    },
  });

  logger.info('Created sample polarization metrics');

  // Create sample bias detections
  await prisma.biasDetection.create({
    data: {
      sessionId: session1.id,
      tableId: 1,
      biasType: 'gender',
      biasCategory: 'interruption',
      evidenceText: 'Pattern of male participants interrupting female participants observed',
      contextText: 'During discussion about healthcare priorities',
      severityScore: 0.3,
      timestampStart: 1250.5,
      timestampEnd: 1380.2,
      speakersInvolved: [1, 2],
      detectionMethod: 'pattern',
      confidenceLevel: 0.75,
    },
  });

  await prisma.biasDetection.create({
    data: {
      sessionId: session2.id,
      tableId: 1,
      biasType: 'participation',
      biasCategory: 'exclusion',
      evidenceText: 'Systematic exclusion of certain viewpoints from discussion',
      contextText: 'During urban planning segment',
      severityScore: 0.6,
      timestampStart: 2100.0,
      timestampEnd: 2450.8,
      speakersInvolved: [1, 3, 4],
      detectionMethod: 'behavioral',
      confidenceLevel: 0.85,
    },
  });

  logger.info('Created sample bias detections');

  // Create sample API sync logs
  await prisma.apiSyncLog.create({
    data: {
      endpoint: '/api/sessions/sample-session-1',
      sessionId: 'sample-session-1',
      syncType: 'session',
      syncStatus: 'success',
      syncDurationMs: 1250,
      responseData: { status: 'success', message: 'Session synced successfully' },
    },
  });

  await prisma.apiSyncLog.create({
    data: {
      endpoint: '/api/sessions/sample-session-2/all-transcriptions',
      sessionId: 'sample-session-2',
      syncType: 'transcription',
      syncStatus: 'success',
      syncDurationMs: 3200,
      responseData: { transcriptionCount: 24 },
    },
  });

  logger.info('Created sample API sync logs');

  logger.info('Database seed completed successfully!');
}

main()
  .catch((e) => {
    logger.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });