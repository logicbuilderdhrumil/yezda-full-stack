/**
 * useChat Hook
 * Task 1.6: Connect Socket.IO events for new messages
 * Task 1.7: Handle message delivery states and retries
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { SocketService } from '@/services';
import { ChatService } from '@/services/ChatService';
import { useAuthStore } from '@/store';
import type {
  Conversation,
  ConversationFilters,
  Message,
  MessageStatus,
  NewMessagePayload,
  MessageStatusUpdatePayload,
  ConversationUpdatePayload,
} from '@/@types/chat';

// ============================================================================
// Socket Events
// ============================================================================

const CHAT_EVENTS = {
  // Server to client
  NEW_MESSAGE: 'chat:new_message',
  MESSAGE_STATUS: 'chat:message_status',
  CONVERSATION_UPDATE: 'chat:conversation_update',
  // Client to server
  JOIN_CONVERSATION: 'chat:join',
  LEAVE_CONVERSATION: 'chat:leave',
  SEND_MESSAGE: 'chat:send',
} as const;

// ============================================================================
// Types
// ============================================================================

export interface UseChatConfig {
  /** Auto-connect on mount */
  autoConnect?: boolean;
}

export interface UseChatState {
  /** List of conversations */
  conversations: Conversation[];
  /** Currently selected conversation ID */
  selectedConversationId: string | null;
  /** Messages in the selected conversation */
  messages: Message[];
  /** Loading state for conversations */
  isLoadingConversations: boolean;
  /** Loading state for messages */
  isLoadingMessages: boolean;
  /** Loading more conversations */
  isLoadingMoreConversations: boolean;
  /** Loading more messages */
  isLoadingMoreMessages: boolean;
  /** Has more conversations to load */
  hasMoreConversations: boolean;
  /** Has more messages to load */
  hasMoreMessages: boolean;
  /** Error message */
  error: string | null;
  /** Whether message is being sent */
  isSending: boolean;
}

export interface UseChatActions {
  /** Load conversations list */
  loadConversations: (filters?: ConversationFilters, loadMore?: boolean) => Promise<void>;
  /** Select a conversation */
  selectConversation: (conversationId: string) => void;
  /** Load messages for current conversation */
  loadMessages: (loadMore?: boolean) => Promise<void>;
  /** Send a message */
  sendMessage: (content: string) => Promise<void>;
  /** Retry sending a failed message */
  retryMessage: (tempId: string) => Promise<void>;
  /** Mark messages as read */
  markAsRead: () => Promise<void>;
  /** Search conversations */
  searchConversations: (query: string) => Promise<void>;
  /** Clear error */
  clearError: () => void;
}

