'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, 
  X, 
  Send, 
  Minimize2, 
  Globe, 
  Users, 
  User,
  ExternalLink,
  Loader2 
} from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { ChatScope } from '@/types/chat';

interface ChatWidgetProps {
  defaultScope?: ChatScope;
  sessionId?: string;
  tableId?: number;
  className?: string;
}

export function ChatWidget({ 
  defaultScope = 'global', 
  sessionId, 
  tableId,
  className = '' 
}: ChatWidgetProps) {
  const [inputMessage, setInputMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    isOpen,
    messages,
    isLoading,
    scope,
    openChat,
    closeChat,
    sendMessage,
    clearMessages,
    changeScope,
  } = useChat();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const handleSend = async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    const message = inputMessage;
    setInputMessage('');
    await sendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getScopeIcon = (currentScope: ChatScope) => {
    switch (currentScope) {
      case 'global': return <Globe className="h-4 w-4" />;
      case 'session': return <Users className="h-4 w-4" />;
      case 'table': return <User className="h-4 w-4" />;
    }
  };

  const getScopeLabel = (currentScope: ChatScope) => {
    switch (currentScope) {
      case 'global': return 'Global Chat';
      case 'session': return 'Session Chat';
      case 'table': return 'Table Chat';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => openChat(defaultScope, sessionId, tableId)}
        className={`fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-110 z-50 ${className}`}
        title="Open Chat Assistant"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-blue-600 text-white rounded-t-lg">
        <div className="flex items-center space-x-2">
          {getScopeIcon(scope)}
          <span className="font-medium">{getScopeLabel(scope)}</span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-blue-700 rounded"
            title={isMinimized ? 'Maximize' : 'Minimize'}
          >
            <Minimize2 className="h-4 w-4" />
          </button>
          <button
            onClick={closeChat}
            className="p-1 hover:bg-blue-700 rounded"
            title="Close chat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Scope Selector */}
          <div className="p-3 border-b bg-gray-50">
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-gray-600">Chat scope:</span>
              <select
                value={scope}
                onChange={(e) => changeScope(e.target.value as ChatScope, sessionId, tableId)}
                className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
              >
                <option value="global">Global - All Sessions</option>
                {sessionId && <option value="session">Session - Current Session</option>}
                {sessionId && tableId && <option value="table">Table - Current Table</option>}
              </select>
            </div>
          </div>

          {/* Messages */}
          <div className="h-80 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">
                  Ask me anything about the {scope === 'global' ? 'platform' : scope === 'session' ? 'session' : 'table'} data!
                </p>
                <p className="text-xs mt-1 text-gray-400">
                  I can help analyze conversations, identify patterns, and provide insights.
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  
                  {/* Sources */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-300 space-y-1">
                      <p className="text-xs font-medium text-gray-600">Sources:</p>
                      {message.sources.map((source, index) => (
                        <div key={index} className="text-xs">
                          <a
                            href={source.url}
                            className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <span>{source.type} - {source.excerpt}</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center mt-2">
                    <span className={`text-xs ${message.role === 'user' ? 'text-blue-200' : 'text-gray-500'}`}>
                      {formatTime(message.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                    <span className="text-sm text-gray-600">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Ask about ${scope === 'global' ? 'platform data' : scope === 'session' ? 'this session' : 'this table'}...`}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg px-4 py-2 transition-colors"
                title="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            
            {messages.length > 0 && (
              <button
                onClick={clearMessages}
                className="text-xs text-gray-500 hover:text-gray-700 mt-2"
              >
                Clear conversation
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}