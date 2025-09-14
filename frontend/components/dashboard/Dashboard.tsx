'use client';

import { useState, useEffect } from 'react';
import { DashboardHeader } from './DashboardHeader';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardContent } from './DashboardContent';
import { CrossPlatformNavigator } from '@/components/navigation/CrossPlatformNavigator';
import { ChatWidget } from '@/components/chat/ChatWidget';

export function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState('');

  useEffect(() => {
    setCurrentPath(window.location.href);
  }, []);

  return (
    <div className="flex h-screen" style={{ backgroundColor: 'var(--neutral-50)' }}>
      {/* Sidebar */}
      <DashboardSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <DashboardHeader 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
        />
        
        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <DashboardContent />
        </main>
      </div>
      
      {/* Cross-Platform Navigator */}
      <CrossPlatformNavigator currentPath={currentPath} />
      
      {/* Global Chat Widget */}
      <ChatWidget defaultScope="global" className="z-50" />
    </div>
  );
}