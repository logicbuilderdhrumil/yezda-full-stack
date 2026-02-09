/**
 * Chat Domain Entities
 *
 * Pure types — no framework or infrastructure dependencies.
 */

// ── Value Types ───────────────────────────────────────────────────────────────

/** Conversation status */
export type ConversationStatus = 'active' | 'archived' | 'closed';

/** Message status */
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

/** Participant role within a conversation */
export type ParticipantRole = 'owner' | 'admin' | 'member' | 'observer';

/** Message content type */
export type MessageContentType = 'text' | 'file' | 'system';

/** Chat audit event types */
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

// ── Entities ──────────────────────────────────────────────────────────────────

/** Participant in a conversation */
export interface Participant {
  userId: string;
  userType: 'user' | 'candidate';
  role: ParticipantRole;
  joinedAt: Date;
  leftAt?: Date;
  muted?: boolean;
}

/** Conversation entity */
export interface Conversation {
  id: string;
  tenantId: string;
  title?: string;
  status: ConversationStatus;
  participants: Participant[];
  createdAt: Date;
  updatedAt: Date;
  lastMessage?: {
    content: string;
    senderId: string;
    sentAt: Date;
  };
  metadata?: Record<string, unknown>;
}

/** Message entity */
export interface Message {
  id: string;
  conversationId: string;
  tenantId: string;
  senderId: string;
  senderType: 'user' | 'candidate' | 'system';
  content: string;
  contentType: MessageContentType;
  status: MessageStatus;
  createdAt: Date;
  deliveredAt?: Date;
  readBy?: Record<string, Date>;
  attachmentId?: string;
  metadata?: Record<string, unknown>;
  expiresAt?: Date;
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

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

export interface ConversationFilters {
  status?: ConversationStatus;
  participantId?: string;
}

export interface MessageFilters {
  since?: Date;
  before?: Date;
  senderId?: string;
}

export interface ChatPaginationOptions {
  limit?: number;
  cursor?: string;
}

// ── Result Types ──────────────────────────────────────────────────────────────

export interface ConversationListResult {
  conversations: Conversation[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

export interface MessageListResult {
  messages: Message[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

// ── Operation Result ──────────────────────────────────────────────────────────

export interface ChatOperationResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

// ── Context ───────────────────────────────────────────────────────────────────

export interface ChatContext {
  actorId: string;
  actorType: 'user' | 'candidate';
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
  channel: 'web' | 'mobile' | 'api' | 'socket';
}

// ── Retention Policy ──────────────────────────────────────────────────────────

export const CHAT_RETENTION = {
  DEFAULT_RETENTION_DAYS: 365,
  ARCHIVED_RETENTION_DAYS: 730,
  MAX_RETENTION_DAYS: 2555,
  MIN_RETENTION_DAYS: 30,
} as const;

export function getChatRetentionDays(status: ConversationStatus): number {
  switch (status) {
    case 'archived':
      return CHAT_RETENTION.ARCHIVED_RETENTION_DAYS;
    default:
      return CHAT_RETENTION.DEFAULT_RETENTION_DAYS;
  }
}

export function calculateMessageExpirationDate(
  status: ConversationStatus,
  ttlDays?: number,
): Date {
  const retentionDays = ttlDays ?? getChatRetentionDays(status);
  const clampedDays = Math.min(
    Math.max(retentionDays, CHAT_RETENTION.MIN_RETENTION_DAYS),
    CHAT_RETENTION.MAX_RETENTION_DAYS,
  );
  return new Date(Date.now() + clampedDays * 24 * 60 * 60 * 1000);
}
