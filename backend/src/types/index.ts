// Common types for Eyes Café platform

export interface WorldCafeSession {
  id: string;
  title: string;
  description?: string;
  table_count: number;
  status: string;
  language: string;
  created_at: string;
  updated_at: string;
}

export interface WorldCafeTranscription {
  id: string;
  session_id: string;
  table_id: number;
  transcript_text: string;
  confidence_score: number;
  speaker_segments: SpeakerSegment[];
  timestamps?: any;
  word_count: number;
  language: string;
  created_at: string;
}

export interface SpeakerSegment {
  speaker: number;
  transcript: string;
  start: number;
  end: number;
  confidence: number;
  words?: WordTimestamp[];
}

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

export interface WorldCafeParticipant {
  id: string;
  session_id: string;
  table_id?: number;
  name: string;
  email?: string;
  is_facilitator: boolean;
  joined_at: string;
  left_at?: string;
}

// Analysis types
export interface SpeakingTimeAnalysis {
  participantId: string;
  participantName: string;
  tableId?: number;
  
  // Time Metrics
  totalSeconds: number;
  percentage: number;
  turnsCount: number;
  averageTurnLength: number;
  longestTurn: number;
  shortestTurn: number;
  
  // Behavioral Metrics
  interruptionCount: number;
  interruptedCount: number;
  wordsPerMinute: number;
  pauseAnalysis?: {
    totalPauses: number;
    averagePauseLength: number;
    fillerWords: number;
  };
  
  // Comparison Metrics
  dominanceIndex: number; // 0-1, where 0.5 is balanced
  engagementLevel: 'low' | 'medium' | 'high';
}

export interface BiasDetection {
  type: 'gender' | 'cultural' | 'topic' | 'participation' | 'language';
  category: 'interruption' | 'dismissal' | 'topic_steering' | 'exclusion';
  severity: number; // 0-1
  confidence: number; // 0-1
  
  evidence: {
    textSample: string;
    context: string;
    timestamp: [number, number];
    speakersInvolved: number[];
  };
  
  impact: {
    affectedParticipants: string[];
    groupDynamicsEffect: string;
    recommendedIntervention: string;
  };
  
  detectionMethod: 'keyword' | 'pattern' | 'ml_model' | 'behavioral';
}

export interface PolarizationMetrics {
  // Core Measurements
  index: number; // 0-100
  trend: 'increasing' | 'decreasing' | 'stable';
  velocity: number; // Rate of change
  
  // Group Analysis
  echoChambersDetected: boolean;
  opposingGroups: {
    group1: number[];
    group2: number[];
    disagreementTopics: string[];
    intensityLevel: number;
  }[];
  
  // Bridge Analysis
  bridgeBuilders: {
    participantId: number;
    bridgingScore: number;
    connectingStatements: string[];
  }[];
  
  // Intervention Recommendations
  interventionSuggested: boolean;
  interventionType?: 'redirect' | 'moderate' | 'breakout' | 'reset';
  interventionTiming?: number; // seconds from start
  interventionReason?: string;
}

export interface ConversationFlow {
  // Topic Evolution
  topicProgression: {
    topic: string;
    startTime: number;
    endTime: number;
    participantsInvolved: number[];
    engagementLevel: number;
    resolution: 'resolved' | 'unresolved' | 'tabled' | 'evolving';
  }[];
  
  // Flow Patterns
  flowType: 'linear' | 'circular' | 'chaotic' | 'structured';
  transitionQuality: number; // How smoothly topics flow
  
  // Conversation Health
  balanceScore: number; // How balanced participation is
  progressScore: number; // How much progress is being made
  energyLevels: {
    timestamp: number;
    energy: number; // 0-100
  }[];
  
  // Critical Moments
  turningPoints: {
    timestamp: number;
    type: 'breakthrough' | 'conflict' | 'consensus' | 'derailment';
    description: string;
    impact: number;
  }[];
}

export interface SessionPrediction {
  // Outcome Predictions
  outcomeCategory: 'productive' | 'conflicted' | 'stagnant' | 'breakthrough';
  confidenceScore: number;
  timeToOutcome?: number; // estimated minutes
  
  // Risk Assessment
  riskFactors: {
    factor: string;
    severity: number;
    likelihood: number;
    description: string;
  }[];
  
  // Success Indicators
  successFactors: {
    factor: string;
    strength: number;
    description: string;
  }[];
  
  // Intervention Recommendations
  interventionTimings: {
    recommendedTime: number;
    interventionType: string;
    reason: string;
    expectedImpact: number;
  }[];
  
  // Facilitator Guidance
  facilitatorTips: string[];
  participantInsights: {
    participantId: number;
    role: 'leader' | 'supporter' | 'challenger' | 'observer';
    recommendation: string;
  }[];
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Report types
export interface ReportConfiguration {
  type: 'executive' | 'facilitator' | 'academic' | 'comparative' | 'real-time';
  format: 'pdf' | 'html' | 'csv' | 'json' | 'interactive';
  sections: string[];
  customizations?: {
    includeRawData?: boolean;
    chartTypes?: string[];
    dateRange?: {
      start: string;
      end: string;
    };
    filters?: Record<string, any>;
  };
  scheduling?: {
    enabled: boolean;
    frequency?: 'once' | 'daily' | 'weekly' | 'monthly';
    recipients?: string[];
  };
}

export interface GeneratedReport {
  id: string;
  sessionId: string;
  reportType: string;
  format: string;
  filePath?: string;
  fileSize?: number;
  generatedAt: string;
  expiresAt?: string;
  downloadCount: number;
}

// Polling and sync types
export interface SyncStatus {
  sessionId: string;
  lastSyncedAt?: string;
  status: 'pending' | 'syncing' | 'completed' | 'error';
  error?: string;
  nextSyncAt?: string;
}

export interface PollingConfig {
  activeSessions: number; // 30s
  recentSessions: number; // 5min
  completedSessions: number; // 1hr
}

// Dashboard types
export interface DashboardMetrics {
  totalSessions: number;
  activeSessions: number;
  analysisInProgress: number;
  recentInsights: number;
  averagePolarization: number;
  averageBalance: number;
  criticalAlerts: number;
}

export interface SessionSummary {
  id: string;
  worldCafeId: string;
  title: string;
  status: string;
  tableCount: number;
  participantCount?: number;
  lastAnalyzedAt?: string;
  polarizationIndex?: number;
  balanceScore?: number;
  alertLevel: 'low' | 'medium' | 'high' | 'critical';
  hasNewInsights: boolean;
}