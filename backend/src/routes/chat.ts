import express from 'express';
import { asyncHandler, CustomError } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';
import { chatbotService } from '@/services/chatbotService';
import { ChatRequest, ChatResponse } from '@/types/chat';
import { ApiResponse } from '@/types';

const router = express.Router();

// Root endpoint - Chat API documentation
router.get('/', asyncHandler(async (req, res) => {
  const response: ApiResponse<any> = {
    success: true,
    data: {
      service: 'Chat API',
      version: '1.0.0',
      endpoints: [
        'POST /chat - Chat with AI assistant',
        'GET /conversations/:conversationId - Get conversation history',
        'DELETE /conversations/:conversationId - Clear conversation history'
      ],
      scopes: ['general', 'session', 'table']
    },
    timestamp: new Date().toISOString(),
  };
  res.json(response);
}));

// Chat endpoint - handles all scope types
router.post('/chat', asyncHandler(async (req, res) => {
  const { message, conversationId, scope, sessionId, tableId }: ChatRequest = req.body;

  if (!message || !scope) {
    throw new CustomError('Message and scope are required', 400);
  }

  if (scope === 'session' && !sessionId) {
    throw new CustomError('Session ID is required for session-scoped chat', 400);
  }

  if (scope === 'table' && (!sessionId || tableId === undefined)) {
    throw new CustomError('Session ID and Table ID are required for table-scoped chat', 400);
  }

  logger.info(`Processing ${scope} chat request: "${message.substring(0, 50)}..."`);

  const startTime = Date.now();
  
  const chatResponse = await chatbotService.generateResponse({
    message,
    conversationId,
    scope,
    sessionId,
    tableId,
  });

  const processingTime = Date.now() - startTime;
  
  logger.info(`Chat response generated in ${processingTime}ms`);

  const response: ApiResponse<ChatResponse> = {
    success: true,
    data: chatResponse,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
}));

// Global chat shortcut
router.post('/global', asyncHandler(async (req, res) => {
  const { message, conversationId } = req.body;

  if (!message) {
    throw new CustomError('Message is required', 400);
  }

  const chatResponse = await chatbotService.generateResponse({
    message,
    conversationId,
    scope: 'global',
  });

  const response: ApiResponse<ChatResponse> = {
    success: true,
    data: chatResponse,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
}));

// Session chat shortcut
router.post('/session/:sessionId', asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { message, conversationId } = req.body;

  if (!message) {
    throw new CustomError('Message is required', 400);
  }

  const chatResponse = await chatbotService.generateResponse({
    message,
    conversationId,
    scope: 'session',
    sessionId,
  });

  const response: ApiResponse<ChatResponse> = {
    success: true,
    data: chatResponse,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
}));

// Table chat shortcut
router.post('/table/:sessionId/:tableId', asyncHandler(async (req, res) => {
  const { sessionId, tableId } = req.params;
  const { message, conversationId } = req.body;

  if (!message) {
    throw new CustomError('Message is required', 400);
  }

  const chatResponse = await chatbotService.generateResponse({
    message,
    conversationId,
    scope: 'table',
    sessionId,
    tableId: parseInt(tableId),
  });

  const response: ApiResponse<ChatResponse> = {
    success: true,
    data: chatResponse,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
}));

// Get conversation history
router.get('/conversation/:conversationId', asyncHandler(async (req, res) => {
  const { conversationId } = req.params;

  logger.info(`Fetching conversation history for ${conversationId}`);

  const conversation = await chatbotService.getConversation(conversationId);
  
  if (!conversation) {
    throw new CustomError('Conversation not found', 404);
  }

  const response: ApiResponse<any> = {
    success: true,
    data: {
      conversation,
      messageCount: conversation.messages.length,
    },
    timestamp: new Date().toISOString(),
  };

  res.json(response);
}));

// Get conversation messages
router.get('/conversation/:conversationId/messages', asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;

  logger.info(`Fetching messages for conversation ${conversationId}, page ${page}`);

  const messages = await chatbotService.getConversationHistory(conversationId);

  // Simple pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedMessages = messages.slice(startIndex, endIndex);

  const response: ApiResponse<any> = {
    success: true,
    data: {
      messages: paginatedMessages,
      pagination: {
        page,
        limit,
        total: messages.length,
        totalPages: Math.ceil(messages.length / limit),
        hasNext: endIndex < messages.length,
        hasPrev: page > 1,
      },
    },
    timestamp: new Date().toISOString(),
  };

  res.json(response);
}));

// Health check for chat service
router.get('/health', asyncHandler(async (req, res) => {
  logger.info('Chat service health check');

  const response: ApiResponse<any> = {
    success: true,
    data: {
      status: 'healthy',
      features: {
        vectorSearch: true,
        llmIntegration: !!process.env.OPENAI_API_KEY || !!process.env.ANTHROPIC_API_KEY,
        scopes: ['global', 'session', 'table'],
      },
    },
    timestamp: new Date().toISOString(),
  };

  res.json(response);
}));

export default router;