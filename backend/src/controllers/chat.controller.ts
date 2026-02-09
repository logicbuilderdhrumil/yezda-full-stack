/**
 * Chat Controller
 * Task 1.2, 1.3: Chat endpoint handlers
 * Task 1.5: Tenant scoping in handlers
 */

import type { Request, Response } from 'express';
import { chatService } from '../services/chat.service.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import type {
  ConversationFilters,
  MessageFilters,
  ChatPaginationOptions,
} from '../models/chat.model.js';

/**
 * Get client info from request for audit logging
 */
function getClientInfo(req: Request) {
  return {
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
    channel: (req.get('x-channel') || 'api') as 'web' | 'mobile' | 'api',
  };
}

/**
 * Extract tenant ID from authenticated user context.
 * Tenant must come from verified auth claims, never client headers.
 */
function getTenantId(req: AuthenticatedRequest): string {
  return req.user?.sub ?? 'default';
}

/**
 * POST /api/v1/chat/conversations
 * Create a new conversation
 */
export async function createConversation(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const tenantId = getTenantId(req);
  const clientInfo = getClientInfo(req);

  const result = await chatService.createConversation(
    {
      tenantId,
      title: req.body.title,
      participantIds: req.body.participantIds,
      metadata: req.body.metadata,
    },
    req.user.sub,
    req.user.type,
    clientInfo
  );

  if (!result.success) {
    res.status(500).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(201).json(result.data);
}

/**
 * GET /api/v1/chat/conversations
 * List conversations for the authenticated user
 */
export async function listConversations(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const tenantId = getTenantId(req);
  const clientInfo = getClientInfo(req);

  const filters: ConversationFilters = {};
  if (req.query.status) {
    filters.status = req.query.status as ConversationFilters['status'];
  }

  const pagination: ChatPaginationOptions = {};
  if (req.query.limit) {
    pagination.limit = parseInt(req.query.limit as string, 10);
  }
  if (req.query.cursor) {
    pagination.cursor = req.query.cursor as string;
  }

  const result = await chatService.listConversations(
    tenantId,
    req.user.sub,
    req.user.type,
    filters,
    pagination,
    clientInfo
  );

  if (!result.success) {
    res.status(500).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json({
    conversations: result.data.conversations,
    meta: { total: result.data.total },
  });
}

/**
 * GET /api/v1/chat/conversations/:conversationId/messages
 * Get message thread for a conversation
 */
export async function getThread(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const tenantId = getTenantId(req);
  const clientInfo = getClientInfo(req);
  const { conversationId } = req.params;

  const filters: MessageFilters = {};
  if (req.query.since) {
    filters.since = new Date(req.query.since as string);
  }
  if (req.query.before) {
    filters.before = new Date(req.query.before as string);
  }

  const pagination: ChatPaginationOptions = {};
  if (req.query.limit) {
    pagination.limit = parseInt(req.query.limit as string, 10);
  }
  if (req.query.cursor) {
    pagination.cursor = req.query.cursor as string;
  }

  const result = await chatService.getThread(
    conversationId,
    tenantId,
    req.user.sub,
    req.user.type,
    filters,
    pagination,
    clientInfo
  );

  if (!result.success) {
    const status = result.errorCode === 'CONVERSATION_NOT_FOUND' ? 404 : 500;
    res.status(status).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json({
    messages: result.data.messages,
    meta: { total: result.data.total },
  });
}

/**
 * POST /api/v1/chat/conversations/:conversationId/messages
 * Send a message to a conversation
 */
export async function sendMessage(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const tenantId = getTenantId(req);
  const clientInfo = getClientInfo(req);
  const { conversationId } = req.params;

  const result = await chatService.sendMessage(
    {
      conversationId,
      tenantId,
      senderId: req.user.sub,
      senderType: req.user.type,
      content: req.body.content,
      contentType: req.body.contentType,
      attachmentId: req.body.attachmentId,
      metadata: req.body.metadata,
    },
    clientInfo
  );

  if (!result.success) {
    const status = result.errorCode === 'CONVERSATION_NOT_FOUND' ? 404 : 500;
    res.status(status).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(201).json(result.data);
}

/**
 * PATCH /api/v1/chat/messages/:id/delivered
 * Mark a message as delivered
 */
export async function markMessageDelivered(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const tenantId = getTenantId(req);
  const clientInfo = getClientInfo(req);
  const { id } = req.params;

  const result = await chatService.markMessageDelivered(
    id,
    tenantId,
    req.user.sub,
    req.user.type,
    clientInfo
  );

  if (!result.success) {
    const status = result.errorCode === 'MESSAGE_NOT_FOUND' ? 404 : 500;
    res.status(status).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

/**
 * PATCH /api/v1/chat/messages/:id/read
 * Mark a message as read
 */
export async function markMessageRead(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const tenantId = getTenantId(req);
  const clientInfo = getClientInfo(req);
  const { id } = req.params;

  const result = await chatService.markMessageRead(
    id,
    tenantId,
    req.user.sub,
    req.user.type,
    clientInfo
  );

  if (!result.success) {
    const status = result.errorCode === 'MESSAGE_NOT_FOUND' ? 404 : 500;
    res.status(status).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

/**
 * PATCH /api/v1/chat/conversations/:conversationId/archive
 * Archive a conversation
 */
export async function archiveConversation(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const tenantId = getTenantId(req);
  const clientInfo = getClientInfo(req);
  const { conversationId } = req.params;

  const result = await chatService.archiveConversation(
    conversationId,
    tenantId,
    req.user.sub,
    req.user.type,
    clientInfo
  );

  if (!result.success) {
    let status = 500;
    if (result.errorCode === 'CONVERSATION_NOT_FOUND') status = 404;
    if (result.errorCode === 'INSUFFICIENT_PERMISSIONS') status = 403;
    res.status(status).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}
