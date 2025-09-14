import { Metadata } from 'next';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';

export const metadata: Metadata = {
  title: 'Analytics - Eyes Café',
  description: 'Advanced analytics and insights for World Café conversations',
};

export default function AnalyticsPage() {
  return (
    <main className="min-h-screen bg-background">
      <AnalyticsDashboard />
    </main>
  );
}