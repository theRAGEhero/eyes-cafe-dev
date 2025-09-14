'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  Activity, 
  BarChart3, 
  MessageSquare, 
  MessageCircle,
  TrendingUp,
  Users,
  AlertTriangle,
  Download,
  Play,
  RefreshCw,
  Loader2,
  Clock,
  Volume2
} from 'lucide-react';
import Link from 'next/link';
import { TranscriptionViewer } from '@/components/transcription/TranscriptionViewer';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { SessionAnalysisCharts } from '@/components/charts/SessionAnalysisCharts';
import { AIAnalysisPanel } from '@/components/analysis/AIAnalysisPanel';

interface SessionDetails {
  id: string;
  worldCafeId: string;
  title: string;
  description?: string;
  status: string;
  tableCount: number;
  participantCount?: number;
  alertLevel: string;
  hasNewInsights: boolean;
  lastAnalyzedAt?: string;
  polarizationIndex?: number;
  createdAt: string;
  updatedAt: string;
}

interface SpeakingAnalysis {
  participantId: string;
  participantName: string;
  totalSeconds: number;
  percentage: number;
  turnsCount: number;
  averageTurnLength: number;
  interruptionCount: number;
  wordsPerMinute: number;
  dominanceIndex: number;
  engagementLevel: 'low' | 'medium' | 'high';
}

