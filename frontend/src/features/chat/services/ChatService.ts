/**
 * Chat Service
 * Integration layer for chat and messaging operations.
 */

import { ApiService } from '@/services/ApiService';
import type {
  ConversationDTO,
  MessageDTO,
  SendMessageRequest,
  ResponseMeta,
} from '@/@types/contracts';

/** Message list options. */
export interface MessageListOptions {
  limit?: number;
  before?: string;
  after?: string;
}

/**
 * ChatService provides methods for chat operations.
 */
export const ChatService = {
  /**
   * Lists conversations.
   */
  async listConversations(options?: {
    limit?: number;
    offset?: number;
  }): Promise<{ conversations: ConversationDTO[]; meta: ResponseMeta }> {
    const response = await ApiService.get<{
      conversations: ConversationDTO[];
      meta: ResponseMeta;
    }>('chat.conversations', { params: options });
    return response.data;
  },

  /**
   * Gets a conversation by ID.
   */
  async getConversation(conversationId: string): Promise<ConversationDTO> {
    const response = await ApiService.get<ConversationDTO>('chat.conversation', {
      pathParams: { id: conversationId },
    });
    return response.data;
  },

  /**
   * Gets messages for a conversation.
   */
  async getMessages(
    conversationId: string,
    options?: MessageListOptions
  ): Promise<{ messages: MessageDTO[]; meta: ResponseMeta }> {
    const response = await ApiService.get<{ messages: MessageDTO[]; meta: ResponseMeta }>(
      'chat.messages',
      {
        pathParams: { id: conversationId },
        params: options,
      }
    );
    return response.data;
  },

  /**
   * Sends a message in a conversation.
   */
  async sendMessage(
    conversationId: string,
    data: SendMessageRequest
  ): Promise<MessageDTO> {
    const response = await ApiService.post<MessageDTO>('chat.send', data, {
      pathParams: { id: conversationId },
    });
    return response.data;
  },

  /**
   * Marks a conversation as read.
   */
  async markAsRead(conversationId: string): Promise<void> {
    await ApiService.post<void>('chat.markRead', undefined, {
      pathParams: { id: conversationId },
    });
  },

  /**
   * Gets unread message count across all conversations.
   */
  async getUnreadCount(): Promise<number> {
    const { conversations } = await this.listConversations({ limit: 100 });
    return conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  },
};
