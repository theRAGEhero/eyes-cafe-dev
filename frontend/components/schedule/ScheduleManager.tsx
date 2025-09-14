'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Plus,
  MapPin,
  Users,
  Edit2,
  Trash2,
  Copy,
  ArrowRight,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  Settings,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScheduleEvent {
  id: string;
  title: string;
  description?: string;
  type: 'session' | 'break' | 'networking' | 'presentation';
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  location?: string;
  facilitator?: string;
  maxParticipants?: number;
  currentParticipants: number;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  sessionId?: string;
  tables?: number;
  rounds?: number;
  tags: string[];
}

const mockEvents: ScheduleEvent[] = [
  {
    id: '1',
    title: 'Welcome & Introduction',
    type: 'presentation',
    startTime: '2024-01-20T09:00:00Z',
    endTime: '2024-01-20T09:30:00Z',
    duration: 30,
    location: 'Main Hall',
    facilitator: 'Dr. Sarah Miller',
    maxParticipants: 100,
    currentParticipants: 85,
    status: 'completed',
    tags: ['opening', 'introduction']
  },
  {
    id: '2',
    title: 'Innovation in Healthcare',
    type: 'session',
    startTime: '2024-01-20T09:45:00Z',
    endTime: '2024-01-20T11:15:00Z',
    duration: 90,
    location: 'Conference Room A',
    facilitator: 'Dr. Michael Johnson',
    maxParticipants: 48,
    currentParticipants: 42,
    status: 'active',
    sessionId: 'session-1',
    tables: 6,
    rounds: 3,
    tags: ['healthcare', 'innovation', 'worldcafe']
  },
  {
    id: '3',
    title: 'Coffee Break',
    type: 'break',
    startTime: '2024-01-20T11:15:00Z',
    endTime: '2024-01-20T11:30:00Z',
    duration: 15,
    location: 'Lobby',
    currentParticipants: 0,
    status: 'scheduled',
    tags: ['break']
  },
  {
    id: '4',
    title: 'Sustainable Development Goals',
    type: 'session',
    startTime: '2024-01-20T11:30:00Z',
    endTime: '2024-01-20T13:00:00Z',
    duration: 90,
    location: 'Conference Room B',
    facilitator: 'Prof. Emma Davis',
    maxParticipants: 64,
    currentParticipants: 58,
    status: 'scheduled',
    sessionId: 'session-2',
    tables: 8,
    rounds: 4,
    tags: ['sustainability', 'sdg', 'worldcafe']
  },
  {
    id: '5',
    title: 'Lunch & Networking',
    type: 'networking',
    startTime: '2024-01-20T13:00:00Z',
    endTime: '2024-01-20T14:00:00Z',
    duration: 60,
    location: 'Dining Hall',
    currentParticipants: 0,
    status: 'scheduled',
    tags: ['lunch', 'networking']
  }
];

const eventTypeConfig = {
  session: {
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
    icon: Users,
    label: 'Session'
  },
  break: {
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200',
    icon: Clock,
    label: 'Break'
  },
  networking: {
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-200',
    icon: Users,
    label: 'Networking'
  },
  presentation: {
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-200',
    icon: PlayCircle,
    label: 'Presentation'
  }
};

