/**
 * Chat Routes
 * Task 1.2, 1.3: Chat API endpoints
 * Task 1.5: Tenant scoping via auth middleware
 * Task 1.7: Rate limiting for chat endpoints
 */

import { Router } from 'express';
import * as chatController from '../controllers/chat.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  chatRateLimiter,
  messageSendRateLimiter,
} from '../middleware/chat-rate-limit.middleware.js';
import {
  validateQuery,
  validateBody,
  validateParams,
} from '../middleware/validation.middleware.js';
import {
  createConversationSchema,
  sendMessageSchema,
  listConversationsQuerySchema,
  listMessagesQuerySchema,
  conversationIdParamSchema,
  idParamSchema,
} from '../models/chat.model.js';

const router = Router();

// All chat endpoints require authentication
router.use(requireAuth);

// Apply general chat rate limiting
router.use(chatRateLimiter);

/**
 * POST /api/v1/chat/conversations
 * Create a new conversation
 */
router.post(
  '/conversations',
  validateBody(createConversationSchema),
  chatController.createConversation
);

/**
 * GET /api/v1/chat/conversations
 * List conversations for the authenticated user
 */
router.get(
  '/conversations',
  validateQuery(listConversationsQuerySchema),
  chatController.listConversations
);

/**
 * GET /api/v1/chat/conversations/:conversationId/messages
 * Get message thread for a conversation
 */
router.get(
  '/conversations/:conversationId/messages',
  validateParams(conversationIdParamSchema),
  validateQuery(listMessagesQuerySchema),
  chatController.getThread
);

/**
 * POST /api/v1/chat/conversations/:conversationId/messages
 * Send a message to a conversation
 * Note: Uses stricter rate limiting for message send
 */
router.post(
  '/conversations/:conversationId/messages',
  messageSendRateLimiter,
  validateParams(conversationIdParamSchema),
  validateBody(sendMessageSchema),
  chatController.sendMessage
);

/**
 * PATCH /api/v1/chat/conversations/:conversationId/archive
 * Archive a conversation
 */
router.patch(
  '/conversations/:conversationId/archive',
  validateParams(conversationIdParamSchema),
  chatController.archiveConversation
);

/**
 * PATCH /api/v1/chat/messages/:id/delivered
 * Mark a message as delivered
 */
router.patch(
  '/messages/:id/delivered',
  validateParams(idParamSchema),
  chatController.markMessageDelivered
);

/**
 * PATCH /api/v1/chat/messages/:id/read
 * Mark a message as read
 */
router.patch(
  '/messages/:id/read',
  validateParams(idParamSchema),
  chatController.markMessageRead
);

export default router;
