'use client';

import { useState, useCallback } from 'react';
import { ChatMessage, ChatRequest, ChatResponse, ChatScope, ChatState } from '@/types/chat';

export function useChat() {
  const [state, setState] = useState<ChatState>({
    isOpen: false,
    messages: [],
    isLoading: false,
    scope: 'global',
  });

  const openChat = useCallback((scope: ChatScope = 'global', sessionId?: string, tableId?: number) => {
    setState(prev => ({
      ...prev,
      isOpen: true,
      scope,
      sessionId,
      tableId,
    }));
  }, []);

  const closeChat = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;

    // Add user message to UI immediately
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      conversationId: state.currentConversation?.id || '',
      role: 'user',
      content: message,
      createdAt: new Date().toISOString(),
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
    }));

    try {
      const request: ChatRequest = {
        message,
        conversationId: state.currentConversation?.id,
        scope: state.scope,
        sessionId: state.sessionId,
        tableId: state.tableId,
      };

      const response = await fetch('http://localhost:3002/api/chat/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data: { success: boolean; data: ChatResponse } = await response.json();
      
      if (data.success) {
        setState(prev => ({
          ...prev,
          messages: [...prev.messages.slice(0, -1), userMessage, data.data.message],
          currentConversation: {
            id: data.data.conversationId,
            scope: prev.scope,
            sessionId: prev.sessionId,
            tableId: prev.tableId,
            createdAt: new Date().toISOString(),
            messages: [...prev.messages.slice(0, -1), userMessage, data.data.message],
          },
          isLoading: false,
        }));
      } else {
        throw new Error('API returned error');
      }
    } catch (error) {
      console.error('Chat error:', error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        conversationId: state.currentConversation?.id || '',
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        createdAt: new Date().toISOString(),
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages.slice(0, -1), userMessage, errorMessage],
        isLoading: false,
      }));
    }
  }, [state.currentConversation?.id, state.scope, state.sessionId, state.tableId]);

  const clearMessages = useCallback(() => {
    setState(prev => ({
      ...prev,
      messages: [],
      currentConversation: undefined,
    }));
  }, []);

  const changeScope = useCallback((scope: ChatScope, sessionId?: string, tableId?: number) => {
    setState(prev => ({
      ...prev,
      scope,
      sessionId,
      tableId,
      messages: [], // Clear messages when changing scope
      currentConversation: undefined,
    }));
  }, []);

  return {
    ...state,
    openChat,
    closeChat,
    sendMessage,
    clearMessages,
    changeScope,
  };
}