'use client';

import { useState } from 'react';
import { 
  BookOpen,
  Heart,
  Users,
  Zap,
  Target,
  ArrowRight,
  Star,
  Clock,
  MessageCircle,
  Lightbulb,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface ConversationPattern {
  id: string;
  title: string;
  category: 'opening' | 'deepening' | 'conflict' | 'synthesis' | 'closing';
  description: string;
  whenToUse: string;
  howToFacilitate: string[];
  examples: string[];
  commonPitfalls: string[];
  relatedPatterns: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  effectiveness: number; // 1-5 stars
  timeNeeded: string;
  groupSize: string;
}

interface PatternLibraryProps {
  currentPhase?: 'opening' | 'deepening' | 'conflict' | 'synthesis' | 'closing';
  onPatternSelect?: (pattern: ConversationPattern) => void;
}

export function PatternLibrary({ currentPhase, onPatternSelect }: PatternLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(currentPhase || 'all');
  const [selectedPattern, setSelectedPattern] = useState<ConversationPattern | null>(null);

  // Mock data - in real implementation, this would come from a curated database
  const patterns: ConversationPattern[] = [
    {
      id: '1',
      title: 'Building Safety First',
      category: 'opening',
      description: 'Establish psychological safety before diving into content',
      whenToUse: 'Start of any conversation, especially with new groups or sensitive topics',
      howToFacilitate: [
        'Begin with personal check-ins: "How are you arriving today?"',
        'Share the purpose and invite questions about process',
        'Establish simple agreements: "What do we need to have a good conversation?"',
        'Model vulnerability by sharing something appropriate about yourself'
      ],
      examples: [
        'Maya\'s group started with "One word for how you\'re feeling right now"',
        'Jordan used "Share something good from your week" to warm up the space',
        'Alex began with "What drew you to this topic?" to find shared motivation'
      ],
      commonPitfalls: [
        'Rushing into content without building connection',
        'Assuming everyone feels safe just because you said they should',
        'Making check-ins too long or too personal for the group'
      ],
      relatedPatterns: ['Safe Disagreement', 'Inclusive Invitation'],
      difficulty: 'beginner',
      effectiveness: 5,
      timeNeeded: '10-15 minutes',
      groupSize: 'Any size'
    },
    {
      id: '2',
      title: 'Productive Tension',
      category: 'conflict',
      description: 'Transform disagreement into creative exploration',
      whenToUse: 'When different viewpoints emerge or energy feels stuck',
      howToFacilitate: [
        'Name the tension: "I\'m sensing some different perspectives here"',
        'Slow down and explore: "Help me understand how you each see this"',
        'Look for the wisdom in each view: "What is each perspective trying to protect?"',
        'Find the paradox: "What if both of these could be true?"'
      ],
      examples: [
        'Sam\'s group used "Stand where you are on this spectrum" to visualize differences',
        'Pat facilitated "Each person share what they\'re most concerned about"',
        'Chris asked "What would need to be true for the other view to make sense?"'
      ],
      commonPitfalls: [
        'Avoiding tension instead of working with it',
        'Taking sides instead of holding the paradox',
        'Moving to solutions before understanding the different perspectives'
      ],
      relatedPatterns: ['Building Safety First', 'Finding Synthesis'],
      difficulty: 'advanced',
      effectiveness: 4,
      timeNeeded: '20-30 minutes',
      groupSize: '4-12 people'
    },
    {
      id: '3',
      title: 'Inclusive Invitation',
      category: 'deepening',
      description: 'Draw out quieter voices and diverse perspectives',
      whenToUse: 'When you notice some people haven\'t spoken or energy is dominated by a few',
      howToFacilitate: [
        'Name what you notice: "I\'d love to hear from folks who haven\'t spoken yet"',
        'Use structure: Round-robin, pair-shares, or written reflection first',
        'Ask open-ended questions: "What\'s stirring for you?" rather than "Do you agree?"',
        'Wait longer - count to 10 in your head before filling silence'
      ],
      examples: [
        'Riley used "Popcorn style - share one word that captures your thinking"',
        'Taylor tried "Turn to someone near you and share your reaction"',
        'Morgan asked "What haven\'t we heard yet that might be important?"'
      ],
      commonPitfalls: [
        'Putting people on the spot: "Sarah, what do you think?"',
        'Accepting "I don\'t have anything to add" without creating easier entry points',
        'Not noticing patterns of who speaks and who doesn\'t'
      ],
      relatedPatterns: ['Building Safety First', 'Harvesting Wisdom'],
      difficulty: 'intermediate',
      effectiveness: 5,
      timeNeeded: '5-15 minutes',
      groupSize: 'Works best with 6+ people'
    },
    {
      id: '4',
      title: 'Finding Synthesis',
      category: 'synthesis',
      description: 'Help the group discover connections and common ground',
      whenToUse: 'After exploring different perspectives, when it\'s time to find themes',
      howToFacilitate: [
        'Look for threads: "I\'m hearing some themes emerging..."',
        'Ask the group: "What connections are you noticing?"',
        'Use metaphor: "If this conversation were a painting, what colors would it have?"',
        'Test understanding: "Let me try to weave together what I\'m hearing..."'
      ],
      examples: [
        'Avery noticed "Three people mentioned trust - what does that mean to you all?"',
        'River asked "What would someone walking in now think we all care about?"',
        'Sage used "If we had to give this conversation a title, what would it be?"'
      ],
      commonPitfalls: [
        'Forcing consensus when diversity is more valuable',
        'Imposing your own synthesis instead of letting it emerge',
        'Rushing to closure without honoring complexity'
      ],
      relatedPatterns: ['Productive Tension', 'Harvesting Wisdom'],
      difficulty: 'intermediate',
      effectiveness: 4,
      timeNeeded: '15-25 minutes',
      groupSize: 'Any size'
    },
    {
      id: '5',
      title: 'Harvesting Wisdom',
      category: 'closing',
      description: 'Help people name and take away key insights',
      whenToUse: 'Near the end of conversations to capture learning',
      howToFacilitate: [
        'Personal harvest: "What\'s one thing you\'re taking away?"',
        'Collective harvest: "What did we learn together that none of us knew before?"',
        'Future-oriented: "What wants to happen next based on this conversation?"',
        'Appreciation: "What did you appreciate about how we talked together?"'
      ],
      examples: [
        'Quinn asked "Complete this sentence: Because of this conversation, I..."',
        'Rowan used "What surprised you today?" to capture unexpected insights',
        'Skylar tried "What will you think about differently this week?"'
      ],
      commonPitfalls: [
        'Skipping harvest because you\'re running out of time',
        'Making it too long or formal when energy is winding down',
        'Focusing only on content and missing process insights'
      ],
      relatedPatterns: ['Finding Synthesis', 'Building Safety First'],
      difficulty: 'beginner',
      effectiveness: 5,
      timeNeeded: '10-20 minutes',
      groupSize: 'Any size'
    }
  ];

  const categories = [
    { key: 'all', label: 'All Patterns', icon: BookOpen, color: 'text-gray-600' },
    { key: 'opening', label: 'Opening', icon: Heart, color: 'text-green-600' },
    { key: 'deepening', label: 'Deepening', icon: Users, color: 'text-blue-600' },
    { key: 'conflict', label: 'Working with Tension', icon: Zap, color: 'text-orange-600' },
    { key: 'synthesis', label: 'Finding Synthesis', icon: Target, color: 'text-purple-600' },
    { key: 'closing', label: 'Closing', icon: CheckCircle, color: 'text-pink-600' }
  ];

  const filteredPatterns = selectedCategory === 'all' 
    ? patterns 
    : patterns.filter(p => p.category === selectedCategory);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-100';
      case 'intermediate': return 'text-blue-600 bg-blue-100';
      case 'advanced': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <BookOpen className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Conversation Pattern Library</h2>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Proven patterns from successful World Café conversations
        </p>
      </div>

      <div className="p-6">
        {/* Category Navigation */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map(({ key, label, icon: Icon, color }) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === key
                  ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-200'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className={`h-4 w-4 ${selectedCategory === key ? 'text-blue-600' : color}`} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Pattern Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
          {filteredPatterns.map((pattern) => (
            <div
              key={pattern.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                selectedPattern?.id === pattern.id ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
              }`}
              onClick={() => setSelectedPattern(selectedPattern?.id === pattern.id ? null : pattern)}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{pattern.title}</h3>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getDifficultyColor(pattern.difficulty)}`}>
                    {pattern.difficulty}
                  </span>
                  <div className="flex">
                    {renderStars(pattern.effectiveness)}
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-3">{pattern.description}</p>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{pattern.timeNeeded}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-3 w-3" />
                    <span>{pattern.groupSize}</span>
                  </div>
                </div>
                <ArrowRight className={`h-4 w-4 transform transition-transform ${
                  selectedPattern?.id === pattern.id ? 'rotate-90' : ''
                }`} />
              </div>

              {/* Expanded Details */}
              {selectedPattern?.id === pattern.id && (
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                  {/* When to Use */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center space-x-1">
                      <Target className="h-4 w-4 text-green-600" />
                      <span>When to Use</span>
                    </h4>
                    <p className="text-sm text-gray-700">{pattern.whenToUse}</p>
                  </div>

                  {/* How to Facilitate */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center space-x-1">
                      <Lightbulb className="h-4 w-4 text-blue-600" />
                      <span>How to Facilitate</span>
                    </h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {pattern.howToFacilitate.map((step, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-blue-500 font-bold mt-0.5">•</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Examples */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center space-x-1">
                      <MessageCircle className="h-4 w-4 text-purple-600" />
                      <span>Real Examples</span>
                    </h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {pattern.examples.map((example, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-purple-500 mt-0.5">→</span>
                          <span>{example}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Common Pitfalls */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center space-x-1">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span>Watch Out For</span>
                    </h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {pattern.commonPitfalls.map((pitfall, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-red-500 font-bold mt-0.5">!</span>
                          <span>{pitfall}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Button */}
                  {onPatternSelect && (
                    <div className="pt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPatternSelect(pattern);
                        }}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Try This Pattern
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredPatterns.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No patterns found for this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}