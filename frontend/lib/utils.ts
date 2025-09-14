import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date formatting utilities
export function formatDate(date: string | Date, formatStr: string = 'MMM d, yyyy'): string {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return format(parsedDate, formatStr);
}

export function formatRelativeTime(date: string | Date): string {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  
  if (isToday(parsedDate)) {
    return `Today at ${format(parsedDate, 'HH:mm')}`;
  }
  
  if (isYesterday(parsedDate)) {
    return `Yesterday at ${format(parsedDate, 'HH:mm')}`;
  }
  
  return formatDistanceToNow(parsedDate, { addSuffix: true });
}

// Number formatting utilities
export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat('en-US', options).format(value);
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
}

// URL utilities
export function createWorldCafeUrl(eyesCafeUrl: string): string {
  return eyesCafeUrl.replace('eyes-cafe.democracyroutes.com', 'world-cafe.democracyroutes.com');
}

export function extractSessionId(pathname: string): string | null {
  const match = pathname.match(/\/sessions\/([^\/]+)/);
  return match ? match[1] : null;
}

// Analysis utilities
export function getPolarizationLevel(index: number): 'low' | 'medium' | 'high' | 'critical' {
  if (index >= 80) return 'critical';
  if (index >= 60) return 'high';
  if (index >= 40) return 'medium';
  return 'low';
}

export function getPolarizationColor(index: number): string {
  const level = getPolarizationLevel(index);
  const colors = {
    low: 'text-green-600',
    medium: 'text-amber-600',
    high: 'text-red-600',
    critical: 'text-red-700'
  };
  return colors[level];
}

export function getBiasLevel(severity: number): 'none' | 'low' | 'medium' | 'high' {
  if (severity >= 0.8) return 'high';
  if (severity >= 0.6) return 'medium';
  if (severity >= 0.3) return 'low';
  return 'none';
}

export function getBiasColor(severity: number): string {
  const level = getBiasLevel(severity);
  const colors = {
    none: 'text-green-600',
    low: 'text-amber-600',
    medium: 'text-red-600',
    high: 'text-red-700'
  };
  return colors[level];
}

// Data processing utilities
export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function calculatePercentiles(values: number[]): {
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
} {
  const sorted = [...values].sort((a, b) => a - b);
  const length = sorted.length;
  
  const percentile = (p: number) => {
    const index = (p / 100) * (length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    
    if (lower === upper) {
      return sorted[lower];
    }
    
    const weight = index - lower;
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  };
  
  return {
    p25: percentile(25),
    p50: percentile(50),
    p75: percentile(75),
    p90: percentile(90),
    p95: percentile(95),
  };
}

// Validation utilities
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Error handling utilities
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred';
}

// Local storage utilities
export function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Fail silently
  }
}

// Chart utilities
export function getChartColors(count: number): string[] {
  const baseColors = [
    '#0ea5e9', // sky-500
    '#8b5cf6', // violet-500
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#ef4444', // red-500
    '#6366f1', // indigo-500
    '#ec4899', // pink-500
    '#14b8a6', // teal-500
  ];
  
  const colors = [];
  for (let i = 0; i < count; i++) {
    colors.push(baseColors[i % baseColors.length]);
  }
  
  return colors;
}

export function generateGradient(color: string): string {
  return `linear-gradient(135deg, ${color}22 0%, ${color}44 100%)`;
}

// Debounce utility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}