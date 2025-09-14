'use client';

import { useState, useEffect } from 'react';
import { 
  Lightbulb,
  TrendingUp,
  Users,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Filter,
  Search,
  RefreshCw,
  Loader2,
  Brain,
  Target,
  Zap
} from 'lucide-react';
import { ConversationInsights } from '@/components/facilitator/ConversationInsights';
import { cn } from '@/lib/utils';

interface Insight {
  id: string;
  sessionId: string;
  sessionTitle: string;
  type: 'pattern' | 'bias' | 'engagement' | 'polarization';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  createdAt: string;
  evidence: string[];
  actionItems: string[];
}

interface InsightsSummary {
  totalInsights: number;
  newInsights: number;
  criticalInsights: number;
  resolvedInsights: number;
  avgConfidence: number;
}

const insightTypeConfig = {
  pattern: {
    icon: TrendingUp,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    label: 'Pattern'
  },
  bias: {
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    label: 'Bias'
  },
  engagement: {
    icon: Users,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    label: 'Engagement'
  },
  polarization: {
    icon: Target,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    label: 'Polarization'
  }
};

const severityConfig = {
  low: { color: 'text-green-600', bgColor: 'bg-green-100', label: 'Low' },
  medium: { color: 'text-yellow-600', bgColor: 'bg-yellow-100', label: 'Medium' },
  high: { color: 'text-orange-600', bgColor: 'bg-orange-100', label: 'High' },
  critical: { color: 'text-red-600', bgColor: 'bg-red-100', label: 'Critical' }
};

export function InsightsDashboard() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [summary, setSummary] = useState<InsightsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  const fetchInsights = async () => {
    try {
      setError(null);
      // Mock data for now - in real implementation this would fetch from API
      const mockInsights: Insight[] = [
        {
          id: '1',
          sessionId: 'session-1',
          sessionTitle: 'Innovation in Healthcare',
          type: 'bias',
          title: 'Gender bias detected in speaking patterns',
          description: 'Male participants spoke 70% more than female participants on average',
          severity: 'high',
          confidence: 85,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          evidence: [
            'Male participants had average speaking time of 4.2 minutes',
            'Female participants had average speaking time of 2.5 minutes',
            'Male participants interrupted 3x more frequently'
          ],
          actionItems: [
            'Implement structured turn-taking',
            'Use talking stick or similar tool',
            'Brief facilitators on inclusive practices'
          ]
        },
        {
          id: '2',
          sessionId: 'session-2',
          sessionTitle: 'Sustainable Development',
          type: 'pattern',
          title: 'Strong convergence around climate action',
          description: 'High agreement on the urgency of environmental measures',
          severity: 'low',
          confidence: 92,
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          evidence: [
            '89% of statements aligned with environmental urgency',
            'Low polarization index (23/100)',
            'Consistent messaging across all tables'
          ],
          actionItems: [
            'Document consensus points',
            'Develop action plan based on agreement',
            'Identify next steps for implementation'
          ]
        },
        {
          id: '3',
          sessionId: 'session-1',
          sessionTitle: 'Innovation in Healthcare',
          type: 'engagement',
          title: 'Low participation from Table 3',
          description: 'Participants at Table 3 had significantly lower engagement',
          severity: 'medium',
          confidence: 78,
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          evidence: [
            'Table 3 had 40% less speaking time than average',
            'Fewer questions asked by this table',
            'Lower energy levels observed'
          ],
          actionItems: [
            'Check table composition for dynamics issues',
            'Consider facilitator intervention',
            'Rotate participants in next round'
          ]
        }
      ];

      const mockSummary: InsightsSummary = {
        totalInsights: mockInsights.length,
        newInsights: mockInsights.filter(i => 
          new Date(i.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        ).length,
        criticalInsights: mockInsights.filter(i => i.severity === 'critical').length,
        resolvedInsights: 12, // Mock resolved count
        avgConfidence: Math.round(mockInsights.reduce((sum, i) => sum + i.confidence, 0) / mockInsights.length)
      };

      setInsights(mockInsights);
      setSummary(mockSummary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load insights');
      console.error('Error fetching insights:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshInsights = async () => {
    setRefreshing(true);
    await fetchInsights();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const filteredInsights = insights.filter(insight => {
    const matchesSearch = insight.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         insight.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         insight.sessionTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || insight.type === typeFilter;
    const matchesSeverity = severityFilter === 'all' || insight.severity === severityFilter;
    return matchesSearch && matchesType && matchesSeverity;
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-eyes-cafe-500" />
          <span className="ml-2 text-gray-600">Loading insights...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
          <button
            onClick={fetchInsights}
            className="mt-2 text-red-600 hover:text-red-500 text-sm underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Insights</h1>
          <p className="text-gray-600">Deep conversation insights and patterns from your sessions</p>
        </div>
        <button
          onClick={refreshInsights}
          disabled={refreshing}
          className="flex items-center px-4 py-2 bg-eyes-cafe-500 text-white rounded-lg hover:bg-eyes-cafe-600 disabled:opacity-50"
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Insights</p>
              <p className="text-2xl font-bold text-gray-900">{summary?.totalInsights || 0}</p>
            </div>
            <Lightbulb className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">New (24h)</p>
              <p className="text-2xl font-bold text-green-600">{summary?.newInsights || 0}</p>
            </div>
            <Zap className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Critical</p>
              <p className="text-2xl font-bold text-red-600">{summary?.criticalInsights || 0}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-blue-600">{summary?.resolvedInsights || 0}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Confidence</p>
              <p className="text-2xl font-bold text-purple-600">{summary?.avgConfidence || 0}%</p>
            </div>
            <Brain className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search insights..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-eyes-cafe-500"
              />
            </div>
          </div>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eyes-cafe-500"
          >
            <option value="all">All Types</option>
            <option value="bias">Bias</option>
            <option value="pattern">Pattern</option>
            <option value="engagement">Engagement</option>
            <option value="polarization">Polarization</option>
          </select>
          
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eyes-cafe-500"
          >
            <option value="all">All Severity</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Insights List */}
      <div className="space-y-4">
        {filteredInsights.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No insights found</h3>
            <p className="text-gray-600">
              {searchTerm || typeFilter !== 'all' || severityFilter !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Insights will appear here after analyzing your sessions'}
            </p>
          </div>
        ) : (
          filteredInsights.map((insight) => {
            const typeConfig = insightTypeConfig[insight.type];
            const severityInfo = severityConfig[insight.severity];
            const IconComponent = typeConfig.icon;

            return (
              <div key={insight.id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start">
                    <div className={cn("p-2 rounded-lg mr-3", typeConfig.bgColor)}>
                      <IconComponent className={cn("h-5 w-5", typeConfig.color)} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          severityInfo.color,
                          severityInfo.bgColor
                        )}>
                          {severityInfo.label}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2">{insight.description}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <span>{insight.sessionTitle}</span>
                        <span className="mx-2">•</span>
                        <span>{insight.confidence}% confidence</span>
                        <span className="mx-2">•</span>
                        <span>{new Date(insight.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <Eye className="h-4 w-4" />
                  </button>
                </div>

                {/* Evidence and Action Items */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Evidence</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {insight.evidence.map((item, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-gray-400 mr-2">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Recommended Actions</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {insight.actionItems.map((item, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Conversation Insights Component */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Real-time Conversation Analysis</h2>
        <ConversationInsights />
      </div>
    </div>
  );
}