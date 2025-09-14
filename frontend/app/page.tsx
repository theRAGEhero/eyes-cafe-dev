import { Metadata } from 'next';
import { Dashboard } from '@/components/dashboard/Dashboard';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Eyes Café conversation intelligence dashboard',
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <Dashboard />
    </main>
  );
}