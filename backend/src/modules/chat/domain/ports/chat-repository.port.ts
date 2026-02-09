/**
 * Chat Repository Port
 */
import type {
  Conversation,
  Message,
  CreateConversationInput,
  SendMessageInput,
  ConversationFilters,
  MessageFilters,
  ChatPaginationOptions,
  ConversationStatus,
  MessageStatus,
} from '../entities/chat.entity.js';

export interface IChatRepository {
  createConversation(input: CreateConversationInput): Promise<Conversation>;
  findConversationById(id: string): Promise<Conversation | undefined>;
  findConversationByIdForTenant(id: string, tenantId: string): Promise<Conversation | undefined>;
  isParticipant(conversationId: string, userId: string, userType: 'user' | 'candidate'): Promise<boolean>;
  getParticipantRole(conversationId: string, userId: string, userType: 'user' | 'candidate'): Promise<string | undefined>;
  listConversationsForUser(
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate',
    filters: ConversationFilters,
    pagination: ChatPaginationOptions,
  ): Promise<{ conversations: Conversation[]; total: number }>;
  updateConversationStatus(id: string, status: ConversationStatus): Promise<Conversation | undefined>;
  addParticipant(
    conversationId: string,
    participant: { userId: string; userType: 'user' | 'candidate'; role?: string },
  ): Promise<Conversation | undefined>;
  removeParticipant(
    conversationId: string,
    userId: string,
    userType: 'user' | 'candidate',
  ): Promise<Conversation | undefined>;

  createMessage(input: SendMessageInput, expiresAt?: Date): Promise<Message>;
  findMessageById(id: string): Promise<Message | undefined>;
  listMessagesForConversation(
    conversationId: string,
    tenantId: string,
    filters: MessageFilters,
    pagination: ChatPaginationOptions,
  ): Promise<{ messages: Message[]; total: number }>;
  updateMessageStatus(id: string, status: MessageStatus, deliveredAt?: Date): Promise<Message | undefined>;
  markMessageAsRead(id: string, userId: string): Promise<Message | undefined>;
  cleanupExpiredMessages(): Promise<number>;
}
