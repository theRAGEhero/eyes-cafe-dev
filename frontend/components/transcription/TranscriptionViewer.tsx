'use client';

import { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  AlertTriangle, 
  Info,
  Clock,
  User,
  Eye,
  EyeOff,
  Filter,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface BiasFlag {
  type: string;
  category: string;
  severity: number;
  confidence: number;
  reason: string;
  evidenceMatch: boolean;
}

interface SpeakerSegment {
  speaker: number;
  transcript: string;
  start: number;
  end: number;
  confidence: number;
  biasFlags: BiasFlag[];
}

interface Transcription {
  id: string;
  table_id: number;
  transcript_text: string;
  speaker_segments: SpeakerSegment[];
  word_count: number;
  confidence_score: number;
  created_at: string;
}

interface TranscriptionData {
  sessionId: string;
  transcriptionCount: number;
  totalSegments: number;
  biasDetectionCount: number;
  transcriptions: Transcription[];
  biasDetections: any[];
}

interface TranscriptionViewerProps {
  sessionId: string;
}

export function TranscriptionViewer({ sessionId }: TranscriptionViewerProps) {
  const [data, setData] = useState<TranscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    showBiasOnly: false,
    severityThreshold: 0,
    searchText: ''
  });
  const [expandedSegment, setExpandedSegment] = useState<string | null>(null);

  useEffect(() => {
    fetchTranscriptions();
  }, [sessionId]);

  const fetchTranscriptions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3002/api/sessions/${sessionId}/transcriptions`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error?.message || 'Failed to load transcriptions');
      }
    } catch (err) {
      setError('Failed to connect to backend');
      console.error('Transcription fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSeverityColor = (severity: number): string => {
    if (severity > 0.7) return 'text-red-600 bg-red-100';
    if (severity > 0.4) return 'text-orange-600 bg-orange-100';
    return 'text-yellow-600 bg-yellow-100';
  };

  const getBiasTypeColor = (type: string): string => {
    switch (type) {
      case 'language': return 'text-purple-600 bg-purple-100';
      case 'participation': return 'text-blue-600 bg-blue-100';
      case 'topic': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const highlightBiasPatterns = (text: string, biasFlags: BiasFlag[]): React.ReactNode => {
    if (biasFlags.length === 0) return text;

    // Common dismissive patterns that we highlight
    const dismissivePatterns = [
      /\b(but|however|actually|well actually)\b/gi,
      /\b(i disagree|that's wrong|doesn't make sense)\b/gi,
      /\b(you don't understand|obviously|clearly)\b/gi,
      /\b(let me explain|as i said)\b/gi
    ];

    let highlightedText = text;
    let segments: Array<{text: string; highlighted: boolean; biasType?: string}> = [{text, highlighted: false}];

    // Apply highlighting for dismissive patterns
    dismissivePatterns.forEach(pattern => {
      segments = segments.flatMap(segment => {
        if (segment.highlighted) return [segment];
        
        const parts = segment.text.split(pattern);
        if (parts.length === 1) return [segment];
        
        const result = [];
        for (let i = 0; i < parts.length; i++) {
          if (i > 0) {
            // Find the matched text
            const match = segment.text.match(pattern);
            if (match) {
              result.push({
                text: match[0],
                highlighted: true,
                biasType: 'dismissive'
              });
            }
          }
          if (parts[i]) {
            result.push({text: parts[i], highlighted: false});
          }
        }
        return result;
      });
    });

    return (
      <>
        {segments.map((segment, index) => 
          segment.highlighted ? (
            <span
              key={index}
              className="px-1 py-0.5 rounded text-red-800 bg-red-200 font-medium"
              title={`Potential ${segment.biasType} language detected`}
            >
              {segment.text}
            </span>
          ) : (
            <span key={index}>{segment.text}</span>
          )
        )}
      </>
    );
  };

  const filteredSegments = data ? 
    data.transcriptions.flatMap(t => 
      t.speaker_segments.map(segment => ({
        ...segment,
        tableId: t.table_id,
        segmentId: `${t.id}-${segment.speaker}-${segment.start}`
      }))
    ).filter(segment => {
      if (filters.showBiasOnly && segment.biasFlags.length === 0) return false;
      if (segment.biasFlags.some(flag => flag.severity < filters.severityThreshold)) return false;
      if (filters.searchText && !segment.transcript.toLowerCase().includes(filters.searchText.toLowerCase())) return false;
      return true;
    }).sort((a, b) => a.start - b.start)
    : [];

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="animate-pulse">
          <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Transcription Error</h3>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Session Transcription</h3>
            <p className="text-sm text-gray-500">
              {data.totalSegments} speaking segments • {data.biasDetectionCount} potential issues detected
            </p>
          </div>
          <div className="text-sm text-gray-500">
            {filteredSegments.length} segments shown
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.showBiasOnly}
                onChange={(e) => setFilters(prev => ({...prev, showBiasOnly: e.target.checked}))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Show bias issues only</span>
            </label>
          </div>
          
          <div className="flex items-center">
            <label className="text-sm text-gray-700 mr-2">Min severity:</label>
            <select
              value={filters.severityThreshold}
              onChange={(e) => setFilters(prev => ({...prev, severityThreshold: Number(e.target.value)}))}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value={0}>All levels</option>
              <option value={0.3}>Medium+</option>
              <option value={0.7}>High only</option>
            </select>
          </div>
          
          <div className="flex items-center flex-1 max-w-xs">
            <div className="relative w-full">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search in text..."
                value={filters.searchText}
                onChange={(e) => setFilters(prev => ({...prev, searchText: e.target.value}))}
                className="w-full pl-10 pr-3 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Transcription Timeline */}
      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {filteredSegments.map((segment) => (
          <div key={segment.segmentId} className={`px-6 py-4 hover:bg-gray-50 ${segment.biasFlags.length > 0 ? 'border-l-4 border-l-orange-400' : ''}`}>
            {/* Speaker Info */}
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">
                    Speaker {segment.speaker} 
                  </span>
                  <span className="text-xs text-gray-500">
                    (Table {segment.tableId})
                  </span>
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatTime(segment.start)} - {formatTime(segment.end)}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {segment.biasFlags.length > 0 && (
                  <button
                    onClick={() => setExpandedSegment(
                      expandedSegment === segment.segmentId ? null : segment.segmentId
                    )}
                    className="text-orange-600 hover:text-orange-800"
                  >
                    {expandedSegment === segment.segmentId ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Transcript Text */}
            <div className="mb-2">
              <p className="text-gray-900 leading-relaxed">
                {highlightBiasPatterns(segment.transcript, segment.biasFlags)}
              </p>
            </div>

            {/* Bias Flags */}
            {segment.biasFlags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {segment.biasFlags.map((flag, index) => (
                  <span
                    key={index}
                    className={`px-2 py-1 text-xs rounded-full ${getBiasTypeColor(flag.type)}`}
                  >
                    {flag.type} • {flag.category} ({Math.round(flag.severity * 100)}%)
                  </span>
                ))}
              </div>
            )}

            {/* Expanded Analysis */}
            {expandedSegment === segment.segmentId && segment.biasFlags.length > 0 && (
              <div className="mt-4 p-4 bg-orange-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Analysis Details:</h4>
                {segment.biasFlags.map((flag, index) => (
                  <div key={index} className="mb-3 last:mb-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {flag.type} - {flag.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        {Math.round(flag.confidence * 100)}% confidence
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{flag.reason}</p>
                    <div className={`mt-1 h-1 rounded-full ${getSeverityColor(flag.severity).replace('text-', 'bg-').replace('bg-', 'bg-').split(' ')[1]}`} style={{width: `${flag.severity * 100}%`}}></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        
        {filteredSegments.length === 0 && (
          <div className="px-6 py-12 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No segments found</h3>
            <p className="text-gray-500">
              {filters.showBiasOnly || filters.searchText ? 
                'Try adjusting your filters to see more content.' :
                'No transcription data available for this session.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}