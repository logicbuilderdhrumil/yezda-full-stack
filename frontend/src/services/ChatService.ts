/**
 * Chat Service
 * Task 1.5: Implement ChatService list/send methods
 */

import { ApiService } from '@/services/ApiService';
import type {
  Conversation,
  ConversationListResponse,
  ConversationFilters,
  ChatPaginationOptions,
  Message,
  MessageListResponse,
  SendMessageRequest,
  SendMessageResponse,
} from '@/@types/chat';

/**
 * Build query params from filters and pagination
 */
function buildQueryParams(
  filters?: ConversationFilters,
  pagination?: ChatPaginationOptions
): Record<string, string> {
  const params: Record<string, string> = {};

  if (filters?.participantId) {
    params.participantId = filters.participantId;
  }
  if (filters?.search) {
    params.search = filters.search;
  }
  if (pagination?.limit) {
    params.limit = String(pagination.limit);
  }
  if (pagination?.cursor) {
    params.cursor = pagination.cursor;
  }

  return params;
}

/**
 * ChatService handles all chat-related API operations.
 */
export const ChatService = {
  /**
   * List conversations for the authenticated user.
   * @param filters - Optional filters for search/participant
   * @param pagination - Optional pagination with limit and cursor
   * @returns Paginated list of conversations
   */
  async listConversations(
    filters?: ConversationFilters,
    pagination?: ChatPaginationOptions
  ): Promise<ConversationListResponse> {
    const params = buildQueryParams(filters, pagination);
    const response = await ApiService.get<ConversationListResponse>(
      'chat.conversations.list',
      { params }
    );
    return response.data;
  },

  /**
   * Get a specific conversation by ID.
   * @param id - Conversation ID
   * @returns The conversation
   */
  async getConversation(id: string): Promise<Conversation> {
    const response = await ApiService.get<Conversation>(
      'chat.conversations.get',
      { pathParams: { id } }
    );
    return response.data;
  },

  /**
   * List messages in a conversation.
   * @param conversationId - Conversation ID
   * @param pagination - Optional pagination with limit and cursor
   * @returns Paginated list of messages
   */
  async listMessages(
    conversationId: string,
    pagination?: ChatPaginationOptions
  ): Promise<MessageListResponse> {
    const params: Record<string, string> = {};
    if (pagination?.limit) {
      params.limit = String(pagination.limit);
    }
    if (pagination?.cursor) {
      params.cursor = pagination.cursor;
    }

    const response = await ApiService.get<MessageListResponse>(
      'chat.messages.list',
      { pathParams: { conversationId }, params }
    );
    return response.data;
  },

  /**
   * Send a message in a conversation.
   * @param conversationId - Conversation ID
   * @param content - Message content
   * @returns The sent message
   */
  async sendMessage(
    conversationId: string,
    content: string
  ): Promise<Message> {
    const body: SendMessageRequest = { conversationId, content };
    const response = await ApiService.post<SendMessageResponse>(
      'chat.messages.send',
      body
    );
    return response.data.message;
  },

  /**
   * Mark messages in a conversation as read.
   * @param conversationId - Conversation ID
   * @param messageIds - Optional array of message IDs to mark as read
   * @returns Count of marked messages
   */
  async markAsRead(
    conversationId: string,
    messageIds?: string[]
  ): Promise<{ count: number }> {
    const body = messageIds ? { messageIds } : {};
    const response = await ApiService.post<{ count: number }>(
      'chat.messages.markAsRead',
      body,
      { pathParams: { conversationId } }
    );
    return response.data;
  },
};
