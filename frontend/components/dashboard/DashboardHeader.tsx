'use client';

import { Bell, Menu, Search, Settings } from 'lucide-react';

interface DashboardHeaderProps {
  onMenuClick: () => void;
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  return (
    <header className="px-4 py-3" style={{ 
      background: 'var(--glass-bg)', 
      backdropFilter: 'var(--glass-backdrop)',
      borderBottom: '1px solid var(--glass-border)',
      boxShadow: 'var(--shadow-md)'
    }}>
      <div className="flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-md lg:hidden"
            style={{ 
              color: 'var(--neutral-400)',
              transition: 'var(--transition-colors)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--neutral-500)';
              e.currentTarget.style.backgroundColor = 'var(--neutral-100)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--neutral-400)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Menu size={24} />
          </button>
          
          <div className="hidden lg:block">
            <h1 className="text-2xl font-bold" style={{ 
              color: 'var(--neutral-800)',
              letterSpacing: '-0.01em'
            }}>
              Eyes Café
            </h1>
            <p className="text-sm" style={{ color: 'var(--neutral-500)' }}>
              Conversation Intelligence Platform
            </p>
          </div>
        </div>

        {/* Center Section - Search */}
        <div className="flex-1 max-w-lg mx-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search sessions, participants, or insights..."
              className="block w-full pl-10 pr-3 py-2 leading-5 focus:outline-none"
              style={{
                border: '1px solid var(--neutral-300)',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--neutral-0)',
                color: 'var(--neutral-900)',
                transition: 'var(--transition-colors)',
                fontSize: 'var(--text-base)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--primary-500)';
                e.target.style.boxShadow = 'var(--focus-ring)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--neutral-300)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-3">
          <button className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-md relative">
            <Bell size={20} />
            <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400"></span>
          </button>
          
          <button className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-md">
            <Settings size={20} />
          </button>
          
          <div className="flex items-center space-x-3 pl-3 border-l border-gray-200">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">Admin User</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
            
            <div className="h-8 w-8 bg-eyes-cafe-500 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">A</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}