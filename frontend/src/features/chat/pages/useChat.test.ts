/**
 * useChat Hook Tests
 * Task 1.6, 1.7: Tests for Socket.IO events and message delivery states
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useChat } from './useChat';
import { ChatService } from '@/services/ChatService';
import type { ConversationDTO, MessageDTO, ParticipantDTO } from '@/@types/contracts';

// Mock services
vi.mock('@/services/ChatService', () => ({
  ChatService: {
    listConversations: vi.fn(),
    getConversation: vi.fn(),
    getMessages: vi.fn(),
    sendMessage: vi.fn(),
    markAsRead: vi.fn(),
    getUnreadCount: vi.fn(),
  },
}));

vi.mock('@/services', () => ({
  SocketService: vi.fn().mockImplementation(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    on: vi.fn().mockReturnValue(() => {}),
    emitNoAck: vi.fn(),
    isConnected: vi.fn().mockReturnValue(true),
  })),
}));

vi.mock('@/store', () => ({
  useAuthStore: vi.fn().mockReturnValue({
    session: {
      user: { id: 'user-1', firstName: 'Test', lastName: 'User', email: 'test@example.com' },
      accessToken: 'mock-token',
    },
    getAccessToken: () => 'mock-token',
  }),
}));

const mockParticipants: ParticipantDTO[] = [
  { id: 'user-1', name: 'User 1', type: 'user' },
  { id: 'user-2', name: 'User 2', type: 'user' },
];

const mockConversation: ConversationDTO = {
  id: 'conv-1',
  participants: mockParticipants,
  unreadCount: 2,
  createdAt: '2026-02-01T00:00:00Z',
  updatedAt: '2026-02-04T00:00:00Z',
};

const mockMessage: MessageDTO = {
  id: 'msg-1',
  conversationId: 'conv-1',
  senderId: 'user-2',
  type: 'text',
  content: 'Hello!',
  readBy: ['user-1'],
  createdAt: '2026-02-04T10:00:00Z',
};

describe('useChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ChatService.listConversations).mockResolvedValue({
      conversations: [mockConversation],
      meta: { total: 1, limit: 50, offset: 0 },
    });
    vi.mocked(ChatService.getMessages).mockResolvedValue({
      messages: [mockMessage],
      meta: { total: 1, limit: 50, offset: 0 },
    });
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useChat({ autoConnect: false }));

    expect(result.current.conversations).toEqual([]);
    expect(result.current.selectedConversationId).toBeNull();
    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoadingConversations).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should load conversations', async () => {
    const { result } = renderHook(() => useChat({ autoConnect: false }));

    await act(async () => {
      await result.current.loadConversations();
    });

    expect(ChatService.listConversations).toHaveBeenCalled();
    expect(result.current.conversations).toHaveLength(1);
    expect(result.current.conversations[0]?.id).toBe('conv-1');
  });

  it('should select a conversation', async () => {
    const { result } = renderHook(() => useChat({ autoConnect: false }));

    await act(async () => {
      await result.current.loadConversations();
    });

    act(() => {
      result.current.selectConversation('conv-1');
    });

    expect(result.current.selectedConversationId).toBe('conv-1');
  });

  it('should load messages for selected conversation', async () => {
    const { result } = renderHook(() => useChat({ autoConnect: false }));

    await act(async () => {
      await result.current.loadConversations();
    });

    act(() => {
      result.current.selectConversation('conv-1');
    });

    await act(async () => {
      await result.current.loadMessages();
    });

    expect(ChatService.getMessages).toHaveBeenCalledWith('conv-1', expect.any(Object));
    expect(result.current.messages).toHaveLength(1);
  });

  it('should send a message with optimistic update', async () => {
    const sentMessage: MessageDTO = {
      id: 'msg-new',
      conversationId: 'conv-1',
      senderId: 'user-1',
      type: 'text',
      content: 'Hello back!',
      readBy: [],
      createdAt: '2026-02-04T10:01:00Z',
    };
    vi.mocked(ChatService.sendMessage).mockResolvedValue(sentMessage);

    const { result } = renderHook(() => useChat({ autoConnect: false }));

    await act(async () => {
      await result.current.loadConversations();
    });

    act(() => {
      result.current.selectConversation('conv-1');
    });

    await act(async () => {
      await result.current.sendMessage('Hello back!');
    });

    expect(ChatService.sendMessage).toHaveBeenCalledWith('conv-1', 'Hello back!');
  });

  it('should handle send message failure', async () => {
    vi.mocked(ChatService.sendMessage).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useChat({ autoConnect: false }));

    await act(async () => {
      await result.current.loadConversations();
    });

    act(() => {
      result.current.selectConversation('conv-1');
    });

    await act(async () => {
      await result.current.sendMessage('This will fail');
    });

    // Should have a failed message
    await waitFor(() => {
      const failedMessage = result.current.messages.find((m) => m.status === 'failed');
      expect(failedMessage).toBeDefined();
    });
  });

  it('should calculate total unread count', async () => {
    vi.mocked(ChatService.listConversations).mockResolvedValue({
      conversations: [
        { ...mockConversation, unreadCount: 5 },
        { ...mockConversation, id: 'conv-2', unreadCount: 3 },
      ],
      meta: { total: 2, limit: 50, offset: 0 },
    });

    const { result } = renderHook(() => useChat({ autoConnect: false }));

    await act(async () => {
      await result.current.loadConversations();
    });

    expect(result.current.totalUnreadCount).toBe(8);
  });

  it('should search conversations', async () => {
    const { result } = renderHook(() => useChat({ autoConnect: false }));

    await act(async () => {
      await result.current.searchConversations('test');
    });

    expect(ChatService.listConversations).toHaveBeenCalledWith(
      { search: 'test' },
      expect.any(Object)
    );
  });

  it('should clear error', async () => {
    vi.mocked(ChatService.listConversations).mockRejectedValueOnce(new Error('Error'));

    const { result } = renderHook(() => useChat({ autoConnect: false }));

    await act(async () => {
      await result.current.loadConversations();
    });

    expect(result.current.error).toBeTruthy();

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });
});
