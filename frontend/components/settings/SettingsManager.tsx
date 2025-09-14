'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Database, 
  Palette, 
  Globe, 
  Zap,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Upload,
  Download,
  Trash2,
  Info,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Settings {
  // General Settings
  organizationName: string;
  contactEmail: string;
  timezone: string;
  language: string;
  
  // World Café API Settings
  worldCafeApiUrl: string;
  apiKey: string;
  syncInterval: number; // minutes
  autoSync: boolean;
  
  // Session Settings
  defaultSessionDuration: number; // minutes
  defaultRounds: number;
  maxTablesPerSession: number;
  participantLimitPerTable: number;
  
  // Analysis Settings
  enableAiAnalysis: boolean;
  analysisLanguage: string;
  confidenceThreshold: number;
  autoGenerateInsights: boolean;
  
  // Notification Settings
  emailNotifications: boolean;
  sessionAlerts: boolean;
  analysisComplete: boolean;
  systemUpdates: boolean;
  
  // Data & Privacy
  dataRetentionDays: number;
  anonymizeData: boolean;
  exportFormat: string;
  
  // UI Settings
  theme: 'light' | 'dark' | 'auto';
  compactMode: boolean;
  showAdvancedFeatures: boolean;
}

const defaultSettings: Settings = {
  organizationName: 'Eyes Café Organization',
  contactEmail: 'admin@eyescafe.com',
  timezone: 'UTC',
  language: 'en',
  worldCafeApiUrl: 'https://api.worldcafe.com',
  apiKey: '',
  syncInterval: 15,
  autoSync: true,
  defaultSessionDuration: 90,
  defaultRounds: 3,
  maxTablesPerSession: 12,
  participantLimitPerTable: 8,
  enableAiAnalysis: true,
  analysisLanguage: 'en',
  confidenceThreshold: 0.7,
  autoGenerateInsights: true,
  emailNotifications: true,
  sessionAlerts: true,
  analysisComplete: true,
  systemUpdates: false,
  dataRetentionDays: 365,
  anonymizeData: false,
  exportFormat: 'json',
  theme: 'light',
  compactMode: false,
  showAdvancedFeatures: false
};

const settingSections = [
  {
    id: 'general',
    title: 'General',
    icon: Settings,
    description: 'Basic organization and system settings'
  },
  {
    id: 'api',
    title: 'World Café API',
    icon: Globe,
    description: 'Integration with World Café platform'
  },
  {
    id: 'sessions',
    title: 'Session Defaults',
    icon: User,
    description: 'Default settings for new sessions'
  },
  {
    id: 'analysis',
    title: 'AI Analysis',
    icon: Zap,
    description: 'Conversation analysis and insights'
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: Bell,
    description: 'Email and system notifications'
  },
  {
    id: 'data',
    title: 'Data & Privacy',
    icon: Shield,
    description: 'Data retention and privacy settings'
  },
  {
    id: 'appearance',
    title: 'Appearance',
    icon: Palette,
    description: 'UI theme and display options'
  }
];

