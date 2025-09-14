'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  MessageSquare, 
  Heart, 
  TrendingUp, 
  Clock,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  Volume2,
  VolumeX,
  Activity,
  Zap
} from 'lucide-react';

interface ConversationEnergy {
  level: 'low' | 'medium' | 'high';
  trend: 'rising' | 'stable' | 'falling';
  lastUpdate: string;
}

interface ParticipationPattern {
  activeVoices: number;
  quietVoices: number;
  recentContributors: string[];
  longestQuietPeriod: number;
}

interface GroupDynamics {
  psychologicalSafety: number; // 0-100
  inclusionLevel: number; // 0-100
  energyFlow: ConversationEnergy;
  participationBalance: ParticipationPattern;
  conversationPhase: 'warming_up' | 'exploring' | 'deepening' | 'synthesizing' | 'closing';
}

interface FacilitatorNudge {
  id: string;
  type: 'inclusion' | 'energy' | 'time' | 'safety' | 'synthesis';
  urgency: 'low' | 'medium' | 'high';
  message: string;
  suggestion: string;
  timing: 'now' | 'soon' | 'next_break';
}

interface FacilitatorDashboardProps {
  sessionId: string;
  isActive: boolean;
  onNudgeAction: (nudgeId: string, action: string) => void;
}

