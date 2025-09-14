import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ChatWidget } from '@/components/chat/ChatWidget';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Eyes Café - Conversation Intelligence',
    template: '%s | Eyes Café'
  },
  description: 'Advanced conversation analysis platform for World Café sessions. Analyze speaking patterns, detect bias, measure polarization, and gain predictive insights.',
  keywords: [
    'conversation analysis',
    'World Café',
    'bias detection',
    'polarization analysis',
    'speaking patterns',
    'AI insights',
    'conversation intelligence'
  ],
  authors: [{ name: 'Eyes Café Development Team' }],
  creator: 'Eyes Café Platform',
  publisher: 'Eyes Café',
  robots: {
    index: false, // Private beta
    follow: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://eyes-cafe.democracyroutes.com',
    siteName: 'Eyes Café',
    title: 'Eyes Café - Conversation Intelligence Platform',
    description: 'Advanced AI-powered analysis for World Café discussions',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Eyes Café - Conversation Intelligence',
    description: 'Advanced AI-powered analysis for World Café discussions',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0ea5e9' },
    { media: '(prefers-color-scheme: dark)', color: '#0284c7' }
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={inter.className}>
        <div className="relative flex min-h-screen flex-col">
          <div className="flex-1">
            {children}
          </div>
          <ChatWidget />
        </div>
      </body>
    </html>
  );
}