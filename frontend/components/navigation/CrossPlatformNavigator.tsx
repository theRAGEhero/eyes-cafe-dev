'use client';

import { useState } from 'react';
import { ExternalLink, Mic } from 'lucide-react';
import { createWorldCafeUrl, extractSessionId } from '@/lib/utils';

interface CrossPlatformNavigatorProps {
  currentPath: string;
  currentSession?: string;
}

export function CrossPlatformNavigator({ 
  currentPath, 
  currentSession 
}: CrossPlatformNavigatorProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Extract session ID from current path if not provided
  const sessionId = currentSession || extractSessionId(currentPath);
  
  const switchToWorldCafe = () => {
    const worldCafeUrl = createWorldCafeUrl(currentPath);
    window.open(worldCafeUrl, '_blank');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={switchToWorldCafe}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group bg-eyes-cafe-600 hover:bg-eyes-cafe-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-eyes-cafe-500 focus:ring-offset-2"
      >
        <div className="flex items-center space-x-2">
          <Mic className="h-5 w-5" />
          <ExternalLink className="h-4 w-4" />
        </div>
        
        {/* Tooltip */}
        {isHovered && (
          <div className="absolute bottom-full right-0 mb-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg whitespace-nowrap">
            <div className="flex items-center space-x-2">
              <span>View in World Café</span>
              {sessionId && (
                <span className="bg-gray-700 px-2 py-1 rounded text-xs">
                  {sessionId.slice(-6)}
                </span>
              )}
            </div>
            {/* Arrow */}
            <div className="absolute top-full right-4 -mt-1 border-4 border-transparent border-t-gray-900"></div>
          </div>
        )}
      </button>
    </div>
  );
}