interface BiasDetection {
  type: string;
  category: string;
  severity: number;
  confidence: number;
  evidenceText: string;
  contextText: string;
  detectionMethod: string;
}

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  
  const [session, setSession] = useState<SessionDetails | null>(null);
  const [speakingAnalysis, setSpeakingAnalysis] = useState<SpeakingAnalysis[]>([]);
  const [biasDetections, setBiasDetections] = useState<BiasDetection[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'facilitator' | 'participant' | 'analyst'>('facilitator');
  const [transcriptionData, setTranscriptionData] = useState<string>('');

  useEffect(() => {
    if (sessionId) {
      fetchSessionDetails();
    }
  }, [sessionId]);

  useEffect(() => {
    if (session?.worldCafeId) {
      fetchTranscriptionData();
    }
  }, [session?.worldCafeId]);

  const fetchTranscriptionData = async () => {
    if (!session?.worldCafeId) return;
    
    try {
      // Get transcription from World Café API or backend
      const response = await fetch(`http://localhost:3002/api/sessions/${sessionId}/transcription`);
      if (response.ok) {
        const data = await response.json();
        setTranscriptionData(data.data || 'No transcription available');
      } else {
        // Fallback to mock data for demo
        setTranscriptionData(`Sample transcription for World Café session ${session?.worldCafeId}:\n\nSpeaker A: I think the main challenge we're facing is community engagement...\nSpeaker B: Building on what you said, I've noticed that people want to contribute but don't always know how...\nSpeaker C: That's interesting - in our neighborhood, we've found that creating small, informal gatherings first really helps build trust...`);
      }
    } catch (error) {
      console.error('Failed to fetch transcription:', error);
      setTranscriptionData('Error loading transcription data');
    }
  };


  const fetchSessionDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch session basic info
      const sessionResponse = await fetch(`http://localhost:3002/api/sessions/${sessionId}`);
      const sessionData = await sessionResponse.json();
      
      if (sessionData.success) {
        setSession(sessionData.data);
        
        // Fetch analysis data if available
        fetchAnalysisData();
      } else {
        setError('Session not found');
      }
    } catch (err) {
      setError('Failed to load session details');
      console.error('Session fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalysisData = async () => {
    try {
      // Fetch speaking time analysis
      const speakingResponse = await fetch(`http://localhost:3002/api/analysis/sessions/${sessionId}/speaking-time`);
      if (speakingResponse.ok) {
        const speakingData = await speakingResponse.json();
        if (speakingData.success && speakingData.data.speakingTimeAnalysis) {
          setSpeakingAnalysis(speakingData.data.speakingTimeAnalysis);
        }
      }
      
      // Fetch bias detection
      const biasResponse = await fetch(`http://localhost:3002/api/analysis/sessions/${sessionId}/bias-detection`);
      if (biasResponse.ok) {
        const biasData = await biasResponse.json();
        if (biasData.success && biasData.data.biasDetections) {
          setBiasDetections(biasData.data.biasDetections);
        }
      }
    } catch (err) {
      console.error('Analysis fetch error:', err);
    }
  };

  const runAnalysis = async () => {
    try {
      setAnalyzing(true);
      const response = await fetch(`http://localhost:3002/api/jobs/analysis/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisTypes: ['complete'], priority: 3 })
      });
      
      if (response.ok) {
        // Wait for analysis to complete, then refresh
        setTimeout(() => {
          fetchAnalysisData();
        }, 3000);
      }
    } catch (err) {
      console.error('Analysis error:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const generateReport = async () => {
    try {
      setGenerating(true);
      const response = await fetch(`http://localhost:3002/api/jobs/reports/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportType: 'comprehensive', format: 'pdf' })
      });
      
      if (response.ok) {
        const data = await response.json();
        // Wait for report generation, then download
        setTimeout(() => {
          window.open(`http://localhost:3002${data.data.fileUrl}`, '_blank');
        }, 5000);
      }
    } catch (err) {
      console.error('Report generation error:', err);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <SessionDetailsSkeleton />;
  }

  if (error || !session) {
    return <SessionError error={error} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link 
              href="/"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Link>
          </div>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{session.title}</h1>
              <p className="mt-2 text-gray-600">
                Session ID: {session.worldCafeId}
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={runAnalysis}
                disabled={analyzing}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {analyzing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                {analyzing ? 'Analyzing...' : 'Run Analysis'}
              </button>
              
              <button
                onClick={generateReport}
                disabled={generating}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                {generating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {generating ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          </div>
        </div>

        {/* Session Info */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Status</p>
                <p className="text-xl font-bold text-gray-900 capitalize">{session.status}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tables</p>
                <p className="text-xl font-bold text-gray-900">{session.tableCount}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <AlertTriangle className={`h-8 w-8 ${
                session.alertLevel === 'high' ? 'text-red-500' : 
                session.alertLevel === 'medium' ? 'text-yellow-500' : 'text-green-500'
              }`} />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Alert Level</p>
                <p className="text-xl font-bold text-gray-900 capitalize">{session.alertLevel}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Analysis</p>
                <p className="text-xl font-bold text-gray-900">
                  {session.lastAnalyzedAt ? 'Available' : 'None'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Results - Hidden in Facilitator Mode */}
        {false && speakingAnalysis.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Speaking Time Analysis</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Participant Speaking Patterns</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Participant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Speaking Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Turns
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        WPM
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Interruptions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Engagement
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {speakingAnalysis.map((analysis, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {analysis.participantName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {Math.round(analysis.totalSeconds / 60)}m {analysis.totalSeconds % 60}s
                          <span className="text-gray-500 ml-1">({analysis.percentage.toFixed(1)}%)</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {analysis.turnsCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {Math.round(analysis.wordsPerMinute)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {analysis.interruptionCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            analysis.engagementLevel === 'high' ? 'text-green-600 bg-green-100' :
                            analysis.engagementLevel === 'medium' ? 'text-yellow-600 bg-yellow-100' :
                            'text-red-600 bg-red-100'
                          }`}>
                            {analysis.engagementLevel}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Bias Detection Results */}
        {biasDetections.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Bias Detection</h2>
            <div className="space-y-4">
              {biasDetections.map((bias, index) => (
                <div key={index} className={`bg-white rounded-lg shadow p-6 border-l-4 ${
                  bias.severity > 0.7 ? 'border-red-500' :
                  bias.severity > 0.4 ? 'border-yellow-500' : 'border-blue-500'
                }`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 capitalize">
                        {bias.type} Bias - {bias.category}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Severity: {(bias.severity * 100).toFixed(0)}% | 
                        Confidence: {(bias.confidence * 100).toFixed(0)}% |
                        Method: {bias.detectionMethod}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-900 mb-2">{bias.contextText}</p>
                  {bias.evidenceText && (
                    <blockquote className="border-l-2 border-gray-300 pl-4 italic text-gray-700">
                      {bias.evidenceText}
                    </blockquote>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Facilitator Tools */}
        <div className="mb-8">
          {/* View Mode Selector */}
          <div className="mb-6">
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1 max-w-md">
              {[
                { key: 'facilitator', label: 'Facilitator View', icon: Users },
                { key: 'participant', label: 'Participant View', icon: MessageCircle },
                { key: 'analyst', label: 'Research View', icon: BarChart3 }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setViewMode(key as any)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    viewMode === key
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Facilitator View */}
          {viewMode === 'facilitator' && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">Facilitator Tools</h3>
                <p className="text-gray-600 mb-4">
                  Real-time coaching and post-conversation insights for World Café facilitators.
                </p>
                <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-sm text-blue-800">
                    Coming soon: Real-time nudges during conversations, post-session insights, 
                    and a curated library of facilitation patterns from successful World Café sessions.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Participant View */}
          {viewMode === 'participant' && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center py-12">
                <MessageCircle className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">Participant Insights</h3>
                <p className="text-gray-600 mb-4">
                  See your personal conversation patterns and growth over time.
                </p>
                <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-sm text-blue-800">
                    Coming soon: Personal conversation insights, relationship mapping, 
                    and growth tracking designed just for conversation participants.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Research/Analyst View */}
          {viewMode === 'analyst' && (speakingAnalysis.length > 0 || biasDetections.length > 0) && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">Research Data View</h3>
                <p className="text-yellow-800 text-sm">
                  This statistical analysis is designed for research purposes. 
                  For facilitator insights, switch to "Facilitator View" above.
                </p>
              </div>
              <SessionAnalysisCharts 
                speakingAnalysis={speakingAnalysis}
                biasDetections={biasDetections}
              />
            </div>
          )}
        </div>


        {/* Transcription Viewer */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Conversation Transcript</h2>
          <TranscriptionViewer sessionId={sessionId} />
        </div>

        {/* AI Analysis Engine */}
        <div className="mb-8">
          <AIAnalysisPanel
            sessionId={sessionId}
            transcription={transcriptionData}
            onAnalysisComplete={(results) => {
              console.log('Analysis completed:', results);
              setAnalyzing(false);
            }}
            onAnalysisStart={() => {
              setAnalyzing(true);
            }}
          />
        </div>
      </div>
      
      {/* Session-Specific Chat Widget */}
      <div data-chat-widget>
        <ChatWidget 
          defaultScope="session"
          sessionId={sessionId}
          className="z-50"
        />
      </div>
    </div>
  );
}

function SessionDetailsSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-gray-200 rounded mb-4" />
          <div className="h-6 w-96 bg-gray-200 rounded mb-8" />
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="h-16 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
          
          <div className="bg-white rounded-lg shadow p-12">
            <div className="h-32 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SessionError({ error }: { error: string | null }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow p-12 text-center max-w-md">
        <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-gray-900 mb-2">Session Not Found</h3>
        <p className="text-gray-600 mb-6">{error || 'The requested session could not be loaded.'}</p>
        <Link 
          href="/"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}