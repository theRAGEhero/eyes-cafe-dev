import { Metadata } from 'next';
import { InsightsDashboard } from '@/components/insights/InsightsDashboard';

export const metadata: Metadata = {
  title: 'Insights - Eyes Café',
  description: 'Deep conversation insights and patterns from World Café sessions',
};

export default function InsightsPage() {
  return (
    <main className="min-h-screen bg-background">
      <InsightsDashboard />
    </main>
  );
}