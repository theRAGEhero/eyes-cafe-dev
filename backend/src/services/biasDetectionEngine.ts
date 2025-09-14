import { logger } from '@/utils/logger';
import { prisma } from '@/utils/prisma';
import {
  WorldCafeTranscription,
  SpeakerSegment,
  BiasDetection,
  SpeakingTimeAnalysis
} from '@/types';

export class BiasDetectionEngine {
  
  /**
   * Analyze conversation for various types of bias
   */
  async detectBias(
    sessionId: string,
    transcriptions: WorldCafeTranscription[],
    speakingTimeAnalysis: SpeakingTimeAnalysis[]
  ): Promise<BiasDetection[]> {
    const startTime = Date.now();
    logger.info(`Starting bias detection for session ${sessionId}`);

    try {
      const detectedBiases: BiasDetection[] = [];
      
      // Collect all segments for analysis
      const allSegments: (SpeakerSegment & { tableId: number })[] = [];
      for (const transcription of transcriptions) {
        for (const segment of transcription.speaker_segments) {
          allSegments.push({
            ...segment,
            tableId: transcription.table_id
          });
        }
      }

      if (allSegments.length === 0) {
        logger.info(`No segments to analyze for bias in session ${sessionId}`);
        return [];
      }

      // Run different bias detection algorithms
      const interruptionBiases = await this.detectInterruptionBias(allSegments);
      const participationBiases = await this.detectParticipationBias(speakingTimeAnalysis);
      const languageBiases = await this.detectLanguageBias(allSegments);
      const topicBiases = await this.detectTopicSteeringBias(allSegments);

      detectedBiases.push(
        ...interruptionBiases,
        ...participationBiases,
        ...languageBiases,
        ...topicBiases
      );

      // Store results in database
      await this.storeBiasDetections(sessionId, detectedBiases);

      const processingTime = Date.now() - startTime;
      logger.info(`Bias detection completed for session ${sessionId} in ${processingTime}ms. Found ${detectedBiases.length} potential biases.`);
      
      return detectedBiases;

    } catch (error) {
      logger.error(`Bias detection failed for session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Detect interruption-based bias patterns
   */
  private async detectInterruptionBias(
    segments: (SpeakerSegment & { tableId: number })[]
  ): Promise<BiasDetection[]> {
    const biases: BiasDetection[] = [];
    const sortedSegments = segments.sort((a, b) => a.start - b.start);

    // Track interruption patterns by speaker
    const speakerInterruptions = new Map<number, { given: number; received: number; instances: any[] }>();
    
    for (let i = 0; i < sortedSegments.length - 1; i++) {
      const current = sortedSegments[i];
      const next = sortedSegments[i + 1];
      
      // Check for significant interruption (overlap > 1 second)
      const overlap = Math.max(0, current.end - next.start);
      if (overlap > 1.0) {
        // Record interruption
        if (!speakerInterruptions.has(current.speaker)) {
          speakerInterruptions.set(current.speaker, { given: 0, received: 0, instances: [] });
        }
        if (!speakerInterruptions.has(next.speaker)) {
          speakerInterruptions.set(next.speaker, { given: 0, received: 0, instances: [] });
        }

        speakerInterruptions.get(current.speaker)!.received++;
        speakerInterruptions.get(next.speaker)!.given++;
        
        // Store instance for evidence
        speakerInterruptions.get(next.speaker)!.instances.push({
          timestamp: [current.start, next.start],
          interruptedSpeaker: current.speaker,
          overlapDuration: overlap,
          context: `${current.transcript.slice(-50)}... [INTERRUPTED] ${next.transcript.slice(0, 50)}...`
        });
      }
    }

    // Analyze patterns for bias
    const speakers = Array.from(speakerInterruptions.keys());
    const avgInterruptionsGiven = speakers.reduce((sum, speaker) => 
      sum + speakerInterruptions.get(speaker)!.given, 0) / speakers.length;

    // Flag speakers with significantly higher interruption rates
    for (const [speaker, data] of speakerInterruptions.entries()) {
      if (data.given > avgInterruptionsGiven * 2.5 && data.instances.length > 0) {
        const severity = Math.min(1.0, data.given / (avgInterruptionsGiven * 4));
        
        biases.push({
          type: 'participation',
          category: 'interruption',
          severity,
          confidence: 0.75,
          evidence: {
            textSample: data.instances[0].context,
            context: `Speaker ${speaker} interrupted others ${data.given} times, significantly above average (${avgInterruptionsGiven.toFixed(1)})`,
            timestamp: data.instances[0].timestamp,
            speakersInvolved: [speaker, data.instances[0].interruptedSpeaker]
          },
          impact: {
            affectedParticipants: speakers.filter(s => 
              speakerInterruptions.get(s)!.received > 0
            ).map(s => `speaker_${s}`),
            groupDynamicsEffect: 'May create power imbalance and reduce participation from interrupted speakers',
            recommendedIntervention: 'Facilitator should establish turn-taking protocols and ensure balanced speaking opportunities'
          },
          detectionMethod: 'behavioral'
        });
      }
    }

    return biases;
  }

  /**
   * Detect participation imbalance bias
   */
  private async detectParticipationBias(
    speakingAnalysis: SpeakingTimeAnalysis[]
  ): Promise<BiasDetection[]> {
    const biases: BiasDetection[] = [];
    
    if (speakingAnalysis.length < 3) return biases;

    // Calculate participation distribution
    const speakingTimes = speakingAnalysis.map(s => s.percentage);
    const avgPercentage = speakingTimes.reduce((sum, p) => sum + p, 0) / speakingTimes.length;
    const expectedPercentage = 100 / speakingAnalysis.length;

    // Identify extremely dominant speakers
    const dominantSpeakers = speakingAnalysis.filter(s => 
      s.percentage > expectedPercentage * 2.5 && s.dominanceIndex > 2.0
    );

    // Identify marginalized speakers
    const marginalizedSpeakers = speakingAnalysis.filter(s => 
      s.percentage < expectedPercentage * 0.3 && s.turnsCount < 3
    );

    // Flag significant participation imbalances
    if (dominantSpeakers.length > 0 && marginalizedSpeakers.length > 0) {
      const severity = Math.min(1.0, 
        (dominantSpeakers[0].percentage - expectedPercentage) / expectedPercentage
      );

      biases.push({
        type: 'participation',
        category: 'exclusion',
        severity,
        confidence: 0.82,
        evidence: {
          textSample: `Participation imbalance detected: Speaker dominates ${dominantSpeakers[0].percentage.toFixed(1)}% of conversation`,
          context: `${dominantSpeakers.length} dominant speaker(s) and ${marginalizedSpeakers.length} marginalized participant(s) detected`,
          timestamp: [0, 999], // Full conversation
          speakersInvolved: [
            ...dominantSpeakers.map(s => parseInt(s.participantId.split('_')[1])),
            ...marginalizedSpeakers.map(s => parseInt(s.participantId.split('_')[1]))
          ]
        },
        impact: {
          affectedParticipants: marginalizedSpeakers.map(s => s.participantId),
          groupDynamicsEffect: 'Unequal participation may silence diverse perspectives and reduce group intelligence',
          recommendedIntervention: 'Use structured turn-taking, small group breakouts, or round-robin discussion formats'
        },
        detectionMethod: 'behavioral'
      });
    }

    return biases;
  }

  /**
   * Detect language and communication pattern bias
   */
  private async detectLanguageBias(
    segments: (SpeakerSegment & { tableId: number })[]
  ): Promise<BiasDetection[]> {
    const biases: BiasDetection[] = [];

    // Keywords that might indicate dismissive language - made more sensitive
    const dismissivePatterns = [
      /\b(but|however|actually|well actually|i disagree|that's wrong|no[,.]|doesn't make sense)\b/gi,
      /\b(you don't understand|obviously|clearly)\b/gi,
      /\b(let me explain|as i said|like i mentioned)\b/gi
    ];

    // Keywords that might indicate inclusive language
    const inclusivePatterns = [
      /\b(i think|maybe|perhaps|what if|have you considered)\b/gi,
      /\b(that's interesting|good point|i hear you|tell me more)\b/gi,
      /\b(building on that|adding to|yes and)\b/gi
    ];

    // Analyze each speaker's language patterns
    const speakerPatterns = new Map<number, {
      dismissive: number;
      inclusive: number;
      totalWords: number;
      examples: string[];
    }>();

    logger.info(`Analyzing language bias for ${segments.length} segments`);

    for (const segment of segments) {
      if (!speakerPatterns.has(segment.speaker)) {
        speakerPatterns.set(segment.speaker, {
          dismissive: 0,
          inclusive: 0,
          totalWords: 0,
          examples: []
        });
      }

      const pattern = speakerPatterns.get(segment.speaker)!;
      const words = segment.transcript.split(/\s+/).length;
      pattern.totalWords += words;

      // Count dismissive patterns
      for (const dismissivePattern of dismissivePatterns) {
        const matches = segment.transcript.match(dismissivePattern);
        if (matches) {
          pattern.dismissive += matches.length;
          pattern.examples.push(`"${segment.transcript.slice(0, 100)}..."`);
          logger.info(`Found dismissive pattern for speaker ${segment.speaker}: ${matches.join(', ')}`);
        }
      }

      // Count inclusive patterns
      for (const inclusivePattern of inclusivePatterns) {
        const matches = segment.transcript.match(inclusivePattern);
        if (matches) {
          pattern.inclusive += matches.length;
        }
      }
    }

    // Identify speakers with high dismissive-to-inclusive ratios
    for (const [speaker, pattern] of speakerPatterns.entries()) {
      if (pattern.totalWords > 50) { // Only analyze speakers with sufficient data
        const dismissiveRatio = pattern.dismissive / (pattern.totalWords / 100); // per 100 words
        const inclusiveRatio = pattern.inclusive / (pattern.totalWords / 100);
        
        // Flag if dismissive language is higher than inclusive (made more sensitive)
        if (dismissiveRatio > 1 && dismissiveRatio > inclusiveRatio) {
          const severity = Math.min(1.0, dismissiveRatio / 10);
          
          biases.push({
            type: 'language',
            category: 'dismissal',
            severity,
            confidence: 0.68,
            evidence: {
              textSample: pattern.examples[0] || 'Dismissive language patterns detected',
              context: `Speaker ${speaker} used dismissive language ${pattern.dismissive} times vs ${pattern.inclusive} inclusive phrases`,
              timestamp: [0, 999],
              speakersInvolved: [speaker]
            },
            impact: {
              affectedParticipants: ['multiple_participants'],
              groupDynamicsEffect: 'Dismissive language can shut down conversation and make others feel unheard',
              recommendedIntervention: 'Encourage curious questions and "yes, and..." responses instead of contradictory statements'
            },
            detectionMethod: 'pattern'
          });
        }
      }
    }

    return biases;
  }

  /**
   * Detect topic steering and agenda-setting bias
   */
  private async detectTopicSteeringBias(
    segments: (SpeakerSegment & { tableId: number })[]
  ): Promise<BiasDetection[]> {
    const biases: BiasDetection[] = [];

    // Topic transition phrases that might indicate steering
    const steeringPatterns = [
      /\b(let's talk about|we should discuss|moving on to|what about|i want to focus on)\b/gi,
      /\b(more importantly|the real issue is|what we need to address|the priority should be)\b/gi,
      /\b(getting back to|as i was saying|to return to my point)\b/gi
    ];

    // Track topic steering by speaker
    const steeringBehavior = new Map<number, {
      steeringCount: number;
      examples: string[];
      consecutiveTopicChanges: number;
    }>();

    let currentTopic: string | null = null;
    let topicChanges = 0;

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      
      if (!steeringBehavior.has(segment.speaker)) {
        steeringBehavior.set(segment.speaker, {
          steeringCount: 0,
          examples: [],
          consecutiveTopicChanges: 0
        });
      }

      const behavior = steeringBehavior.get(segment.speaker)!;

      // Check for steering language
      for (const pattern of steeringPatterns) {
        const matches = segment.transcript.match(pattern);
        if (matches) {
          behavior.steeringCount += matches.length;
          behavior.examples.push(segment.transcript.slice(0, 150));
          topicChanges++;
        }
      }

      // Simple topic change detection (if speaker changes direction significantly)
      const isTopicChange = segment.transcript.toLowerCase().includes('but') && 
                           segment.transcript.length > 100 &&
                           i > 0 && segments[i-1].speaker !== segment.speaker;
      
      if (isTopicChange) {
        behavior.consecutiveTopicChanges++;
      }
    }

    // Identify speakers who excessively steer conversations
    const avgSteering = Array.from(steeringBehavior.values())
      .reduce((sum, b) => sum + b.steeringCount, 0) / steeringBehavior.size;

    for (const [speaker, behavior] of steeringBehavior.entries()) {
      if (behavior.steeringCount > avgSteering * 3 && behavior.steeringCount > 3) {
        const severity = Math.min(1.0, behavior.steeringCount / 10);
        
        biases.push({
          type: 'topic',
          category: 'topic_steering',
          severity,
          confidence: 0.72,
          evidence: {
            textSample: behavior.examples[0] || 'Topic steering detected',
            context: `Speaker ${speaker} attempted to steer conversation ${behavior.steeringCount} times, significantly above average`,
            timestamp: [0, 999],
            speakersInvolved: [speaker]
          },
          impact: {
            affectedParticipants: ['group_discussion'],
            groupDynamicsEffect: 'Topic steering can prevent organic conversation flow and marginalize others\' interests',
            recommendedIntervention: 'Use parking lot for new topics, establish topic boundaries, or rotate topic leadership'
          },
          detectionMethod: 'pattern'
        });
      }
    }

    return biases;
  }

  /**
   * Store bias detection results in database
   */
  private async storeBiasDetections(
    sessionId: string,
    biases: BiasDetection[]
  ): Promise<void> {
    try {
      // Find session by world cafe ID
      const session = await prisma.session.findFirst({
        where: { worldCafeId: sessionId }
      });

      if (!session) {
        throw new Error(`Session ${sessionId} not found in database`);
      }

      // Store each bias detection
      for (const bias of biases) {
        await prisma.biasDetection.create({
          data: {
            sessionId: session.id,
            tableId: bias.evidence.speakersInvolved[0] ? undefined : null, // Simplified for now
            biasType: bias.type,
            biasCategory: bias.category,
            evidenceText: bias.evidence.textSample,
            contextText: bias.evidence.context,
            severityScore: bias.severity,
            timestampStart: bias.evidence.timestamp[0],
            timestampEnd: bias.evidence.timestamp[1],
            speakersInvolved: bias.evidence.speakersInvolved,
            detectionMethod: bias.detectionMethod,
            confidenceLevel: bias.confidence,
          }
        });
      }

      logger.info(`Stored ${biases.length} bias detections for session ${sessionId}`);
      
    } catch (error) {
      logger.error(`Failed to store bias detections for session ${sessionId}:`, error);
      throw error;
    }
  }
}