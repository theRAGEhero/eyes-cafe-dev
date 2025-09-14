'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart3,
  TrendingUp,
  Users,
  MessageSquare,
  Clock,
  Target,
  AlertTriangle,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { DashboardCharts } from '@/components/charts/DashboardCharts';
import { cn } from '@/lib/utils';

interface AnalyticsMetrics {
  totalSessions: number;
  activeSessions: number;
  analysisInProgress: number;
  recentInsights: number;
  averagePolarization: number;
  averageBalance: number;
  criticalAlerts: number;
}

interface Session {
  id: string;
  worldCafeId: string;
  title: string;
  status: string;
  tableCount: number;
  participantCount?: number;
  alertLevel: string;
  hasNewInsights: boolean;
  lastAnalyzedAt?: string;
  polarizationIndex?: number;
}

interface TimeRange {
  label: string;
  value: string;
  days: number;
}

const timeRanges: TimeRange[] = [
  { label: 'Last 7 days', value: '7d', days: 7 },
  { label: 'Last 30 days', value: '30d', days: 30 },
  { label: 'Last 90 days', value: '90d', days: 90 },
  { label: 'All time', value: 'all', days: 365 },
];

export function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('30d');
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setError(null);
      // Fetch both metrics and sessions
      const [metricsRes, sessionsRes] = await Promise.all([
        fetch('http://localhost:3002/api/analysis/dashboard/metrics'),
        fetch('http://localhost:3002/api/sessions')
      ]);
      
      if (!metricsRes.ok) throw new Error('Failed to fetch analytics data');
      if (!sessionsRes.ok) throw new Error('Failed to fetch sessions data');
      
      const metricsData = await metricsRes.json();
      const sessionsData = await sessionsRes.json();
      
      setMetrics(metricsData.data);
      setSessions(sessionsData.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshAnalytics = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedTimeRange]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-eyes-cafe-500" />
          <span className="ml-2 text-gray-600">Loading analytics...</span>
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
            onClick={fetchAnalytics}
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
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Advanced insights and trends across your World Café sessions</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eyes-cafe-500"
          >
            {timeRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
          <button
            onClick={refreshAnalytics}
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
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{metrics?.totalSessions || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {selectedTimeRange === 'all' ? 'All time' : `Last ${timeRanges.find(r => r.value === selectedTimeRange)?.days} days`}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Sessions</p>
              <p className="text-2xl font-bold text-green-600">{metrics?.activeSessions || 0}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <MessageSquare className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-green-600 mt-2">Currently running</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Polarization</p>
              <p className="text-2xl font-bold text-orange-600">{metrics?.averagePolarization || 0}%</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Across all sessions</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Critical Alerts</p>
              <p className="text-2xl font-bold text-red-600">{metrics?.criticalAlerts || 0}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Require attention</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Trends & Patterns</h2>
          <div className="flex items-center gap-2">
            <button className="flex items-center px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50">
              <Filter className="h-4 w-4 mr-1" />
              Filter
            </button>
            <button className="flex items-center px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50">
              <Download className="h-4 w-4 mr-1" />
              Export
            </button>
          </div>
        </div>
        <DashboardCharts sessions={sessions} />
      </div>

      {/* Analysis Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Analysis</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Speaking Time Analysis</p>
                  <p className="text-sm text-gray-600">Completed for 12 sessions</p>
                </div>
              </div>
              <span className="text-sm text-green-600 font-medium">2 min ago</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg mr-3">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Bias Detection</p>
                  <p className="text-sm text-gray-600">Found 3 potential biases</p>
                </div>
              </div>
              <span className="text-sm text-gray-500 font-medium">5 min ago</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg mr-3">
                  <Users className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Participation Analysis</p>
                  <p className="text-sm text-gray-600">Balance score: 85/100</p>
                </div>
              </div>
              <span className="text-sm text-gray-500 font-medium">8 min ago</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full flex items-center px-4 py-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50">
              <BarChart3 className="h-5 w-5 text-eyes-cafe-500 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Run Analysis</p>
                <p className="text-sm text-gray-600">Analyze all sessions</p>
              </div>
            </button>
            
            <button className="w-full flex items-center px-4 py-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50">
              <Download className="h-5 w-5 text-eyes-cafe-500 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Export Data</p>
                <p className="text-sm text-gray-600">Download CSV report</p>
              </div>
            </button>
            
            <button className="w-full flex items-center px-4 py-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50">
              <Calendar className="h-5 w-5 text-eyes-cafe-500 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Schedule Report</p>
                <p className="text-sm text-gray-600">Set up automated reports</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}