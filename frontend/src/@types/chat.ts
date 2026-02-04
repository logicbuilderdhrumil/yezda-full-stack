/**
 * Chat Types
 * Task 1.1: Define conversation and message data models
 */

// ============================================================================
// Conversation Types
// ============================================================================

/**
 * Participant in a conversation
 */
export interface ChatParticipant {
  id: string;
  name: string;
  avatarUrl?: string;
  role?: 'user' | 'admin' | 'candidate';
}

/**
 * Conversation model
 */
export interface Conversation {
  id: string;
  /** Display title (e.g., participant names or group name) */
  title: string;
  /** Participants in the conversation */
  participants: ChatParticipant[];
  /** Last message in the conversation, if any */
  lastMessage?: Message;
  /** Count of unread messages for the current user */
  unreadCount: number;
  /** Whether the conversation is a group chat */
  isGroup: boolean;
  /** Creation timestamp */
  createdAt: string;
  /** Last activity timestamp */
  updatedAt: string;
}

/**
 * Conversation list response from the API
 */
export interface ConversationListResponse {
  conversations: Conversation[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

// ============================================================================
// Message Types
// ============================================================================

/**
 * Message delivery status
 */
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

/**
 * Chat message model
 */
export interface Message {
  id: string;
  /** ID of the conversation this message belongs to */
  conversationId: string;
  /** Sender information */
  sender: ChatParticipant;
  /** Message content (text) */
  content: string;
  /** Delivery status */
  status: MessageStatus;
  /** Message creation timestamp */
  createdAt: string;
  /** Timestamp when the message was read (if applicable) */
  readAt?: string;
  /** Temporary client-side ID for optimistic updates */
  tempId?: string;
}

/**
 * Message list response from the API
 */
export interface MessageListResponse {
  messages: Message[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

/**
 * Request body for sending a new message
 */
export interface SendMessageRequest {
  conversationId: string;
  content: string;
}

/**
 * Response when a message is sent
 */
export interface SendMessageResponse {
  message: Message;
}

// ============================================================================
// Pagination / Filters
// ============================================================================

/**
 * Pagination options for conversations and messages
 */
export interface ChatPaginationOptions {
  limit?: number;
  cursor?: string;
}

/**
 * Filters for conversation list
 */
export interface ConversationFilters {
  /** Filter by participant ID */
  participantId?: string;
  /** Search by title or participant name */
  search?: string;
}

// ============================================================================
// Socket Event Types
// ============================================================================

/**
 * Payload for new message socket event
 */
export interface NewMessagePayload {
  message: Message;
}

/**
 * Payload for message status update socket event
 */
export interface MessageStatusUpdatePayload {
  messageId: string;
  conversationId: string;
  status: MessageStatus;
}

/**
 * Payload for conversation update socket event
 */
export interface ConversationUpdatePayload {
  conversation: Conversation;
}
