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
  ChatParticipant,
} from '@/@types/chat';
import type {
  ConversationDTO,
  MessageDTO,
  ParticipantDTO,
} from '@/@types/contracts';

// ============================================================================
// DTO Mappers
// ============================================================================

/** Map ParticipantDTO to ChatParticipant */
function mapParticipant(dto: ParticipantDTO): ChatParticipant {
  return {
    id: dto.id,
    name: dto.name,
    avatarUrl: dto.avatarUrl,
    role: dto.type === 'candidate' ? 'candidate' : 'user',
  };
}

/** Map MessageDTO to Message */
function mapMessage(dto: MessageDTO, participants: ParticipantDTO[]): Message {
  const sender = participants.find(p => p.id === dto.senderId);
  return {
    id: dto.id,
    conversationId: dto.conversationId,
    content: dto.content,
    createdAt: dto.createdAt,
    sender: sender ? mapParticipant(sender) : { id: dto.senderId, name: 'Unknown' },
    status: dto.readBy.length > 0 ? 'read' : 'delivered',
  };
}

/** Map ConversationDTO to Conversation */
function mapConversation(dto: ConversationDTO): Conversation {
  const participants = dto.participants.map(mapParticipant);
  const title = dto.participants.map(p => p.name).join(', ') || 'Conversation';
  return {
    id: dto.id,
    title,
    participants,
    lastMessage: dto.lastMessage ? mapMessage(dto.lastMessage, dto.participants) : undefined,
    unreadCount: dto.unreadCount,
    isGroup: dto.participants.length > 2,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

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

  // Refs for pagination offsets
  const conversationsOffsetRef = useRef<number>(0);
  const messagesOffsetRef = useRef<number>(0);
  // Ref for pending messages (for retries)
  const pendingMessagesRef = useRef<Map<string, { content: string; conversationId: string }>>(
    new Map()
  );
  // Socket service ref
  const socketRef = useRef<SocketService | null>(null);
  // Cleanup refs
  const unsubscribersRef = useRef<Array<() => void>>([]);

  // ============================================================================
  // Socket Event Handlers (using refs to avoid stale closures)
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

  // Use refs to keep handlers fresh for socket subscriptions
  const handleNewMessageRef = useRef(handleNewMessage);
  const handleMessageStatusUpdateRef = useRef(handleMessageStatusUpdate);
  const handleConversationUpdateRef = useRef(handleConversationUpdate);

  useEffect(() => {
    handleNewMessageRef.current = handleNewMessage;
    handleMessageStatusUpdateRef.current = handleMessageStatusUpdate;
    handleConversationUpdateRef.current = handleConversationUpdate;
  }, [handleNewMessage, handleMessageStatusUpdate, handleConversationUpdate]);

  // ============================================================================
  // Socket Connection
  // ============================================================================

  useEffect(() => {
    const token = getAccessToken();
    if (!autoConnect || !token) return;

    const socketService = new SocketService({
      getToken: () => getAccessToken(),
      // Use root namespace - backend Socket.IO doesn't define a /chat namespace
      namespace: '/',
      onStatusChange: (status) => {
        if (status === 'error') {
          // Only show error if no conversations loaded yet
          setState((prev) => {
            if (prev.conversations.length === 0 && !prev.isLoadingConversations) {
              return { ...prev, error: 'Connection lost. Reconnecting...' };
            }
            return prev;
          });
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

    // Subscribe to socket events (using refs for fresh handlers)
    const unsubNewMessage = socketService.on(
      CHAT_EVENTS.NEW_MESSAGE,
      (data: unknown) => {
        const payload = data as NewMessagePayload;
        handleNewMessageRef.current(payload);
      }
    );
    unsubscribersRef.current.push(unsubNewMessage);

    const unsubMessageStatus = socketService.on(
      CHAT_EVENTS.MESSAGE_STATUS,
      (data: unknown) => {
        const payload = data as MessageStatusUpdatePayload;
        handleMessageStatusUpdateRef.current(payload);
      }
    );
    unsubscribersRef.current.push(unsubMessageStatus);

    const unsubConversationUpdate = socketService.on(
      CHAT_EVENTS.CONVERSATION_UPDATE,
      (data: unknown) => {
        const payload = data as ConversationUpdatePayload;
        handleConversationUpdateRef.current(payload);
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
  // Actions
  // ============================================================================

  const loadConversations = useCallback(
    async (_filters?: ConversationFilters, loadMore = false) => {
      setState((prev) => ({
        ...prev,
        isLoadingConversations: !loadMore,
        isLoadingMoreConversations: loadMore,
        error: null,
      }));

      try {
        const offset = loadMore ? conversationsOffsetRef.current : 0;
        const limit = 20;
        const result = await ChatService.listConversations({ limit, offset });

        conversationsOffsetRef.current = offset + result.conversations.length;
        const hasMore = offset + result.conversations.length < result.meta.total;
        const mappedConversations = result.conversations.map(mapConversation);

        setState((prev) => ({
          ...prev,
          conversations: loadMore
            ? [...prev.conversations, ...mappedConversations]
            : mappedConversations,
          hasMoreConversations: hasMore,
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
    messagesOffsetRef.current = 0;

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
        const offset = loadMore ? messagesOffsetRef.current : 0;
        const limit = 50;
        const result = await ChatService.getMessages(conversationId, { limit });

        messagesOffsetRef.current = offset + result.messages.length;
        const hasMore = offset + result.messages.length < result.meta.total;

        // Get participants from the selected conversation for mapping
        const selectedConv = state.conversations.find(c => c.id === conversationId);
        const participantDTOs: ParticipantDTO[] = selectedConv?.participants.map(p => ({
          id: p.id,
          name: p.name,
          avatarUrl: p.avatarUrl,
          type: (p.role === 'candidate' ? 'candidate' : 'user') as 'user' | 'candidate',
        })) ?? [];

        const mappedMessages = result.messages.map(m => mapMessage(m, participantDTOs));

        setState((prev) => ({
          ...prev,
          messages: loadMore
            ? [...mappedMessages.reverse(), ...prev.messages]
            : mappedMessages.reverse(),
          hasMoreMessages: hasMore,
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
    [state.selectedConversationId, state.conversations]
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
        const sentMessageDTO = await ChatService.sendMessage(
          conversationId,
          { content: content.trim() }
        );

        // Map the sent message using current user as sender
        const mappedSentMessage: Message = {
          id: sentMessageDTO.id,
          conversationId: sentMessageDTO.conversationId,
          content: sentMessageDTO.content,
          createdAt: sentMessageDTO.createdAt,
          sender: optimisticMessage.sender,
          status: 'sent',
          tempId,
        };

        // Replace optimistic message with real one
        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((msg) =>
            msg.tempId === tempId ? mappedSentMessage : msg
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
      const sentMessageDTO = await ChatService.sendMessage(
        pending.conversationId,
        { content: pending.content }
      );

      setState((prev) => {
        // Find the original message to preserve sender info
        const originalMsg = prev.messages.find(m => m.tempId === tempId);
        const mappedMessage: Message = {
          id: sentMessageDTO.id,
          conversationId: sentMessageDTO.conversationId,
          content: sentMessageDTO.content,
          createdAt: sentMessageDTO.createdAt,
          sender: originalMsg?.sender ?? { id: 'unknown', name: 'Unknown' },
          status: 'sent',
          tempId,
        };
        return {
          ...prev,
          messages: prev.messages.map((msg) =>
            msg.tempId === tempId ? mappedMessage : msg
          ),
          isSending: false,
        };
      });

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
        const result = await ChatService.listConversations({ limit: 100 });
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
