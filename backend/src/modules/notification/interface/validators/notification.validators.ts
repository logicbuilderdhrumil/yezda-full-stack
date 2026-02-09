/**
 * Notification Validators — Zod schemas
 */
import { z } from 'zod';

export const listNotificationsQuerySchema = z.object({
  status: z.enum(['read', 'unread']).optional(),
  type: z.enum(['SYSTEM', 'APPLICATION', 'SCREENING', 'DOCUMENT', 'MESSAGE', 'SECURITY', 'REMINDER']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  since: z.string().datetime().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  cursor: z.string().optional(),
});

export const markManyAsReadSchema = z.object({
  ids: z.array(z.string().uuid()).optional(),
});

export const idParamSchema = z.object({ id: z.string().uuid() });
