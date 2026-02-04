/**
 * Chat Service Tests
 * Task 1.5: Tests for ChatService list/send methods
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatService } from './ChatService';
import { ApiService } from '@/services/ApiService';
import type {
  Conversation,
  ConversationListResponse,
  Message,
  MessageListResponse,
  SendMessageResponse,
} from '@/@types/chat';
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

vi.mock('@/services/ApiService');

const mockApiService = vi.mocked(ApiService, true);

/** Helper to create a mock AxiosResponse */
function mockAxiosResponse<T>(data: T): AxiosResponse<T> {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as InternalAxiosRequestConfig,
  };
}

describe('ChatService', () => {
  const mockConversation: Conversation = {
    id: 'conv-1',
    title: 'Test Conversation',
    participants: [
      { id: 'user-1', name: 'User 1' },
      { id: 'user-2', name: 'User 2' },
    ],
    unreadCount: 0,
    isGroup: false,
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-02-04T00:00:00Z',
  };

  const mockMessage: Message = {
    id: 'msg-1',
    conversationId: 'conv-1',
    sender: { id: 'user-1', name: 'User 1' },
    content: 'Hello',
    status: 'sent',
    createdAt: '2026-02-04T10:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listConversations', () => {
    it('should list conversations without filters', async () => {
      const mockResponse: ConversationListResponse = {
        conversations: [mockConversation],
        total: 1,
        hasMore: false,
      };
      mockApiService.get.mockResolvedValue(mockAxiosResponse(mockResponse));

      const result = await ChatService.listConversations();

      expect(mockApiService.get).toHaveBeenCalledWith('chat.conversations.list', {
        params: {},
      });
      expect(result.conversations).toHaveLength(1);
    });

    it('should list conversations with filters and pagination', async () => {
      const mockResponse: ConversationListResponse = {
        conversations: [],
        total: 0,
        hasMore: false,
      };
      mockApiService.get.mockResolvedValue(mockAxiosResponse(mockResponse));

      await ChatService.listConversations(
        { search: 'test', participantId: 'user-1' },
        { limit: 10, cursor: 'abc123' }
      );

      expect(mockApiService.get).toHaveBeenCalledWith('chat.conversations.list', {
        params: {
          search: 'test',
          participantId: 'user-1',
          limit: '10',
          cursor: 'abc123',
        },
      });
    });
  });

  describe('getConversation', () => {
    it('should get a conversation by ID', async () => {
      mockApiService.get.mockResolvedValue(mockAxiosResponse(mockConversation));

      const result = await ChatService.getConversation('conv-1');

      expect(mockApiService.get).toHaveBeenCalledWith('chat.conversations.get', {
        pathParams: { id: 'conv-1' },
      });
      expect(result.id).toBe('conv-1');
    });
  });

  describe('listMessages', () => {
    it('should list messages in a conversation', async () => {
      const mockResponse: MessageListResponse = {
        messages: [mockMessage],
        total: 1,
        hasMore: false,
      };
      mockApiService.get.mockResolvedValue(mockAxiosResponse(mockResponse));

      const result = await ChatService.listMessages('conv-1');

      expect(mockApiService.get).toHaveBeenCalledWith('chat.messages.list', {
        pathParams: { conversationId: 'conv-1' },
        params: {},
      });
      expect(result.messages).toHaveLength(1);
    });

    it('should list messages with pagination', async () => {
      const mockResponse: MessageListResponse = {
        messages: [],
        total: 0,
        hasMore: false,
      };
      mockApiService.get.mockResolvedValue(mockAxiosResponse(mockResponse));

      await ChatService.listMessages('conv-1', { limit: 20, cursor: 'xyz' });

      expect(mockApiService.get).toHaveBeenCalledWith('chat.messages.list', {
        pathParams: { conversationId: 'conv-1' },
        params: { limit: '20', cursor: 'xyz' },
      });
    });
  });

  describe('sendMessage', () => {
    it('should send a message', async () => {
      const mockResponse: SendMessageResponse = {
        message: {
          ...mockMessage,
          id: 'msg-new',
          content: 'Hello!',
        },
      };
      mockApiService.post.mockResolvedValue(mockAxiosResponse(mockResponse));

      const result = await ChatService.sendMessage('conv-1', 'Hello!');

      expect(mockApiService.post).toHaveBeenCalledWith('chat.messages.send', {
        conversationId: 'conv-1',
        content: 'Hello!',
      });
      expect(result.content).toBe('Hello!');
    });
  });

  describe('markAsRead', () => {
    it('should mark all messages as read', async () => {
      mockApiService.post.mockResolvedValue(mockAxiosResponse({ count: 5 }));

      const result = await ChatService.markAsRead('conv-1');

      expect(mockApiService.post).toHaveBeenCalledWith(
        'chat.messages.markAsRead',
        {},
        { pathParams: { conversationId: 'conv-1' } }
      );
      expect(result.count).toBe(5);
    });

    it('should mark specific messages as read', async () => {
      mockApiService.post.mockResolvedValue(mockAxiosResponse({ count: 2 }));

      await ChatService.markAsRead('conv-1', ['msg-1', 'msg-2']);

      expect(mockApiService.post).toHaveBeenCalledWith(
        'chat.messages.markAsRead',
        { messageIds: ['msg-1', 'msg-2'] },
        { pathParams: { conversationId: 'conv-1' } }
      );
    });
  });
});