export function SettingsManager() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [activeSection, setActiveSection] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    // Simulate loading settings from API
    const loadSettings = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      // In real implementation, this would fetch from API
      setSettings(defaultSettings);
      setLoading(false);
    };

    loadSettings();
  }, []);

  const handleSettingChange = (key: keyof Settings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    // In real implementation, this would save to API
    await new Promise(resolve => setTimeout(resolve, 2000));
    setSaving(false);
    // Show success message
  };

  const testApiConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);
    
    // Simulate API test
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Randomly succeed or fail for demo
    const success = Math.random() > 0.3;
    setConnectionStatus(success ? 'success' : 'error');
    setTestingConnection(false);
  };

  const exportSettings = () => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'eyes-cafe-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderSettingSection = () => {
    switch (activeSection) {
      case 'general':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={settings.organizationName}
                  onChange={(e) => handleSettingChange('organizationName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eyes-cafe-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => handleSettingChange('contactEmail', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eyes-cafe-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timezone
                </label>
                <select
                  value={settings.timezone}
                  onChange={(e) => handleSettingChange('timezone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eyes-cafe-500"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Berlin">Berlin</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => handleSettingChange('language', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eyes-cafe-500"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="it">Italiano</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'api':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">World Café Integration</p>
                  <p>Configure the connection to your World Café platform for data synchronization.</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Base URL
              </label>
              <input
                type="url"
                value={settings.worldCafeApiUrl}
                onChange={(e) => handleSettingChange('worldCafeApiUrl', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eyes-cafe-500"
                placeholder="https://api.worldcafe.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={settings.apiKey}
                  onChange={(e) => handleSettingChange('apiKey', e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eyes-cafe-500"
                  placeholder="Enter your API key"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={testApiConnection}
                disabled={testingConnection || !settings.apiKey}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {testingConnection ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                Test Connection
              </button>

              {connectionStatus && (
                <div className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
                  connectionStatus === 'success' 
                    ? "bg-green-100 text-green-700" 
                    : "bg-red-100 text-red-700"
                )}>
                  {connectionStatus === 'success' ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Connection successful
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4" />
                      Connection failed
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sync Interval (minutes)
                </label>
                <input
                  type="number"
                  value={settings.syncInterval}
                  onChange={(e) => handleSettingChange('syncInterval', parseInt(e.target.value))}
                  min="1"
                  max="1440"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eyes-cafe-500"
                />
              </div>
              <div className="flex items-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoSync}
                    onChange={(e) => handleSettingChange('autoSync', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Enable Auto Sync</span>
                </label>
              </div>
            </div>
          </div>
        );

      case 'sessions':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Session Duration (minutes)
                </label>
                <input
                  type="number"
                  value={settings.defaultSessionDuration}
                  onChange={(e) => handleSettingChange('defaultSessionDuration', parseInt(e.target.value))}
                  min="15"
                  max="480"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eyes-cafe-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Rounds
                </label>
                <input
                  type="number"
                  value={settings.defaultRounds}
                  onChange={(e) => handleSettingChange('defaultRounds', parseInt(e.target.value))}
                  min="1"
                  max="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eyes-cafe-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Tables per Session
                </label>
                <input
                  type="number"
                  value={settings.maxTablesPerSession}
                  onChange={(e) => handleSettingChange('maxTablesPerSession', parseInt(e.target.value))}
                  min="2"
                  max="50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eyes-cafe-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Participant Limit per Table
                </label>
                <input
                  type="number"
                  value={settings.participantLimitPerTable}
                  onChange={(e) => handleSettingChange('participantLimitPerTable', parseInt(e.target.value))}
                  min="2"
                  max="20"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eyes-cafe-500"
                />
              </div>
            </div>
          </div>
        );

      case 'analysis':
        return (
          <div className="space-y-6">
            <div className="flex items-center">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableAiAnalysis}
                  onChange={(e) => handleSettingChange('enableAiAnalysis', e.target.checked)}
                  className="mr-3"
                />
                <div>
                  <div className="text-sm font-medium text-gray-700">Enable AI Analysis</div>
                  <div className="text-xs text-gray-500">Automatically analyze conversations for insights</div>
                </div>
              </label>
            </div>

            {settings.enableAiAnalysis && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Analysis Language
                    </label>
                    <select
                      value={settings.analysisLanguage}
                      onChange={(e) => handleSettingChange('analysisLanguage', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eyes-cafe-500"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confidence Threshold
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.1"
                      value={settings.confidenceThreshold}
                      onChange={(e) => handleSettingChange('confidenceThreshold', parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Current: {(settings.confidenceThreshold * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.autoGenerateInsights}
                      onChange={(e) => handleSettingChange('autoGenerateInsights', e.target.checked)}
                      className="mr-3"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-700">Auto-generate Insights</div>
                      <div className="text-xs text-gray-500">Automatically create insights after session completion</div>
                    </div>
                  </label>
                </div>
              </>
            )}
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                    className="mr-3"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-700">Email Notifications</div>
                    <div className="text-xs text-gray-500">Receive notifications via email</div>
                  </div>
                </label>
              </div>

              {settings.emailNotifications && (
                <div className="ml-6 space-y-3">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.sessionAlerts}
                      onChange={(e) => handleSettingChange('sessionAlerts', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Session start/end alerts</span>
                  </label>

                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.analysisComplete}
                      onChange={(e) => handleSettingChange('analysisComplete', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Analysis completion</span>
                  </label>

                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.systemUpdates}
                      onChange={(e) => handleSettingChange('systemUpdates', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">System updates</span>
                  </label>
                </div>
              )}
            </div>
          </div>
        );

      case 'data':
        return (
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm text-yellow-700">
                  <p className="font-medium mb-1">Data Retention Policy</p>
                  <p>Configure how long data is retained and privacy settings.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Retention (days)
                </label>
                <input
                  type="number"
                  value={settings.dataRetentionDays}
                  onChange={(e) => handleSettingChange('dataRetentionDays', parseInt(e.target.value))}
                  min="30"
                  max="3650"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eyes-cafe-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Data older than this will be automatically deleted
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Export Format
                </label>
                <select
                  value={settings.exportFormat}
                  onChange={(e) => handleSettingChange('exportFormat', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eyes-cafe-500"
                >
                  <option value="json">JSON</option>
                  <option value="csv">CSV</option>
                  <option value="xlsx">Excel</option>
                  <option value="pdf">PDF</option>
                </select>
              </div>
            </div>

            <div className="flex items-center">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.anonymizeData}
                  onChange={(e) => handleSettingChange('anonymizeData', e.target.checked)}
                  className="mr-3"
                />
                <div>
                  <div className="text-sm font-medium text-gray-700">Anonymize Data</div>
                  <div className="text-xs text-gray-500">Remove personal identifiers from exported data</div>
                </div>
              </label>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Theme
              </label>
              <div className="flex gap-4">
                {(['light', 'dark', 'auto'] as const).map((theme) => (
                  <label key={theme} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="theme"
                      value={theme}
                      checked={settings.theme === theme}
                      onChange={(e) => handleSettingChange('theme', e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 capitalize">{theme}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.compactMode}
                    onChange={(e) => handleSettingChange('compactMode', e.target.checked)}
                    className="mr-3"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-700">Compact Mode</div>
                    <div className="text-xs text-gray-500">Reduce spacing and padding for more content</div>
                  </div>
                </label>
              </div>

              <div className="flex items-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showAdvancedFeatures}
                    onChange={(e) => handleSettingChange('showAdvancedFeatures', e.target.checked)}
                    className="mr-3"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-700">Show Advanced Features</div>
                    <div className="text-xs text-gray-500">Display advanced options and technical details</div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-eyes-cafe-500" />
          <span className="ml-2 text-gray-600">Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Configure your Eyes Café platform</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportSettings}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center px-4 py-2 bg-eyes-cafe-500 text-white rounded-lg hover:bg-eyes-cafe-600 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 space-y-1">
          {settingSections.map((section) => {
            const IconComponent = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-lg transition-colors",
                  activeSection === section.id
                    ? "bg-eyes-cafe-100 text-eyes-cafe-700 border border-eyes-cafe-200"
                    : "hover:bg-gray-100"
                )}
              >
                <div className="flex items-center">
                  <IconComponent className="h-5 w-5 mr-3" />
                  <div>
                    <div className="font-medium">{section.title}</div>
                    <div className="text-xs text-gray-500 mt-1">{section.description}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="mb-6">
              {settingSections.find(s => s.id === activeSection) && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {settingSections.find(s => s.id === activeSection)?.title}
                  </h2>
                  <p className="text-gray-600">
                    {settingSections.find(s => s.id === activeSection)?.description}
                  </p>
                </div>
              )}
            </div>

            {renderSettingSection()}
          </div>
        </div>
      </div>
    </div>
  );
}