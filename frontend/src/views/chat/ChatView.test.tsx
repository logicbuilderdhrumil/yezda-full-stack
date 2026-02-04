/**
 * ChatView Tests
 * Task 1.2, 1.3, 1.4, 1.8: Tests for UI components and states
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatView } from './ChatView';
import { useChat } from './useChat';
import type { Conversation, Message } from '@/@types/chat';

// Mock useChat hook
vi.mock('./useChat', () => ({
  useChat: vi.fn(),
}));

// Mock scrollIntoView for jsdom
beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

// Mock PageContainer
vi.mock('@/components/layouts', () => ({
  PageContainer: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div data-testid="page-container">
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

const mockMessage1: Message = {
  id: 'msg-1',
  conversationId: 'conv-1',
  sender: { id: 'user-2', name: 'John Doe' },
  content: 'Hey, how are you?',
  status: 'read',
  createdAt: '2026-02-04T10:00:00Z',
};

const mockMessage2: Message = {
  id: 'msg-2',
  conversationId: 'conv-1',
  sender: { id: 'user-1', name: 'Me' },
  content: "I'm good, thanks!",
  status: 'delivered',
  createdAt: '2026-02-04T10:01:00Z',
  tempId: 'temp-123',
};

const mockConversation1: Conversation = {
  id: 'conv-1',
  title: 'John Doe',
  participants: [
    { id: 'user-1', name: 'Me' },
    { id: 'user-2', name: 'John Doe' },
  ],
  unreadCount: 2,
  lastMessage: mockMessage1,
  isGroup: false,
  createdAt: '2026-02-01T00:00:00Z',
  updatedAt: '2026-02-04T10:00:00Z',
};

const mockConversation2: Conversation = {
  id: 'conv-2',
  title: 'Team Chat',
  participants: [
    { id: 'user-1', name: 'Me' },
    { id: 'user-2', name: 'John Doe' },
    { id: 'user-3', name: 'Jane Smith' },
  ],
  unreadCount: 0,
  isGroup: true,
  createdAt: '2026-01-15T00:00:00Z',
  updatedAt: '2026-02-03T15:00:00Z',
};

const mockConversations: Conversation[] = [mockConversation1, mockConversation2];
const mockMessages: Message[] = [mockMessage1, mockMessage2];

const defaultMockState = {
  conversations: [] as Conversation[],
  selectedConversationId: null as string | null,
  selectedConversation: null as Conversation | null,
  messages: [] as Message[],
  isLoadingConversations: false,
  isLoadingMessages: false,
  isLoadingMoreConversations: false,
  isLoadingMoreMessages: false,
  hasMoreConversations: false,
  hasMoreMessages: false,
  error: null as string | null,
  isSending: false,
  totalUnreadCount: 0,
  loadConversations: vi.fn(),
  selectConversation: vi.fn(),
  loadMessages: vi.fn(),
  sendMessage: vi.fn(),
  retryMessage: vi.fn(),
  markAsRead: vi.fn(),
  searchConversations: vi.fn(),
  clearError: vi.fn(),
};

describe('ChatView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useChat).mockReturnValue(defaultMockState);
  });

  it('should render the chat view with title', () => {
    render(<ChatView />);
    
    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('Messages')).toBeInTheDocument();
  });

  it('should show loading state for conversations', () => {
    vi.mocked(useChat).mockReturnValue({
      ...defaultMockState,
      isLoadingConversations: true,
    });

    render(<ChatView />);
    
    // Should show skeletons
    expect(screen.queryByText('No conversations yet')).not.toBeInTheDocument();
  });

  it('should show empty state when no conversations', () => {
    render(<ChatView />);
    
    expect(screen.getByText('No conversations yet')).toBeInTheDocument();
    expect(screen.getByText('Start a conversation to see it here.')).toBeInTheDocument();
  });

  it('should render conversations list', () => {
    vi.mocked(useChat).mockReturnValue({
      ...defaultMockState,
      conversations: mockConversations,
      totalUnreadCount: 2,
    });

    render(<ChatView />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Team Chat')).toBeInTheDocument();
    expect(screen.getByText('Hey, how are you?')).toBeInTheDocument();
  });

  it('should show unread badge on conversations', () => {
    vi.mocked(useChat).mockReturnValue({
      ...defaultMockState,
      conversations: mockConversations,
      totalUnreadCount: 2,
    });

    render(<ChatView />);
    
    // Should have unread badges with count 2 (in header and on conversation)
    const badges = screen.getAllByText('2');
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it('should show placeholder when no conversation selected', () => {
    vi.mocked(useChat).mockReturnValue({
      ...defaultMockState,
      conversations: mockConversations,
    });

    render(<ChatView />);
    
    expect(screen.getByText('Select a conversation')).toBeInTheDocument();
    expect(screen.getByText('Choose a conversation from the list to start chatting.')).toBeInTheDocument();
  });

  it('should call selectConversation when clicking a conversation', () => {
    const selectConversation = vi.fn();
    vi.mocked(useChat).mockReturnValue({
      ...defaultMockState,
      conversations: mockConversations,
      selectConversation,
    });

    render(<ChatView />);
    
    const conversationItem = screen.getByText('John Doe').closest('[role="button"]');
    if (conversationItem) {
      fireEvent.click(conversationItem);
    }
    
    expect(selectConversation).toHaveBeenCalledWith('conv-1');
  });

  it('should render messages when conversation is selected', () => {
    vi.mocked(useChat).mockReturnValue({
      ...defaultMockState,
      conversations: mockConversations,
      selectedConversationId: 'conv-1',
      selectedConversation: mockConversation1,
      messages: mockMessages,
    });

    render(<ChatView />);
    
    // Message text may appear in both preview and message bubble
    const heyMessages = screen.getAllByText('Hey, how are you?');
    expect(heyMessages.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("I'm good, thanks!")).toBeInTheDocument();
  });

  it('should show message input when conversation is selected', () => {
    vi.mocked(useChat).mockReturnValue({
      ...defaultMockState,
      selectedConversationId: 'conv-1',
      selectedConversation: mockConversation1,
    });

    render(<ChatView />);
    
    expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
  });

  it('should show error state', () => {
    const clearError = vi.fn();
    vi.mocked(useChat).mockReturnValue({
      ...defaultMockState,
      error: 'Failed to load conversations',
      clearError,
    });

    render(<ChatView />);
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Failed to load conversations')).toBeInTheDocument();
  });

  it('should call loadConversations on retry', () => {
    const loadConversations = vi.fn();
    const clearError = vi.fn();
    vi.mocked(useChat).mockReturnValue({
      ...defaultMockState,
      error: 'Failed to load',
      loadConversations,
      clearError,
    });

    render(<ChatView />);
    
    const retryButton = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(retryButton);
    
    expect(clearError).toHaveBeenCalled();
    expect(loadConversations).toHaveBeenCalled();
  });

  it('should show empty messages state', () => {
    vi.mocked(useChat).mockReturnValue({
      ...defaultMockState,
      selectedConversationId: 'conv-1',
      selectedConversation: mockConversation1,
      messages: [],
    });

    render(<ChatView />);
    
    expect(screen.getByText('No messages yet')).toBeInTheDocument();
    expect(screen.getByText('Send a message to start the conversation.')).toBeInTheDocument();
  });

  it('should show load more button for conversations', () => {
    const loadConversations = vi.fn();
    vi.mocked(useChat).mockReturnValue({
      ...defaultMockState,
      conversations: mockConversations,
      hasMoreConversations: true,
      loadConversations,
    });

    render(<ChatView />);
    
    const loadMoreButton = screen.getByRole('button', { name: /load more/i });
    expect(loadMoreButton).toBeInTheDocument();
    
    fireEvent.click(loadMoreButton);
    
    expect(loadConversations).toHaveBeenCalledWith(undefined, true);
  });

  it('should show load earlier messages button', () => {
    const loadMessages = vi.fn();
    vi.mocked(useChat).mockReturnValue({
      ...defaultMockState,
      selectedConversationId: 'conv-1',
      selectedConversation: mockConversation1,
      messages: mockMessages,
      hasMoreMessages: true,
      loadMessages,
    });

    render(<ChatView />);
    
    const loadMoreButton = screen.getByRole('button', { name: /load earlier messages/i });
    expect(loadMoreButton).toBeInTheDocument();
  });
});
