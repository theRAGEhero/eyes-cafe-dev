import { logger } from '@/utils/logger';
import { prisma } from '@/utils/prisma';
import { vectorService } from './vectorService';
import { ChatScope, ChatMessage, ChatConversation, ChatSource, SearchResult, ChatRequest, ChatResponse } from '@/types/chat';
import { v4 as uuidv4 } from 'uuid';

/**
 * Chatbot Service with RAG capabilities
 */
export class ChatbotService {
  
  /**
   * Generate a chat response using RAG
   */
  async generateResponse(request: ChatRequest): Promise<ChatResponse> {
    try {
      logger.info(`Generating ${request.scope} chat response for: "${request.message.substring(0, 100)}..."`);

      // Get or create conversation
      let conversation = await this.getOrCreateConversation(
        request.conversationId,
        request.scope,
        request.sessionId,
        request.tableId
      );

      // Retrieve relevant context based on scope
      const context = await this.retrieveContext(
        request.message,
        request.scope,
        request.sessionId,
        request.tableId
      );

      // Generate response using LLM
      const responseContent = await this.generateLLMResponse(
        request.message,
        context,
        request.scope,
        conversation.messages
      );

      // Extract sources from context
      const sources = this.extractSources(context);

      // Create and store the response message
      const responseMessage: ChatMessage = {
        id: uuidv4(),
        conversationId: conversation.id,
        role: 'assistant',
        content: responseContent,
        sources,
        createdAt: new Date().toISOString(),
      };

      // Store both user message and assistant response
      await this.storeMessage({
        id: uuidv4(),
        conversationId: conversation.id,
        role: 'user',
        content: request.message,
        createdAt: new Date().toISOString(),
      });

      await this.storeMessage(responseMessage);

      return {
        message: responseMessage,
        conversationId: conversation.id,
      };
    } catch (error) {
      logger.error('Failed to generate chat response:', error);
      
      // Return error response
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        conversationId: request.conversationId || '',
        role: 'assistant',
        content: 'I apologize, but I encountered an error while processing your request. Please try again.',
        createdAt: new Date().toISOString(),
      };

      return {
        message: errorMessage,
        conversationId: request.conversationId || '',
      };
    }
  }

  /**
   * Retrieve relevant context based on chat scope
   */
  private async retrieveContext(
    query: string,
    scope: ChatScope,
    sessionId?: string,
    tableId?: number,
    limit: number = 5
  ): Promise<SearchResult[]> {
    switch (scope) {
      case 'global':
        return await vectorService.searchGlobal(query, limit);
      
      case 'session':
        if (!sessionId) {
          throw new Error('Session ID required for session-scoped chat');
        }
        return await vectorService.searchSession(sessionId, query, limit);
      
      case 'table':
        if (!sessionId || tableId === undefined) {
          throw new Error('Session ID and Table ID required for table-scoped chat');
        }
        return await vectorService.searchTable(sessionId, tableId, query, limit);
      
      default:
        throw new Error(`Unknown chat scope: ${scope}`);
    }
  }

  /**
   * Generate LLM response with context
   */
  private async generateLLMResponse(
    query: string,
    context: SearchResult[],
    scope: ChatScope,
    conversationHistory: ChatMessage[]
  ): Promise<string> {
    const systemPrompt = this.getSystemPrompt(scope);
    const contextText = context.map(r => `[${r.metadata.documentType}] ${r.content}`).join('\n\n');
    const historyText = conversationHistory
      .slice(-6) // Last 6 messages for context
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

    const prompt = `${systemPrompt}

## Context Information
${contextText}

## Conversation History
${historyText}

## User Query
${query}

Please provide a helpful response based on the context and conversation history. If you reference specific information, indicate which source it came from.`;

    // For now, return a mock response since we don't have LLM API set up
    if (!process.env.OPENAI_API_KEY && !process.env.GROQ_API_KEY && !process.env.ANTHROPIC_API_KEY) {
      return this.generateMockResponse(query, context, scope);
    }

    try {
      // Groq API integration (fast and affordable)
      if (process.env.GROQ_API_KEY) {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'openai/gpt-oss-120b', // High-capacity open-source model
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt }
            ],
            max_tokens: 500,
            temperature: 0.7,
          }),
        });

        if (!response.ok) {
          throw new Error(`Groq API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
      }
      
      // OpenAI GPT-4 integration (fallback)
      else if (process.env.OPENAI_API_KEY) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt }
            ],
            max_tokens: 500,
            temperature: 0.7,
          }),
        });

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
      }

      // Fallback to mock response
      return this.generateMockResponse(query, context, scope);
    } catch (error) {
      logger.error('LLM API call failed:', error);
      return this.generateMockResponse(query, context, scope);
    }
  }

  /**
   * Generate mock response for development
   */
  private generateMockResponse(query: string, context: SearchResult[], scope: ChatScope): string {
    const scopeText = scope === 'global' ? 'across all sessions' : 
                     scope === 'session' ? 'in this session' : 
                     'at this table';

    if (context.length === 0) {
      return `I don't have enough information ${scopeText} to answer your question about "${query}". Could you try asking something else or provide more context?`;
    }

    const hasTranscription = context.some(c => c.metadata.documentType === 'transcription');
    const hasAnalysis = context.some(c => c.metadata.documentType === 'analysis');

    let response = `Based on the available data ${scopeText}, I can provide some insights about "${query}".\n\n`;

    if (hasTranscription) {
      response += `From the conversation transcripts, I can see relevant discussions that touch on your question. `;
    }

    if (hasAnalysis) {
      response += `The analysis data also provides quantitative insights that might be helpful. `;
    }

    response += `\n\nWould you like me to elaborate on any specific aspect, or do you have a more specific question about the ${scope === 'table' ? 'table discussion' : scope === 'session' ? 'session' : 'platform data'}?`;

    return response;
  }

  /**
   * Get system prompt based on scope
   */
  private getSystemPrompt(scope: ChatScope): string {
    const basePrompt = `You are an AI assistant for the Eyes Café conversation analysis platform. You help users understand and analyze World Café conversations through data-driven insights.

Your responses should be:
- Concise and brief (keep responses short, 1-3 sentences max)
- Informative and based on the provided context
- Helpful for understanding conversation patterns and dynamics
- Professional but conversational in tone
- Accurate and cite sources when possible`;

    switch (scope) {
      case 'global':
        return `${basePrompt}

You have access to data from all sessions on the platform. Help users understand patterns across different conversations, compare sessions, and identify platform-wide trends.`;

      case 'session':
        return `${basePrompt}

You are focused on a specific World Café session. Help users understand the dynamics, participant interactions, speaking patterns, and key insights from this particular session.`;

      case 'table':
        return `${basePrompt}

You are focused on a specific table within a World Café session. Help users understand the conversation flow, participant dynamics, and key topics discussed at this particular table.`;

      default:
        return basePrompt;
    }
  }

  /**
   * Extract sources from search results
   */
  private extractSources(context: SearchResult[]): ChatSource[] {
    return context.map(result => ({
      type: result.metadata.documentType as 'transcription' | 'analysis' | 'bias_detection',
      sessionId: result.metadata.sessionId,
      tableId: result.metadata.tableId,
      speakerId: result.metadata.speakerId,
      timestamp: result.metadata.timestamp,
      excerpt: result.content.substring(0, 100) + (result.content.length > 100 ? '...' : ''),
      url: this.generateSourceUrl(result.metadata)
    }));
  }

  /**
   * Generate URL for source citation
   */
  private generateSourceUrl(metadata: any): string {
    if (metadata.documentType === 'transcription') {
      return `/sessions/${metadata.sessionId}#table-${metadata.tableId}`;
    } else if (metadata.documentType === 'analysis') {
      return `/sessions/${metadata.sessionId}/analysis`;
    }
    return `/sessions/${metadata.sessionId}`;
  }

  /**
   * Get or create conversation
   */
  private async getOrCreateConversation(
    conversationId?: string,
    scope?: ChatScope,
    sessionId?: string,
    tableId?: number
  ): Promise<ChatConversation> {
    if (conversationId) {
      // Try to get existing conversation
      const existing = await this.getConversation(conversationId);
      if (existing) {
        return existing;
      }
    }

    // Create new conversation
    const newConversation: ChatConversation = {
      id: uuidv4(),
      sessionId,
      tableId,
      scope: scope || 'global',
      createdAt: new Date().toISOString(),
      messages: [],
    };

    await this.storeConversation(newConversation);
    return newConversation;
  }

  /**
   * Get conversation from database
   */
  async getConversation(conversationId: string): Promise<ChatConversation | null> {
    try {
      // For now, return mock conversation since we haven't set up the database tables yet
      logger.info(`Retrieved conversation ${conversationId}`);
      
      return {
        id: conversationId,
        scope: 'global',
        createdAt: new Date().toISOString(),
        messages: [],
      };
    } catch (error) {
      logger.error('Failed to get conversation:', error);
      return null;
    }
  }

  /**
   * Store conversation in database
   */
  private async storeConversation(conversation: ChatConversation): Promise<void> {
    try {
      // Mock storage for now
      logger.info(`Stored conversation ${conversation.id} with scope ${conversation.scope}`);
    } catch (error) {
      logger.error('Failed to store conversation:', error);
    }
  }

  /**
   * Store message in database
   */
  private async storeMessage(message: ChatMessage): Promise<void> {
    try {
      // Mock storage for now
      logger.info(`Stored ${message.role} message in conversation ${message.conversationId}`);
    } catch (error) {
      logger.error('Failed to store message:', error);
    }
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(conversationId: string): Promise<ChatMessage[]> {
    try {
      // Mock history for now
      return [];
    } catch (error) {
      logger.error('Failed to get conversation history:', error);
      return [];
    }
  }
}

// Export singleton instance
export const chatbotService = new ChatbotService();