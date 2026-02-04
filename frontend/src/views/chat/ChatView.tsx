/**
 * Chat View
 * Task 1.2: Build conversations list with search and unread counts
 * Task 1.3: Build message thread view with timestamps
 * Task 1.4: Implement message compose input and send action
 * Task 1.8: Add loading, empty, and error states
 */

import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { PageContainer } from '@/components/layouts';
import {
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  ScrollArea,
  Skeleton,
} from '@/components/ui';
import { formatRelativeTime, cn, debounce } from '@/utils';
import { useChat } from './useChat';
import { useAuthStore } from '@/store';
import type { Conversation, Message, MessageStatus } from '@/@types/chat';

// ============================================================================
// Conversation List Components
// ============================================================================

/**
 * Single conversation item in the list
 */
function ConversationItem({
  conversation,
  isSelected,
  onClick,
}: {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}): ReactNode {
  const hasUnread = conversation.unreadCount > 0;

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-800',
        'hover:bg-gray-50 dark:hover:bg-gray-800/50',
        isSelected && 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-l-blue-500'
      )}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-selected={isSelected}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300">
          {conversation.title.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4
            className={cn(
              'text-sm truncate',
              hasUnread
                ? 'font-semibold text-gray-900 dark:text-gray-100'
                : 'font-medium text-gray-700 dark:text-gray-300'
            )}
          >
            {conversation.title}
          </h4>
          {conversation.lastMessage && (
            <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
              {formatRelativeTime(conversation.lastMessage.createdAt)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
            {conversation.lastMessage?.content || 'No messages yet'}
          </p>
          {hasUnread && (
            <Badge variant="default" className="text-xs min-w-[20px] justify-center">
              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for conversation items
 */
function ConversationSkeleton(): ReactNode {
  return (
    <div className="flex items-center gap-3 p-3 border-b border-gray-100 dark:border-gray-800">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

// ============================================================================
// Message Thread Components
// ============================================================================

/**
 * Status icon for message delivery state
 */
function MessageStatusIcon({ status }: { status: MessageStatus }): ReactNode {
  const icons: Record<MessageStatus, ReactNode> = {
    sending: (
      <svg className="h-3 w-3 text-gray-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
    sent: (
      <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
    delivered: (
      <svg className="h-3 w-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7M5 13l4 4L19 7" />
      </svg>
    ),
    read: (
      <svg className="h-3 w-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7M5 13l4 4L19 7" />
      </svg>
    ),
    failed: (
      <svg className="h-3 w-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  };

  return icons[status];
}

/**
 * Single message bubble
 */
function MessageBubble({
  message,
  isOwnMessage,
  onRetry,
}: {
  message: Message;
  isOwnMessage: boolean;
  onRetry?: (() => void) | (() => Promise<void>) | undefined;
}): ReactNode {
  const isFailed = message.status === 'failed';

  return (
    <div
      className={cn(
        'flex gap-2 max-w-[75%]',
        isOwnMessage ? 'ml-auto flex-row-reverse' : 'mr-auto'
      )}
    >
      {/* Avatar (only for other users) */}
      {!isOwnMessage && (
        <div className="flex-shrink-0">
          <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
            {message.sender.name.charAt(0).toUpperCase()}
          </div>
        </div>
      )}

      {/* Message content */}
      <div className="flex flex-col gap-1">
        {!isOwnMessage && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {message.sender.name}
          </span>
        )}
        <div
          className={cn(
            'rounded-lg px-3 py-2 text-sm',
            isOwnMessage
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100',
            isFailed && 'opacity-60'
          )}
        >
          {message.content}
        </div>
        <div
          className={cn(
            'flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400',
            isOwnMessage ? 'justify-end' : 'justify-start'
          )}
        >
          <span>{formatRelativeTime(message.createdAt)}</span>
          {isOwnMessage && <MessageStatusIcon status={message.status} />}
          {isFailed && onRetry && (
            <button
              onClick={onRetry}
              className="text-red-500 hover:text-red-600 underline ml-1"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for messages
 */
function MessageSkeleton({ isOwn = false }: { isOwn?: boolean }): ReactNode {
  return (
    <div
      className={cn(
        'flex gap-2 max-w-[75%]',
        isOwn ? 'ml-auto flex-row-reverse' : 'mr-auto'
      )}
    >
      {!isOwn && <Skeleton className="h-8 w-8 rounded-full" />}
      <div className="space-y-1">
        <Skeleton className={cn('h-10 rounded-lg', isOwn ? 'w-48' : 'w-40')} />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

// ============================================================================
// Message Compose Component
// ============================================================================

/**
 * Message composition input and send button
 */
function MessageCompose({
  onSend,
  disabled,
  isSending,
}: {
  onSend: (content: string) => void;
  disabled?: boolean;
  isSending?: boolean;
}): ReactNode {
  const [content, setContent] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!content.trim() || disabled || isSending) return;

      onSend(content.trim());
      setContent('');
      inputRef.current?.focus();
    },
    [content, disabled, isSending, onSend]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (content.trim() && !disabled && !isSending) {
          onSend(content.trim());
          setContent('');
        }
      }
    },
    [content, disabled, isSending, onSend]
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
    >
      <Input
        ref={inputRef}
        type="text"
        placeholder="Type a message..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="flex-1"
        autoComplete="off"
      />
      <Button
        type="submit"
        disabled={!content.trim() || disabled || isSending}
        className="flex-shrink-0"
      >
        {isSending ? (
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        )}
        <span className="sr-only">Send message</span>
      </Button>
    </form>
  );
}

// ============================================================================
// Empty and Error States
// ============================================================================

/**
 * Empty state for no conversations
 */
function EmptyConversations({ hasSearch }: { hasSearch: boolean }): ReactNode {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 text-center px-4">
      <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-4 mb-4">
        <svg
          className="h-8 w-8 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
        {hasSearch ? 'No conversations found' : 'No conversations yet'}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {hasSearch
          ? 'Try adjusting your search query.'
          : 'Start a conversation to see it here.'}
      </p>
    </div>
  );
}

/**
 * Empty state for no messages
 */
function EmptyMessages(): ReactNode {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 text-center px-4">
      <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-4 mb-4">
        <svg
          className="h-8 w-8 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
        No messages yet
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Send a message to start the conversation.
      </p>
    </div>
  );
}

/**
 * Placeholder when no conversation is selected
 */
function NoConversationSelected(): ReactNode {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 text-center px-4">
      <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-4 mb-4">
        <svg
          className="h-8 w-8 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
        Select a conversation
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Choose a conversation from the list to start chatting.
      </p>
    </div>
  );
}

/**
 * Error state component
 */
function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}): ReactNode {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
      <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-4 mb-4">
        <svg
          className="h-8 w-8 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
        Something went wrong
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{message}</p>
      <Button onClick={onRetry} variant="outline">
        Try again
      </Button>
    </div>
  );
}

// ============================================================================
// Main Chat View Component
// ============================================================================

/**
 * ChatView displays conversations list and message thread.
 */
export function ChatView(): ReactNode {
  const {
    conversations,
    selectedConversationId,
    selectedConversation,
    messages,
    isLoadingConversations,
    isLoadingMessages,
    isLoadingMoreConversations,
    isLoadingMoreMessages,
    hasMoreConversations,
    hasMoreMessages,
    error,
    isSending,
    totalUnreadCount,
    loadConversations,
    selectConversation,
    loadMessages,
    sendMessage,
    retryMessage,
    markAsRead,
    clearError,
  } = useChat();

  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const loadConversationsRef = useRef(loadConversations);
  loadConversationsRef.current = loadConversations;

  // Get current user ID for message ownership check
  const { session } = useAuthStore();
  const currentUserId = session?.user?.id;

  // Debounced search - memoize the function
  // Type cast needed due to debounce utility's generic signature
  const debouncedSearchRef = useRef(
    debounce(((query: unknown) => {
      const q = query as string;
      loadConversationsRef.current(q ? { search: q } : undefined);
    }) as (...args: unknown[]) => unknown, 300)
  );

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversationId) {
      loadMessages();
      markAsRead();
    }
  }, [selectedConversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Handle search input change
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      setSearchQuery(query);
      debouncedSearchRef.current(query);
    },
    []
  );

  // Handle load more messages (scroll to top)
  const handleLoadMoreMessages = useCallback(() => {
    if (hasMoreMessages && !isLoadingMoreMessages) {
      loadMessages(true);
    }
  }, [hasMoreMessages, isLoadingMoreMessages, loadMessages]);

  return (
    <PageContainer
      title="Chat"
      description="Conversations with your team and candidates"
    >
      <Card className="flex h-[calc(100vh-12rem)] overflow-hidden">
        {/* Conversations sidebar */}
        <div className="w-80 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Search header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Messages
              </h2>
              {totalUnreadCount > 0 && (
                <Badge variant="default">{totalUnreadCount}</Badge>
              )}
            </div>
            <Input
              type="search"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full"
            />
          </div>

          {/* Conversations list */}
          <ScrollArea className="flex-1">
            {/* Loading state */}
            {isLoadingConversations && (
              <div>
                {Array.from({ length: 5 }).map((_, i) => (
                  <ConversationSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Error state */}
            {error && !isLoadingConversations && (
              <ErrorState
                message={error}
                onRetry={() => {
                  clearError();
                  loadConversations();
                }}
              />
            )}

            {/* Empty state */}
            {!isLoadingConversations &&
              !error &&
              conversations.length === 0 && (
                <EmptyConversations hasSearch={!!searchQuery} />
              )}

            {/* Conversations list */}
            {!isLoadingConversations && !error && conversations.length > 0 && (
              <>
                {conversations.map((conversation) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isSelected={selectedConversationId === conversation.id}
                    onClick={() => selectConversation(conversation.id)}
                  />
                ))}

                {/* Load more */}
                {hasMoreConversations && (
                  <div className="p-2 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => loadConversations(undefined, true)}
                      disabled={isLoadingMoreConversations}
                      className="w-full"
                    >
                      {isLoadingMoreConversations ? 'Loading...' : 'Load more'}
                    </Button>
                  </div>
                )}
              </>
            )}
          </ScrollArea>
        </div>

        {/* Message thread area */}
        <div className="flex-1 flex flex-col min-w-0">
          {!selectedConversationId ? (
            <NoConversationSelected />
          ) : (
            <>
              {/* Conversation header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {selectedConversation?.title || 'Loading...'}
                </h3>
                {selectedConversation && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedConversation.participants.length} participants
                  </p>
                )}
              </div>

              {/* Messages area */}
              <CardContent
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
              >
                {/* Load more messages */}
                {hasMoreMessages && (
                  <div className="text-center pb-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLoadMoreMessages}
                      disabled={isLoadingMoreMessages}
                    >
                      {isLoadingMoreMessages ? 'Loading...' : 'Load earlier messages'}
                    </Button>
                  </div>
                )}

                {/* Loading messages */}
                {isLoadingMessages && (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <MessageSkeleton key={i} isOwn={i % 2 === 0} />
                    ))}
                  </div>
                )}

                {/* Empty messages */}
                {!isLoadingMessages && messages.length === 0 && <EmptyMessages />}

                {/* Messages list */}
                {!isLoadingMessages &&
                  messages.map((message) => {
                    // Check if message is from current user or is a pending optimistic message
                    const isOwnMessage =
                      message.sender.id === currentUserId ||
                      message.tempId !== undefined;

                    return (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        isOwnMessage={isOwnMessage}
                        onRetry={
                          message.status === 'failed' && message.tempId
                            ? () => retryMessage(message.tempId!)
                            : undefined
                        }
                      />
                    );
                  })}

                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
              </CardContent>

              {/* Message compose */}
              <MessageCompose
                onSend={sendMessage}
                disabled={!selectedConversationId}
                isSending={isSending}
              />
            </>
          )}
        </div>
      </Card>
    </PageContainer>
  );
}
