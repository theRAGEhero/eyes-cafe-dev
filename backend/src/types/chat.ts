export type ChatScope = 'global' | 'session' | 'table';

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: ChatSource[];
  createdAt: string;
}

export interface ChatSource {
  type: 'transcription' | 'analysis' | 'bias_detection';
  sessionId: string;
  tableId?: number;
  speakerId?: number;
  timestamp?: number;
  excerpt: string;
  url: string;
}

export interface ChatConversation {
  id: string;
  sessionId?: string;
  tableId?: number;
  scope: ChatScope;
  createdAt: string;
  messages: ChatMessage[];
}

export interface SearchResult {
  content: string;
  metadata: {
    sessionId: string;
    tableId?: number;
    speakerId?: number;
    timestamp?: number;
    documentType: string;
  };
  similarity: number;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
  scope: ChatScope;
  sessionId?: string;
  tableId?: number;
}

export interface ChatResponse {
  message: ChatMessage;
  conversationId: string;
  streaming?: boolean;
}