const statusConfig = {
  scheduled: { color: 'text-gray-600', bgColor: 'bg-gray-100', label: 'Scheduled' },
  active: { color: 'text-green-600', bgColor: 'bg-green-100', label: 'Active' },
  completed: { color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Completed' },
  cancelled: { color: 'text-red-600', bgColor: 'bg-red-100', label: 'Cancelled' }
};

export function ScheduleManager() {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'timeline' | 'grid'>('timeline');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    // Simulate API call
    const fetchEvents = async () => {
      setLoading(true);
      // In real implementation, this would fetch from API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setEvents(mockEvents);
      setLoading(false);
    };

    fetchEvents();
  }, []);

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.facilitator?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || event.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const handleStatusChange = (eventId: string, newStatus: ScheduleEvent['status']) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId ? { ...event, status: newStatus } : event
    ));
  };

  const getTimelinePosition = (startTime: string, duration: number) => {
    const start = new Date(startTime);
    const dayStart = new Date(start);
    dayStart.setHours(8, 0, 0, 0); // Assume day starts at 8 AM
    
    const offsetMinutes = (start.getTime() - dayStart.getTime()) / (1000 * 60);
    const top = (offsetMinutes / 60) * 80; // 80px per hour
    const height = (duration / 60) * 80;
    
    return { top: `${top}px`, height: `${height}px` };
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-eyes-cafe-500" />
          <span className="ml-2 text-gray-600">Loading schedule...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
          <p className="text-gray-600">Manage event timeline and session scheduling</p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setViewMode('timeline')}
              className={cn(
                "px-4 py-2 text-sm font-medium",
                viewMode === 'timeline' 
                  ? "bg-eyes-cafe-500 text-white" 
                  : "bg-white text-gray-700 hover:bg-gray-50"
              )}
            >
              Timeline
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "px-4 py-2 text-sm font-medium",
                viewMode === 'grid' 
                  ? "bg-eyes-cafe-500 text-white" 
                  : "bg-white text-gray-700 hover:bg-gray-50"
              )}
            >
              Grid
            </button>
          </div>
          <button className="flex items-center px-4 py-2 bg-eyes-cafe-500 text-white rounded-lg hover:bg-eyes-cafe-600">
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </button>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-500" />
              <h2 className="text-lg font-semibold">
                {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h2>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <button className="text-sm text-eyes-cafe-600 hover:text-eyes-cafe-700">
            Today
          </button>
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
                placeholder="Search events..."
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
            <option value="session">Sessions</option>
            <option value="break">Breaks</option>
            <option value="networking">Networking</option>
            <option value="presentation">Presentations</option>
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eyes-cafe-500"
          >
            <option value="all">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Schedule Content */}
      {viewMode === 'timeline' ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Timeline View</h3>
          </div>
          <div className="relative">
            {/* Time indicators */}
            <div className="absolute left-0 top-0 w-16 bg-gray-50 border-r border-gray-200">
              {Array.from({ length: 12 }, (_, i) => (
                <div key={i} className="h-20 border-b border-gray-200 flex items-center justify-center text-xs text-gray-500">
                  {String(8 + i).padStart(2, '0')}:00
                </div>
              ))}
            </div>
            
            {/* Events */}
            <div className="ml-16 relative" style={{ height: '960px' }}>
              {filteredEvents.map((event) => {
                const typeConfig = eventTypeConfig[event.type];
                const statusInfo = statusConfig[event.status];
                const position = getTimelinePosition(event.startTime, event.duration);
                const TypeIcon = typeConfig.icon;
                
                return (
                  <div
                    key={event.id}
                    className={cn(
                      "absolute left-2 right-2 rounded-lg border-l-4 p-3 shadow-sm",
                      typeConfig.bgColor,
                      typeConfig.borderColor
                    )}
                    style={position}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <TypeIcon className={cn("h-4 w-4", typeConfig.color)} />
                          <h4 className="font-medium text-gray-900">{event.title}</h4>
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            statusInfo.color,
                            statusInfo.bgColor
                          )}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center gap-4">
                            <span>{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
                            <span>({formatDuration(event.duration)})</span>
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </div>
                          )}
                          {event.facilitator && (
                            <div>Facilitator: {event.facilitator}</div>
                          )}
                          {event.tables && (
                            <div>{event.tables} tables, {event.rounds} rounds</div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvents.map((event) => {
            const typeConfig = eventTypeConfig[event.type];
            const statusInfo = statusConfig[event.status];
            const TypeIcon = typeConfig.icon;
            
            return (
              <div
                key={event.id}
                className={cn(
                  "bg-white rounded-lg border-2 p-4 transition-all hover:shadow-md",
                  typeConfig.borderColor
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={cn("p-2 rounded-lg", typeConfig.bgColor)}>
                      <TypeIcon className={cn("h-4 w-4", typeConfig.color)} />
                    </div>
                    <div>
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        statusInfo.color,
                        statusInfo.bgColor
                      )}>
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <h3 className="font-semibold text-gray-900 mb-2">{event.title}</h3>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(event.startTime)} - {formatTime(event.endTime)}
                    <span className="text-gray-400">({formatDuration(event.duration)})</span>
                  </div>
                  
                  {event.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {event.location}
                    </div>
                  )}
                  
                  {event.facilitator && (
                    <div>
                      <strong>Facilitator:</strong> {event.facilitator}
                    </div>
                  )}
                  
                  {event.maxParticipants && (
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {event.currentParticipants}/{event.maxParticipants} participants
                    </div>
                  )}
                  
                  {event.tables && (
                    <div>{event.tables} tables, {event.rounds} rounds</div>
                  )}
                </div>
                
                {event.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {event.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="flex gap-2 mt-4">
                  {event.status === 'scheduled' && (
                    <button
                      onClick={() => handleStatusChange(event.id, 'active')}
                      className="flex-1 px-3 py-2 bg-green-100 text-green-700 text-sm rounded-md hover:bg-green-200"
                    >
                      Start
                    </button>
                  )}
                  {event.status === 'active' && (
                    <button
                      onClick={() => handleStatusChange(event.id, 'completed')}
                      className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 text-sm rounded-md hover:bg-blue-200"
                    >
                      Complete
                    </button>
                  )}
                  <button className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200">
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredEvents.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
          <p className="text-gray-600">
            {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Start by adding events to your schedule'}
          </p>
        </div>
      )}
    </div>
  );
}