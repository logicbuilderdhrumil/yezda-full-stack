/**
 * Chat Domain — barrel export
 */
export type {
  ConversationStatus,
  MessageStatus,
  ParticipantRole,
  MessageContentType,
  ChatAuditEventType,
  Participant,
  Conversation,
  Message,
  CreateConversationInput,
  SendMessageInput,
  ConversationFilters,
  MessageFilters,
  ChatPaginationOptions,
  ConversationListResult,
  MessageListResult,
  ChatOperationResult,
  ChatContext,
} from './entities/chat.entity.js';

export {
  CHAT_RETENTION,
  getChatRetentionDays,
  calculateMessageExpirationDate,
} from './entities/chat.entity.js';

export type { IChatRepository } from './ports/chat-repository.port.js';
export type { IAuditService } from './ports/audit-service.port.js';
export type { IMetricsService } from './ports/metrics-service.port.js';
export type { ISocketService } from './ports/socket-service.port.js';
