import { Metadata } from 'next';
import { SessionsList } from '@/components/sessions/SessionsList';

export const metadata: Metadata = {
  title: 'Sessions - Eyes Café',
  description: 'Manage and analyze World Café conversation sessions',
};

export default function SessionsPage() {
  return (
    <main className="min-h-screen bg-background">
      <SessionsList />
    </main>
  );
}