export function FacilitatorDashboard({ 
  sessionId, 
  isActive, 
  onNudgeAction 
}: FacilitatorDashboardProps) {
  const [dynamics, setDynamics] = useState<GroupDynamics>({
    psychologicalSafety: 75,
    inclusionLevel: 68,
    energyFlow: {
      level: 'medium',
      trend: 'stable',
      lastUpdate: new Date().toISOString()
    },
    participationBalance: {
      activeVoices: 6,
      quietVoices: 4,
      recentContributors: ['Speaker 2', 'Speaker 5', 'Speaker 1'],
      longestQuietPeriod: 4.5
    },
    conversationPhase: 'exploring'
  });

  const [nudges, setNudges] = useState<FacilitatorNudge[]>([
    {
      id: '1',
      type: 'inclusion',
      urgency: 'medium',
      message: '4 people haven\'t spoken in 5+ minutes',
      suggestion: 'Consider a round-robin or ask: "What\'s one thing that resonates for you so far?"',
      timing: 'soon'
    },
    {
      id: '2', 
      type: 'energy',
      urgency: 'low',
      message: 'Energy feels focused but could use some levity',
      suggestion: 'This might be a good moment for a brief check-in or movement break',
      timing: 'next_break'
    }
  ]);

  const [showDetails, setShowDetails] = useState(false);

  // Real-time updates simulation
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      // Simulate real-time updates
      setDynamics(prev => ({
        ...prev,
        psychologicalSafety: Math.max(0, Math.min(100, 
          prev.psychologicalSafety + (Math.random() - 0.5) * 5
        )),
        participationBalance: {
          ...prev.participationBalance,
          longestQuietPeriod: prev.participationBalance.longestQuietPeriod + 0.5
        }
      }));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [isActive]);

  const getEnergyColor = (level: string, trend: string) => {
    if (level === 'high') return trend === 'falling' ? 'text-orange-600' : 'text-green-600';
    if (level === 'medium') return 'text-blue-600';
    return trend === 'rising' ? 'text-yellow-600' : 'text-red-600';
  };

  const getPhaseDescription = (phase: string) => {
    const phases = {
      'warming_up': 'People are getting comfortable and finding their voice',
      'exploring': 'Ideas are flowing and different perspectives emerging', 
      'deepening': 'The group is building on ideas and going deeper',
      'synthesizing': 'Themes are emerging and connections being made',
      'closing': 'Time to harvest insights and plan next steps'
    };
    return phases[phase as keyof typeof phases] || '';
  };

  const getPriorityNudges = () => {
    return nudges.filter(nudge => nudge.urgency === 'high' || nudge.timing === 'now');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Facilitator Companion
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400' : 'bg-gray-400'}`} />
          <span className="text-sm text-gray-600">
            {isActive ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Current State Overview */}
      <div className="space-y-4 mb-6">
        {/* Conversation Phase */}
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <Activity className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              Phase: {dynamics.conversationPhase.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-blue-700">
            {getPhaseDescription(dynamics.conversationPhase)}
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <Heart className={`h-4 w-4 ${
                dynamics.psychologicalSafety > 70 ? 'text-green-600' : 
                dynamics.psychologicalSafety > 50 ? 'text-yellow-600' : 'text-red-600'
              }`} />
              <span className="text-sm font-medium text-gray-900">Safety</span>
            </div>
            <div className="text-xl font-bold text-gray-800">
              {Math.round(dynamics.psychologicalSafety)}%
            </div>
            <div className="text-xs text-gray-600">
              Group feels safe to share
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <MessageSquare className={`h-4 w-4 ${getEnergyColor(dynamics.energyFlow.level, dynamics.energyFlow.trend)}`} />
              <span className="text-sm font-medium text-gray-900">Energy</span>
            </div>
            <div className="text-xl font-bold text-gray-800 capitalize">
              {dynamics.energyFlow.level}
            </div>
            <div className="text-xs text-gray-600 capitalize">
              {dynamics.energyFlow.trend}
            </div>
          </div>
        </div>

        {/* Participation Balance */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Volume2 className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-900">Voices</span>
            </div>
            <span className="text-xs text-gray-600">
              {dynamics.participationBalance.activeVoices} active, {dynamics.participationBalance.quietVoices} quiet
            </span>
          </div>
          
          {dynamics.participationBalance.longestQuietPeriod > 5 && (
            <div className="flex items-center space-x-1 text-xs text-orange-600">
              <VolumeX className="h-3 w-3" />
              <span>{dynamics.participationBalance.longestQuietPeriod}min since some voices heard</span>
            </div>
          )}
        </div>
      </div>

      {/* Priority Nudges */}
      {getPriorityNudges().length > 0 && (
        <div className="space-y-3 mb-4">
          <div className="flex items-center space-x-2">
            <Lightbulb className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-semibold text-gray-900">Gentle Nudges</span>
          </div>
          
          {getPriorityNudges().map((nudge) => (
            <div key={nudge.id} className={`rounded-lg p-3 border-l-4 ${
              nudge.urgency === 'high' ? 'bg-red-50 border-red-400' :
              nudge.urgency === 'medium' ? 'bg-orange-50 border-orange-400' :
              'bg-yellow-50 border-yellow-400'
            }`}>
              <div className="flex items-start space-x-2">
                <AlertCircle className={`h-4 w-4 mt-0.5 ${
                  nudge.urgency === 'high' ? 'text-red-600' :
                  nudge.urgency === 'medium' ? 'text-orange-600' :
                  'text-yellow-600'
                }`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    {nudge.message}
                  </p>
                  <p className="text-xs text-gray-700 mb-2">
                    {nudge.suggestion}
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onNudgeAction(nudge.id, 'dismiss')}
                      className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                      Not now
                    </button>
                    <button
                      onClick={() => onNudgeAction(nudge.id, 'acted')}
                      className="text-xs px-2 py-1 bg-green-200 text-green-700 rounded hover:bg-green-300 flex items-center space-x-1"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Acted on it</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* All Nudges Toggle */}
      {nudges.length > getPriorityNudges().length && (
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full text-sm text-blue-600 hover:text-blue-800 py-2 border-t"
        >
          {showDetails ? 'Hide' : 'Show all'} suggestions ({nudges.length - getPriorityNudges().length} more)
        </button>
      )}

      {/* Additional Nudges */}
      {showDetails && (
        <div className="space-y-2 pt-2">
          {nudges.filter(nudge => !getPriorityNudges().includes(nudge)).map((nudge) => (
            <div key={nudge.id} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <Lightbulb className="h-4 w-4 mt-0.5 text-gray-600" />
                <div className="flex-1">
                  <p className="text-sm text-gray-800 mb-1">
                    {nudge.message}
                  </p>
                  <p className="text-xs text-gray-600">
                    {nudge.suggestion}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}