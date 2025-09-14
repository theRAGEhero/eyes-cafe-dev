'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  Mail,
  Phone,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Upload,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Participant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  organization?: string;
  role?: string;
  status: 'registered' | 'checked-in' | 'not-attending';
  registrationDate: string;
  checkInTime?: string;
  sessions: string[];
  tableAssignments: {
    sessionId: string;
    tableNumber: number;
    round: number;
  }[];
  notes?: string;
}

const mockParticipants: Participant[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    phone: '+1-555-0123',
    organization: 'TechCorp',
    role: 'Product Manager',
    status: 'checked-in',
    registrationDate: '2024-01-15T10:30:00Z',
    checkInTime: '2024-01-20T09:15:00Z',
    sessions: ['session-1', 'session-2'],
    tableAssignments: [
      { sessionId: 'session-1', tableNumber: 1, round: 1 },
      { sessionId: 'session-1', tableNumber: 3, round: 2 }
    ],
    notes: 'Experienced facilitator, good for complex discussions'
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'michael.chen@startup.io',
    organization: 'InnovateNow',
    role: 'CTO',
    status: 'registered',
    registrationDate: '2024-01-16T14:20:00Z',
    sessions: ['session-1'],
    tableAssignments: [
      { sessionId: 'session-1', tableNumber: 2, round: 1 }
    ]
  },
  {
    id: '3',
    name: 'Emma Davis',
    email: 'emma.davis@ngo.org',
    phone: '+1-555-0456',
    organization: 'Community First',
    role: 'Director',
    status: 'not-attending',
    registrationDate: '2024-01-12T09:45:00Z',
    sessions: ['session-2'],
    tableAssignments: []
  }
];

const statusConfig = {
  registered: {
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: Clock,
    label: 'Registered'
  },
  'checked-in': {
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: CheckCircle,
    label: 'Checked In'
  },
  'not-attending': {
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: XCircle,
    label: 'Not Attending'
  }
};

export function ParticipantsManager() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    // Simulate API call
    const fetchParticipants = async () => {
      setLoading(true);
      // In real implementation, this would fetch from API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setParticipants(mockParticipants);
      setLoading(false);
    };

    fetchParticipants();
  }, []);

  const filteredParticipants = participants.filter(participant => {
    const matchesSearch = participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         participant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         participant.organization?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || participant.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSelectParticipant = (participantId: string) => {
    const newSelected = new Set(selectedParticipants);
    if (newSelected.has(participantId)) {
      newSelected.delete(participantId);
    } else {
      newSelected.add(participantId);
    }
    setSelectedParticipants(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedParticipants.size === filteredParticipants.length) {
      setSelectedParticipants(new Set());
    } else {
      setSelectedParticipants(new Set(filteredParticipants.map(p => p.id)));
    }
  };

  const handleStatusChange = (participantId: string, newStatus: Participant['status']) => {
    setParticipants(prev => prev.map(p => 
      p.id === participantId 
        ? { ...p, status: newStatus, checkInTime: newStatus === 'checked-in' ? new Date().toISOString() : undefined }
        : p
    ));
  };

  const stats = {
    total: participants.length,
    registered: participants.filter(p => p.status === 'registered').length,
    checkedIn: participants.filter(p => p.status === 'checked-in').length,
    notAttending: participants.filter(p => p.status === 'not-attending').length
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-eyes-cafe-500" />
          <span className="ml-2 text-gray-600">Loading participants...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Participants</h1>
          <p className="text-gray-600">Manage session participants and attendance</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </button>
          <button className="flex items-center px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-4 py-2 bg-eyes-cafe-500 text-white rounded-lg hover:bg-eyes-cafe-600"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Participant
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Registered</p>
              <p className="text-2xl font-bold text-blue-600">{stats.registered}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Checked In</p>
              <p className="text-2xl font-bold text-green-600">{stats.checkedIn}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Not Attending</p>
              <p className="text-2xl font-bold text-red-600">{stats.notAttending}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
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
                placeholder="Search participants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-eyes-cafe-500"
              />
            </div>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eyes-cafe-500"
          >
            <option value="all">All Status</option>
            <option value="registered">Registered</option>
            <option value="checked-in">Checked In</option>
            <option value="not-attending">Not Attending</option>
          </select>
        </div>
      </div>

      {/* Participants Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={selectedParticipants.size === filteredParticipants.length}
                onChange={handleSelectAll}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">
                {selectedParticipants.size > 0 
                  ? `${selectedParticipants.size} selected` 
                  : 'Select all'}
              </span>
            </label>
          </div>

          {selectedParticipants.size > 0 && (
            <div className="flex gap-2">
              <button className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200">
                Check In
              </button>
              <button className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200">
                Remove
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-4 px-4 py-3"></th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Participant</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Contact</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Organization</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Sessions</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredParticipants.map((participant) => {
                const statusInfo = statusConfig[participant.status];
                const StatusIcon = statusInfo.icon;

                return (
                  <tr key={participant.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedParticipants.has(participant.id)}
                        onChange={() => handleSelectParticipant(participant.id)}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{participant.name}</div>
                        <div className="text-sm text-gray-500">{participant.role}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-3 w-3 mr-1" />
                          {participant.email}
                        </div>
                        {participant.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-3 w-3 mr-1" />
                            {participant.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-900">{participant.organization}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn(
                        "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                        statusInfo.color,
                        statusInfo.bgColor
                      )}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-600">{participant.sessions.length} session(s)</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <select
                          value={participant.status}
                          onChange={(e) => handleStatusChange(participant.id, e.target.value as Participant['status'])}
                          className="text-xs border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="registered">Registered</option>
                          <option value="checked-in">Check In</option>
                          <option value="not-attending">Not Attending</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredParticipants.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No participants found</h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Start by adding participants to your sessions'}
          </p>
        </div>
      )}
    </div>
  );
}