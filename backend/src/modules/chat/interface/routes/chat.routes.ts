/**
 * Chat Routes
 */
import { Router } from 'express';
import type { ChatController } from '../controllers/chat.controller.js';
import { requireAuthGuard, validateBody, validateQuery, validateParams } from '../../../../shared/infrastructure/middleware/index.js';
import {
  createConversationSchema,
  sendMessageSchema,
  listConversationsQuerySchema,
  listMessagesQuerySchema,
  conversationIdParamSchema,
  idParamSchema,
} from '../validators/chat.validators.js';
import { chatRateLimiter, messageSendRateLimiter } from '../middleware/chat-rate-limit.middleware.js';

export function createChatRoutes(controller: ChatController): Router {
  const router = Router();

  router.use(requireAuthGuard);
  router.use(chatRateLimiter);

  router.post('/conversations', validateBody(createConversationSchema), controller.createConversation);
  router.get('/conversations', validateQuery(listConversationsQuerySchema), controller.listConversations);
  router.get('/conversations/:conversationId/messages', validateParams(conversationIdParamSchema), validateQuery(listMessagesQuerySchema), controller.getThread);
  router.post('/conversations/:conversationId/messages', messageSendRateLimiter, validateParams(conversationIdParamSchema), validateBody(sendMessageSchema), controller.sendMessage);
  router.patch('/conversations/:conversationId/archive', validateParams(conversationIdParamSchema), controller.archiveConversation);
  router.patch('/messages/:id/delivered', validateParams(idParamSchema), controller.markMessageDelivered);
  router.patch('/messages/:id/read', validateParams(idParamSchema), controller.markMessageRead);

  return router;
}
