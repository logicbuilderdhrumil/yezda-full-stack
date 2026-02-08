/**
 * Chat Validators — Zod schemas
 */
import { z } from 'zod';

export const createConversationSchema = z.object({
  title: z.string().max(255).optional(),
  participantIds: z.array(
    z.object({
      userId: z.string().uuid(),
      userType: z.enum(['user', 'candidate']),
      role: z.enum(['owner', 'admin', 'member', 'observer']).optional(),
    }),
  ).min(1).max(100),
  metadata: z.record(z.unknown()).optional(),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(10000),
  contentType: z.enum(['text', 'file', 'system']).optional().default('text'),
  attachmentId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const listConversationsQuerySchema = z.object({
  status: z.enum(['active', 'archived', 'closed']).optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  cursor: z.string().optional(),
});

export const listMessagesQuerySchema = z.object({
  since: z.string().datetime().optional(),
  before: z.string().datetime().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  cursor: z.string().optional(),
});

export const idParamSchema = z.object({ id: z.string().uuid() });
export const conversationIdParamSchema = z.object({ conversationId: z.string().uuid() });
