/**
 * Chat Models
 * Task 1.1: Define conversation and message models
 */

import { z } from 'zod';

/** Conversation status */
export type ConversationStatus = 'active' | 'archived' | 'closed';

/** Message status */
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

/** Participant role within a conversation */
export type ParticipantRole = 'owner' | 'admin' | 'member' | 'observer';

/** Message content type */
export type MessageContentType = 'text' | 'file' | 'system';

/**
 * Participant in a conversation
 */
export interface Participant {
  /** User ID of the participant */
  userId: string;
  /** Participant type */
  userType: 'user' | 'candidate';
  /** Role within the conversation */
  role: ParticipantRole;
  /** When the participant joined */
  joinedAt: Date;
  /** When the participant left (if applicable) */
  leftAt?: Date;
  /** Whether the participant is muted */
  muted?: boolean;
}

/**
 * Conversation entity
 */
export interface Conversation {
  /** Unique conversation identifier */
  id: string;
  /** Tenant this conversation belongs to */
  tenantId: string;
  /** Optional title for the conversation */
  title?: string;
  /** Conversation status */
  status: ConversationStatus;
  /** List of participants */
  participants: Participant[];
  /** When the conversation was created */
  createdAt: Date;
  /** When the conversation was last updated */
  updatedAt: Date;
  /** Last message preview */
  lastMessage?: {
    content: string;
    senderId: string;
    sentAt: Date;
  };
  /** Metadata for the conversation */
  metadata?: Record<string, unknown>;
}

/**
 * Message entity
 */
export interface Message {
  /** Unique message identifier */
  id: string;
  /** Conversation this message belongs to */
  conversationId: string;
  /** Tenant this message belongs to */
  tenantId: string;
  /** Sender user ID */
  senderId: string;
  /** Sender user type */
  senderType: 'user' | 'candidate' | 'system';
  /** Message content */
  content: string;
  /** Content type */
  contentType: MessageContentType;
  /** Message status */
  status: MessageStatus;
  /** When the message was created */
  createdAt: Date;
  /** When the message was delivered */
  deliveredAt?: Date;
  /** Read receipts - map of userId to timestamp */
  readBy?: Record<string, Date>;
  /** Optional file attachment reference */
  attachmentId?: string;
  /** Message metadata */
  metadata?: Record<string, unknown>;
  /** When the message expires (for auto-cleanup) */
  expiresAt?: Date;
}

/**
 * Input for creating a new conversation
 */
export interface CreateConversationInput {
  tenantId: string;
  title?: string;
  participantIds: Array<{
    userId: string;
    userType: 'user' | 'candidate';
    role?: ParticipantRole;
  }>;
  metadata?: Record<string, unknown>;
}

/**
 * Input for sending a message
 */
export interface SendMessageInput {
  conversationId: string;
  tenantId: string;
  senderId: string;
  senderType: 'user' | 'candidate';
  content: string;
  contentType?: MessageContentType;
  attachmentId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Filters for listing conversations
 */
export interface ConversationFilters {
  status?: ConversationStatus;
  participantId?: string;
}

/**
 * Filters for listing messages
 */
export interface MessageFilters {
  since?: Date;
  before?: Date;
  senderId?: string;
}

/**
 * Pagination options
 */
export interface ChatPaginationOptions {
  limit?: number;
  cursor?: string;
}

/**
 * Paginated conversation list result
 */
export interface ConversationListResult {
  conversations: Conversation[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

/**
 * Paginated message list result
 */
export interface MessageListResult {
  messages: Message[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

/**
 * Result for chat operations
 */
export interface ChatOperationResult {
  success: boolean;
  data?: Conversation | Message | ConversationListResult | MessageListResult | { count: number };
  error?: string;
  errorCode?: string;
}

/**
 * Chat audit event types
 */
export type ChatAuditEventType =
  | 'CONVERSATION_CREATED'
  | 'CONVERSATION_ACCESSED'
  | 'CONVERSATION_ACCESS_DENIED'
  | 'CONVERSATION_LIST_ACCESSED'
  | 'CONVERSATION_ARCHIVED'
  | 'CONVERSATION_CLOSED'
  | 'MESSAGE_SENT'
  | 'MESSAGE_SEND_FAILED'
  | 'MESSAGE_DELIVERED'
  | 'MESSAGE_READ'
  | 'PARTICIPANT_ADDED'
  | 'PARTICIPANT_REMOVED'
  | 'CHAT_RATE_LIMITED';

/**
 * Retention policy configuration for chat
 */
export const CHAT_RETENTION = {
  /** Default retention period in days */
  DEFAULT_RETENTION_DAYS: 365,
  /** Retention period for archived conversations */
  ARCHIVED_RETENTION_DAYS: 730,
  /** Maximum retention period allowed */
  MAX_RETENTION_DAYS: 2555, // ~7 years
  /** Minimum retention period allowed */
  MIN_RETENTION_DAYS: 30,
} as const;

/**
 * Get retention days based on conversation status
 */
export function getChatRetentionDays(status: ConversationStatus): number {
  switch (status) {
    case 'archived':
      return CHAT_RETENTION.ARCHIVED_RETENTION_DAYS;
    default:
      return CHAT_RETENTION.DEFAULT_RETENTION_DAYS;
  }
}

/**
 * Calculate message expiration date
 */
export function calculateMessageExpirationDate(
  status: ConversationStatus,
  ttlDays?: number
): Date {
  const retentionDays = ttlDays ?? getChatRetentionDays(status);
  const clampedDays = Math.min(
    Math.max(retentionDays, CHAT_RETENTION.MIN_RETENTION_DAYS),
    CHAT_RETENTION.MAX_RETENTION_DAYS
  );
  return new Date(Date.now() + clampedDays * 24 * 60 * 60 * 1000);
}

/**
 * Validation schemas for chat endpoints
 */
export const createConversationSchema = z.object({
  title: z.string().max(255).optional(),
  participantIds: z.array(
    z.object({
      userId: z.string().uuid(),
      userType: z.enum(['user', 'candidate']),
      role: z.enum(['owner', 'admin', 'member', 'observer']).optional(),
    })
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

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

export const conversationIdParamSchema = z.object({
  conversationId: z.string().uuid(),
});
