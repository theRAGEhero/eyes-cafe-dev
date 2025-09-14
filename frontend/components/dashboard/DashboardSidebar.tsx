'use client';

import { 
  BarChart3, 
  Calendar, 
  FileText, 
  Home, 
  MessageSquare, 
  Settings, 
  TrendingUp,
  Users,
  X
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Sessions', href: '/sessions', icon: MessageSquare },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Insights', href: '/insights', icon: TrendingUp },
  { name: 'Participants', href: '/participants', icon: Users },
  { name: 'Schedule', href: '/schedule', icon: Calendar },
];

const secondaryNavigation = [
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function DashboardSidebar({ isOpen, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          backgroundColor: 'var(--neutral-0)',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        <div className="flex items-center justify-between h-16 px-4" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{
              background: 'var(--gradient-primary)',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
            }}>
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div className="ml-3">
              <h2 className="text-lg font-semibold" style={{ 
                color: 'var(--neutral-900)',
                letterSpacing: '-0.01em'
              }}>Eyes Café</h2>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-500 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className="group flex items-center px-2 py-2 text-sm font-medium transition-colors"
                style={{
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isActive ? 'var(--primary-100)' : 'transparent',
                  color: isActive ? 'var(--primary-900)' : 'var(--neutral-600)',
                  transition: 'var(--transition-colors)'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'var(--neutral-50)';
                    e.currentTarget.style.color = 'var(--neutral-900)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--neutral-600)';
                  }
                }}
                onClick={() => onClose()}
              >
                <item.icon
                  className="mr-3 h-5 w-5 flex-shrink-0"
                  style={{
                    color: isActive ? 'var(--primary-500)' : 'var(--neutral-400)',
                    transition: 'var(--transition-colors)'
                  }}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Secondary Navigation */}
        <div className="pt-4 pb-4" style={{ borderTop: '1px solid var(--neutral-200)' }}>
          <nav className="px-2 space-y-1">
            {secondaryNavigation.map((item) => {
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="group flex items-center px-2 py-2 text-sm font-medium transition-colors"
                  style={{
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isActive ? 'var(--primary-100)' : 'transparent',
                    color: isActive ? 'var(--primary-900)' : 'var(--neutral-600)',
                    transition: 'var(--transition-colors)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'var(--neutral-50)';
                      e.currentTarget.style.color = 'var(--neutral-900)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--neutral-600)';
                    }
                  }}
                  onClick={() => onClose()}
                >
                  <item.icon
                    className="mr-3 h-5 w-5 flex-shrink-0"
                    style={{
                      color: isActive ? 'var(--primary-500)' : 'var(--neutral-400)',
                      transition: 'var(--transition-colors)'
                    }}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Info */}
        <div className="p-4" style={{ borderTop: '1px solid var(--neutral-200)' }}>
          <div className="text-xs" style={{ color: 'var(--neutral-500)' }}>
            <p className="font-medium">Version 1.0.0</p>
            <p className="mt-1">Phase 1: Foundation</p>
          </div>
        </div>
      </div>
    </>
  );
}