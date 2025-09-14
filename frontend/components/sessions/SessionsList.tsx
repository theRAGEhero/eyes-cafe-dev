'use client';

import { useState, useEffect } from 'react';
import { 
  Search,
  Filter,
  MoreVertical,
  Eye,
  Play,
  BarChart3,
  FileText,
  Calendar,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

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
  createdAt: string;
  updatedAt: string;
}

export function SessionsList() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [syncing, setSyncing] = useState(false);

  const fetchSessions = async () => {
    try {
      setError(null);
      const response = await fetch('http://localhost:3002/api/sessions');
      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }
      const data = await response.json();
      setSessions(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const syncSessions = async () => {
    try {
      setSyncing(true);
      await fetch('http://localhost:3002/api/jobs/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true })
      });
      // Refresh sessions after sync
      setTimeout(fetchSessions, 2000);
    } catch (err) {
      console.error('Error syncing sessions:', err);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.worldCafeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || session.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getAlertIcon = (level: string) => {
    switch (level) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClass = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'active':
        return <span className={cn(baseClass, "bg-green-100 text-green-800")}>Active</span>;
      case 'completed':
        return <span className={cn(baseClass, "bg-blue-100 text-blue-800")}>Completed</span>;
      case 'paused':
        return <span className={cn(baseClass, "bg-yellow-100 text-yellow-800")}>Paused</span>;
      default:
        return <span className={cn(baseClass, "bg-gray-100 text-gray-800")}>Unknown</span>;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-eyes-cafe-500" />
          <span className="ml-2 text-gray-600">Loading sessions...</span>
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
            onClick={fetchSessions}
            className="mt-2 text-red-600 hover:text-red-500 text-sm underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sessions</h1>
            <p className="text-gray-600">Manage and analyze World Café conversation sessions</p>
          </div>
          <button
            onClick={syncSessions}
            disabled={syncing}
            className="flex items-center px-4 py-2 bg-eyes-cafe-500 text-white rounded-lg hover:bg-eyes-cafe-600 disabled:opacity-50"
          >
            {syncing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Sync Sessions
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search sessions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-eyes-cafe-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eyes-cafe-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="paused">Paused</option>
          </select>
        </div>
      </div>

      {/* Sessions Grid */}
      {filteredSessions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-2">
            <BarChart3 className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No sessions found</h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Sessions will appear here once synced from World Café'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredSessions.map((session) => (
            <div
              key={session.id}
              className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 truncate">{session.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">ID: {session.worldCafeId}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getAlertIcon(session.alertLevel)}
                    {getStatusBadge(session.status)}
                  </div>
                </div>

                {/* Metrics */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    <span>{session.tableCount} tables</span>
                    {session.participantCount && (
                      <span className="ml-2">• {session.participantCount} participants</span>
                    )}
                  </div>
                  
                  {session.polarizationIndex !== undefined && (
                    <div className="flex items-center text-sm text-gray-600">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      <span>Polarization: {session.polarizationIndex}/100</span>
                    </div>
                  )}

                  {session.lastAnalyzedAt && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>Last analyzed: {new Date(session.lastAnalyzedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Link
                    href={`/sessions/${session.worldCafeId}`}
                    className="flex items-center px-3 py-1.5 bg-eyes-cafe-500 text-white text-sm rounded hover:bg-eyes-cafe-600"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View Details
                  </Link>
                  <button className="flex items-center px-3 py-1.5 border border-gray-300 text-sm rounded hover:bg-gray-50">
                    <FileText className="h-3 w-3 mr-1" />
                    Report
                  </button>
                </div>

                {/* New Insights Indicator */}
                {session.hasNewInsights && (
                  <div className="mt-3 px-3 py-1 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                    New insights available
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}