export interface UseChatReturn extends UseChatState, UseChatActions {
  /** Currently selected conversation */
  selectedConversation: Conversation | null;
  /** Total unread count across all conversations */
  totalUnreadCount: number;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState: UseChatState = {
  conversations: [],
  selectedConversationId: null,
  messages: [],
  isLoadingConversations: false,
  isLoadingMessages: false,
  isLoadingMoreConversations: false,
  isLoadingMoreMessages: false,
  hasMoreConversations: false,
  hasMoreMessages: false,
  error: null,
  isSending: false,
};

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for managing chat state, conversations, messages, and Socket.IO events.
 */
export function useChat(config: UseChatConfig = {}): UseChatReturn {
  const { autoConnect = true } = config;
  const [state, setState] = useState<UseChatState>(initialState);
  const { session, getAccessToken } = useAuthStore();
  const user = session?.user;

  // Refs for pagination cursors
  const conversationsCursorRef = useRef<string | undefined>(undefined);
  const messagesCursorRef = useRef<string | undefined>(undefined);
  // Ref for pending messages (for retries)
  const pendingMessagesRef = useRef<Map<string, { content: string; conversationId: string }>>(
    new Map()
  );
  // Socket service ref
  const socketRef = useRef<SocketService | null>(null);
  // Cleanup refs
  const unsubscribersRef = useRef<Array<() => void>>([]);

  // ============================================================================
  // Socket Connection
  // ============================================================================

  useEffect(() => {
    const token = getAccessToken();
    if (!autoConnect || !token) return;

    const socketService = new SocketService({
      getToken: () => getAccessToken(),
      namespace: '/chat',
      onStatusChange: (status) => {
        if (status === 'error') {
          setState((prev) => ({
            ...prev,
            error: 'Connection lost. Reconnecting...',
          }));
        } else if (status === 'connected') {
          setState((prev) => ({ ...prev, error: null }));
        }
      },
      onError: (error) => {
        console.error('[useChat] Socket error:', error);
      },
    });

    socketRef.current = socketService;
    socketService.connect();

    // Subscribe to socket events
    const unsubNewMessage = socketService.on(
      CHAT_EVENTS.NEW_MESSAGE,
      (data: unknown) => {
        const payload = data as NewMessagePayload;
        handleNewMessage(payload);
      }
    );
    unsubscribersRef.current.push(unsubNewMessage);

    const unsubMessageStatus = socketService.on(
      CHAT_EVENTS.MESSAGE_STATUS,
      (data: unknown) => {
        const payload = data as MessageStatusUpdatePayload;
        handleMessageStatusUpdate(payload);
      }
    );
    unsubscribersRef.current.push(unsubMessageStatus);

    const unsubConversationUpdate = socketService.on(
      CHAT_EVENTS.CONVERSATION_UPDATE,
      (data: unknown) => {
        const payload = data as ConversationUpdatePayload;
        handleConversationUpdate(payload);
      }
    );
    unsubscribersRef.current.push(unsubConversationUpdate);

    return () => {
      unsubscribersRef.current.forEach((unsub) => unsub());
      unsubscribersRef.current = [];
      socketService.disconnect();
      socketRef.current = null;
    };
  }, [autoConnect, getAccessToken]);

  // ============================================================================
  // Socket Event Handlers
  // ============================================================================

  const handleNewMessage = useCallback((payload: NewMessagePayload) => {
    const { message } = payload;

    setState((prev) => {
      // Add message to current conversation if it matches
      const isCurrentConversation =
        prev.selectedConversationId === message.conversationId;

      // Update conversations list (move to top, update last message)
      const updatedConversations = prev.conversations.map((conv) => {
        if (conv.id === message.conversationId) {
          return {
            ...conv,
            lastMessage: message,
            unreadCount: isCurrentConversation
              ? conv.unreadCount
              : conv.unreadCount + 1,
            updatedAt: message.createdAt,
          };
        }
        return conv;
      });

      // Sort by updatedAt (most recent first)
      updatedConversations.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      // Add to messages if in current conversation
      const updatedMessages = isCurrentConversation
        ? [...prev.messages, message]
        : prev.messages;

      return {
        ...prev,
        conversations: updatedConversations,
        messages: updatedMessages,
      };
    });
  }, []);

  const handleMessageStatusUpdate = useCallback(
    (payload: MessageStatusUpdatePayload) => {
      const { messageId, status } = payload;

      setState((prev) => ({
        ...prev,
        messages: prev.messages.map((msg) =>
          msg.id === messageId ? { ...msg, status } : msg
        ),
      }));

      // Clear from pending if delivered/read
      if (status === 'delivered' || status === 'read') {
        pendingMessagesRef.current.delete(messageId);
      }
    },
    []
  );

  const handleConversationUpdate = useCallback(
    (payload: ConversationUpdatePayload) => {
      const { conversation } = payload;

      setState((prev) => ({
        ...prev,
        conversations: prev.conversations.map((conv) =>
          conv.id === conversation.id ? conversation : conv
        ),
      }));
    },
    []
  );

  // ============================================================================
  // Actions
  // ============================================================================

  const loadConversations = useCallback(
    async (filters?: ConversationFilters, loadMore = false) => {
      setState((prev) => ({
        ...prev,
        isLoadingConversations: !loadMore,
        isLoadingMoreConversations: loadMore,
        error: null,
      }));

      try {
        const cursor = loadMore ? conversationsCursorRef.current : undefined;
        const pagination = cursor ? { limit: 20, cursor } : { limit: 20 };
        const result = await ChatService.listConversations(filters, pagination);

        conversationsCursorRef.current = result.nextCursor;

        setState((prev) => ({
          ...prev,
          conversations: loadMore
            ? [...prev.conversations, ...result.conversations]
            : result.conversations,
          hasMoreConversations: result.hasMore,
          isLoadingConversations: false,
          isLoadingMoreConversations: false,
        }));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to load conversations';
        setState((prev) => ({
          ...prev,
          isLoadingConversations: false,
          isLoadingMoreConversations: false,
          error: message,
        }));
      }
    },
    []
  );

  const selectConversation = useCallback((conversationId: string) => {
    setState((prev) => ({
      ...prev,
      selectedConversationId: conversationId,
      messages: [],
      hasMoreMessages: false,
    }));
    messagesCursorRef.current = undefined;

    // Join the conversation room via socket
    if (socketRef.current?.isConnected()) {
      socketRef.current.emitNoAck(CHAT_EVENTS.JOIN_CONVERSATION, {
        conversationId,
      });
    }
  }, []);

  const loadMessages = useCallback(
    async (loadMore = false) => {
      const conversationId = state.selectedConversationId;
      if (!conversationId) return;

      setState((prev) => ({
        ...prev,
        isLoadingMessages: !loadMore,
        isLoadingMoreMessages: loadMore,
        error: null,
      }));

      try {
        const cursor = loadMore ? messagesCursorRef.current : undefined;
        const pagination = cursor ? { limit: 50, cursor } : { limit: 50 };
        const result = await ChatService.listMessages(conversationId, pagination);

        messagesCursorRef.current = result.nextCursor;

        setState((prev) => ({
          ...prev,
          messages: loadMore
            ? [...result.messages.reverse(), ...prev.messages]
            : result.messages.reverse(),
          hasMoreMessages: result.hasMore,
          isLoadingMessages: false,
          isLoadingMoreMessages: false,
        }));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to load messages';
        setState((prev) => ({
          ...prev,
          isLoadingMessages: false,
          isLoadingMoreMessages: false,
          error: message,
        }));
      }
    },
    [state.selectedConversationId]
  );

  const sendMessage = useCallback(
    async (content: string) => {
      const conversationId = state.selectedConversationId;
      if (!conversationId || !content.trim() || !user) return;

      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const optimisticMessage: Message = {
        id: tempId,
        tempId,
        conversationId,
        content: content.trim(),
        sender: {
          id: user.id,
          name: `${user.firstName} ${user.lastName}` || user.email || 'You',
        },
        status: 'sending',
        createdAt: new Date().toISOString(),
      };

      // Store for retry
      pendingMessagesRef.current.set(tempId, {
        content: content.trim(),
        conversationId,
      });

      // Optimistic update
      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, optimisticMessage],
        isSending: true,
      }));

      try {
        const sentMessage = await ChatService.sendMessage(
          conversationId,
          content.trim()
        );

        // Replace optimistic message with real one
        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((msg) =>
            msg.tempId === tempId ? { ...sentMessage, tempId } : msg
          ),
          isSending: false,
        }));

        pendingMessagesRef.current.delete(tempId);
      } catch (err) {
        // Mark as failed
        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((msg) =>
            msg.tempId === tempId
              ? { ...msg, status: 'failed' as MessageStatus }
              : msg
          ),
          isSending: false,
        }));
      }
    },
    [state.selectedConversationId, user]
  );

  const retryMessage = useCallback(async (tempId: string) => {
    const pending = pendingMessagesRef.current.get(tempId);
    if (!pending) return;

    // Update status to sending
    setState((prev) => ({
      ...prev,
      messages: prev.messages.map((msg) =>
        msg.tempId === tempId
          ? { ...msg, status: 'sending' as MessageStatus }
          : msg
      ),
      isSending: true,
    }));

    try {
      const sentMessage = await ChatService.sendMessage(
        pending.conversationId,
        pending.content
      );

      setState((prev) => ({
        ...prev,
        messages: prev.messages.map((msg) =>
          msg.tempId === tempId ? { ...sentMessage, tempId } : msg
        ),
        isSending: false,
      }));

      pendingMessagesRef.current.delete(tempId);
    } catch {
      setState((prev) => ({
        ...prev,
        messages: prev.messages.map((msg) =>
          msg.tempId === tempId
            ? { ...msg, status: 'failed' as MessageStatus }
            : msg
        ),
        isSending: false,
      }));
    }
  }, []);

  const markAsRead = useCallback(async () => {
    const conversationId = state.selectedConversationId;
    if (!conversationId) return;

    try {
      await ChatService.markAsRead(conversationId);

      // Update local state
      setState((prev) => ({
        ...prev,
        conversations: prev.conversations.map((conv) =>
          conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
        ),
        messages: prev.messages.map((msg) => ({
          ...msg,
          status: msg.status === 'delivered' ? 'read' : msg.status,
        })),
      }));
    } catch (err) {
      console.error('[useChat] Failed to mark as read:', err);
    }
  }, [state.selectedConversationId]);

  const searchConversations = useCallback(async (query: string) => {
    await loadConversations({ search: query });
  }, [loadConversations]);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // ============================================================================
  // Derived State
  // ============================================================================

  const selectedConversation =
    state.conversations.find(
      (conv) => conv.id === state.selectedConversationId
    ) ?? null;

  const totalUnreadCount = state.conversations.reduce(
    (sum, conv) => sum + conv.unreadCount,
    0
  );

  return {
    ...state,
    selectedConversation,
    totalUnreadCount,
    loadConversations,
    selectConversation,
    loadMessages,
    sendMessage,
    retryMessage,
    markAsRead,
    searchConversations,
    clearError,
  };
}

/**
 * Hook to get total unread message count.
 */
export function useUnreadChatCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const result = await ChatService.listConversations({}, { limit: 100 });
        const total = result.conversations.reduce(
          (sum, conv) => sum + conv.unreadCount,
          0
        );
        setCount(total);
      } catch {
        // Ignore errors for badge count
      }
    };

    fetchCount();
  }, []);

  return count;
}
