/**
 * Chat Service Tests
 * Task 1.5: Tests for ChatService methods
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatService } from './ChatService';
import { ApiService } from '@/services/ApiService';
import type { ConversationDTO, MessageDTO, ResponseMeta } from '@/@types/contracts';
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
  const mockMeta: ResponseMeta = {
    total: 1,
    limit: 20,
    offset: 0,
  };

  const mockConversation: ConversationDTO = {
    id: 'conv-1',
    participants: [
      { id: 'user-1', name: 'User 1', type: 'user' },
      { id: 'user-2', name: 'User 2', type: 'user' },
    ],
    unreadCount: 0,
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-02-04T00:00:00Z',
  };

  const mockMessage: MessageDTO = {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'user-1',
    type: 'text',
    content: 'Hello',
    readBy: [],
    createdAt: '2026-02-04T10:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listConversations', () => {
    it('should list conversations without options', async () => {
      const mockResponse = {
        conversations: [mockConversation],
        meta: mockMeta,
      };
      mockApiService.get.mockResolvedValue(mockAxiosResponse(mockResponse));

      const result = await ChatService.listConversations();

      expect(mockApiService.get).toHaveBeenCalledWith('chat.conversations', {
        params: undefined,
      });
      expect(result.conversations).toHaveLength(1);
    });

    it('should list conversations with options', async () => {
      const mockResponse = {
        conversations: [],
        meta: { ...mockMeta, total: 0 },
      };
      mockApiService.get.mockResolvedValue(mockAxiosResponse(mockResponse));

      await ChatService.listConversations({ limit: 10, offset: 5 });

      expect(mockApiService.get).toHaveBeenCalledWith('chat.conversations', {
        params: { limit: 10, offset: 5 },
      });
    });
  });

  describe('getConversation', () => {
    it('should get a conversation by ID', async () => {
      mockApiService.get.mockResolvedValue(mockAxiosResponse(mockConversation));

      const result = await ChatService.getConversation('conv-1');

      expect(mockApiService.get).toHaveBeenCalledWith('chat.conversation', {
        pathParams: { id: 'conv-1' },
      });
      expect(result.id).toBe('conv-1');
    });
  });

  describe('getMessages', () => {
    it('should get messages in a conversation', async () => {
      const mockResponse = {
        messages: [mockMessage],
        meta: mockMeta,
      };
      mockApiService.get.mockResolvedValue(mockAxiosResponse(mockResponse));

      const result = await ChatService.getMessages('conv-1');

      expect(mockApiService.get).toHaveBeenCalledWith('chat.messages', {
        pathParams: { id: 'conv-1' },
        params: undefined,
      });
      expect(result.messages).toHaveLength(1);
    });

    it('should get messages with options', async () => {
      const mockResponse = {
        messages: [],
        meta: { ...mockMeta, total: 0 },
      };
      mockApiService.get.mockResolvedValue(mockAxiosResponse(mockResponse));

      await ChatService.getMessages('conv-1', { limit: 20, before: 'msg-5' });

      expect(mockApiService.get).toHaveBeenCalledWith('chat.messages', {
        pathParams: { id: 'conv-1' },
        params: { limit: 20, before: 'msg-5' },
      });
    });
  });

  describe('sendMessage', () => {
    it('should send a message', async () => {
      const newMessage = { ...mockMessage, id: 'msg-new', content: 'Hello!' };
      mockApiService.post.mockResolvedValue(mockAxiosResponse(newMessage));

      const result = await ChatService.sendMessage('conv-1', { content: 'Hello!' });

      expect(mockApiService.post).toHaveBeenCalledWith(
        'chat.send',
        { content: 'Hello!' },
        { pathParams: { id: 'conv-1' } }
      );
      expect(result.content).toBe('Hello!');
    });
  });

  describe('markAsRead', () => {
    it('should mark conversation as read', async () => {
      mockApiService.post.mockResolvedValue(mockAxiosResponse(undefined));

      await ChatService.markAsRead('conv-1');

      expect(mockApiService.post).toHaveBeenCalledWith(
        'chat.markRead',
        undefined,
        { pathParams: { id: 'conv-1' } }
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should get total unread count', async () => {
      const conversations = [
        { ...mockConversation, unreadCount: 3 },
        { ...mockConversation, id: 'conv-2', unreadCount: 2 },
      ];
      mockApiService.get.mockResolvedValue(
        mockAxiosResponse({ conversations, meta: mockMeta })
      );

      const result = await ChatService.getUnreadCount();

      expect(result).toBe(5);
    });
  });
});
