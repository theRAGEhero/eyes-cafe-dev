'use client';

import { useState } from 'react';
import { 
  Heart,
  TrendingUp, 
  Users,
  MessageCircle,
  Star,
  ArrowRight,
  Sparkles,
  Target,
  Clock,
  Zap
} from 'lucide-react';

interface ConversationHighlight {
  id: string;
  type: 'breakthrough' | 'connection' | 'insight' | 'inclusion' | 'synthesis';
  timestamp: string;
  description: string;
  impact: string;
  speakers: string[];
}

interface ConversationPattern {
  id: string;
  name: string;
  description: string;
  strength: 'emerging' | 'developing' | 'strong';
  examples: string[];
  supportiveActions: string[];
}

interface PostConversationInsightsProps {
  sessionId: string;
  conversationDuration: number; // in minutes
  participantCount: number;
}

export function ConversationInsights({ 
  sessionId, 
  conversationDuration, 
  participantCount 
}: PostConversationInsightsProps) {
  const [activeTab, setActiveTab] = useState<'highlights' | 'patterns' | 'growth'>('highlights');

  // Mock data - in real implementation, this would come from analysis
  const highlights: ConversationHighlight[] = [
    {
      id: '1',
      type: 'breakthrough',
      timestamp: '12:34',
      description: 'Group discovered shared concern about accessibility',
      impact: 'Shifted conversation from individual solutions to systemic thinking',
      speakers: ['Maya', 'Jordan', 'Alex']
    },
    {
      id: '2', 
      type: 'inclusion',
      timestamp: '23:45',
      description: 'Quiet member Sam shared pivotal perspective',
      impact: 'Brought lived experience that reframed the entire discussion',
      speakers: ['Sam']
    },
    {
      id: '3',
      type: 'synthesis',
      timestamp: '41:12',
      description: 'Group naturally synthesized three different viewpoints',
      impact: 'Found common ground that honors different approaches',
      speakers: ['Maya', 'Jordan', 'Chris', 'Pat']
    }
  ];

  const patterns: ConversationPattern[] = [
    {
      id: '1',
      name: 'Building on Ideas',
      description: 'People frequently used "Yes, and..." to expand on each other\'s contributions',
      strength: 'strong',
      examples: [
        'Jordan built on Maya\'s accessibility point by adding mobility considerations',
        'Alex connected Sam\'s experience to broader policy implications'
      ],
      supportiveActions: [
        'Continue explicitly acknowledging contributions before adding',
        'Notice when someone builds bridges between ideas'
      ]
    },
    {
      id: '2',
      name: 'Safe Disagreement',
      description: 'Group navigated different viewpoints without defensive reactions',
      strength: 'developing',
      examples: [
        'Pat expressed different view while validating Chris\'s concern',
        'Group paused to understand rather than debate when tension arose'
      ],
      supportiveActions: [
        'Keep normalizing "I see it differently and here\'s why..."',
        'Continue pausing when you sense tension building'
      ]
    },
    {
      id: '3',
      name: 'Inclusive Invitation',
      description: 'Members naturally invited quieter voices to contribute',
      strength: 'emerging',
      examples: [
        'Maya directly asked Sam for their perspective',
        'Jordan noticed Chris hadn\'t spoken and created space'
      ],
      supportiveActions: [
        'Celebrate when group members facilitate each other',
        'Model asking "What haven\'t we heard yet?"'
      ]
    }
  ];

  const getHighlightIcon = (type: string) => {
    switch (type) {
      case 'breakthrough': return <Sparkles className="h-4 w-4 text-purple-600" />;
      case 'connection': return <Heart className="h-4 w-4 text-pink-600" />;
      case 'insight': return <Zap className="h-4 w-4 text-yellow-600" />;
      case 'inclusion': return <Users className="h-4 w-4 text-green-600" />;
      case 'synthesis': return <Target className="h-4 w-4 text-blue-600" />;
      default: return <Star className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'strong': return 'text-green-600 bg-green-100';
      case 'developing': return 'text-blue-600 bg-blue-100';
      case 'emerging': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <MessageCircle className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Conversation Insights</h2>
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>{conversationDuration} minutes</span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span>{participantCount} participants</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
        {[
          { key: 'highlights', label: 'Highlights', icon: Star },
          { key: 'patterns', label: 'Patterns', icon: TrendingUp },
          { key: 'growth', label: 'Growth', icon: Target }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === 'highlights' && (
          <div className="space-y-4">
            <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-400">
              <h3 className="font-semibold text-green-900 mb-2">
                What Worked Really Well
              </h3>
              <p className="text-green-800 text-sm">
                This conversation showed strong collaborative patterns. People built on each other's ideas,
                made space for different perspectives, and found creative syntheses.
              </p>
            </div>

            {highlights.map((highlight) => (
              <div key={highlight.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="mt-1">
                    {getHighlightIcon(highlight.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                        {highlight.type}
                      </span>
                      <span className="text-xs text-gray-500">
                        {highlight.timestamp}
                      </span>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">
                      {highlight.description}
                    </h4>
                    <p className="text-sm text-gray-700 mb-2">
                      {highlight.impact}
                    </p>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-600">Involved:</span>
                      {highlight.speakers.map((speaker, index) => (
                        <span key={index} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {speaker}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'patterns' && (
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
              <h3 className="font-semibold text-blue-900 mb-2">
                Conversation Patterns That Emerged
              </h3>
              <p className="text-blue-800 text-sm">
                These are the group dynamics and communication patterns that supported good dialogue.
                You can build on these strengths in future conversations.
              </p>
            </div>

            {patterns.map((pattern) => (
              <div key={pattern.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">
                    {pattern.name}
                  </h4>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStrengthColor(pattern.strength)}`}>
                    {pattern.strength}
                  </span>
                </div>
                
                <p className="text-sm text-gray-700 mb-3">
                  {pattern.description}
                </p>

                <div className="space-y-3">
                  <div>
                    <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                      Examples from your conversation
                    </h5>
                    <ul className="space-y-1">
                      {pattern.examples.map((example, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start space-x-2">
                          <ArrowRight className="h-3 w-3 mt-1 text-gray-400 flex-shrink-0" />
                          <span>{example}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                      How to strengthen this pattern
                    </h5>
                    <ul className="space-y-1">
                      {pattern.supportiveActions.map((action, index) => (
                        <li key={index} className="text-sm text-blue-700 flex items-start space-x-2">
                          <Target className="h-3 w-3 mt-1 text-blue-500 flex-shrink-0" />
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'growth' && (
          <div className="space-y-4">
            <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-400">
              <h3 className="font-semibold text-purple-900 mb-2">
                Growth Opportunities
              </h3>
              <p className="text-purple-800 text-sm">
                Areas where this group could continue developing their conversation capacity.
                These aren't problems to fix, but edges to explore.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">
                Deeper Listening Practice
              </h4>
              <p className="text-sm text-gray-700 mb-3">
                While the group built on ideas well, there were moments where responses seemed
                prepared while others were still speaking.
              </p>
              <div className="bg-white rounded p-3">
                <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                  Try this next time
                </h5>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Start with 30 seconds of silence after someone speaks</li>
                  <li>• Practice reflecting back what you heard before responding</li>
                  <li>• Notice the urge to respond and pause with it</li>
                </ul>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">
                Conflict as Creativity
              </h4>
              <p className="text-sm text-gray-700 mb-3">
                The group handled differences respectfully but may have avoided productive tension
                that could lead to breakthrough insights.
              </p>
              <div className="bg-white rounded p-3">
                <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                  Try this next time
                </h5>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• When you sense disagreement, slow down and explore it</li>
                  <li>• Ask "What if we're both right?" or "What are we each seeing?"</li>
                  <li>• Celebrate moments when tension leads to new understanding</li>
                </ul>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">
                Overall Group Development
              </h4>
              <p className="text-sm text-green-800">
                This group is developing strong collaborative capacity. You're ready to try more
                complex dialogue formats and tackle harder topics together.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action Items */}
      <div className="mt-6 pt-4 border-t">
        <h3 className="font-semibold text-gray-900 mb-3">For Your Next Conversation</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-blue-50 rounded-lg p-3">
            <h4 className="text-sm font-semibold text-blue-900 mb-1">Keep Doing</h4>
            <p className="text-xs text-blue-700">
              Building on ideas, making space for quiet voices, finding synthesis
            </p>
          </div>
          <div className="bg-orange-50 rounded-lg p-3">
            <h4 className="text-sm font-semibold text-orange-900 mb-1">Try Next</h4>
            <p className="text-xs text-orange-700">
              Pause for deeper listening, explore disagreements more fully
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}