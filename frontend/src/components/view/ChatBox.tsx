/**
 * ChatBox view component - structured layout for chat interfaces.
 */
import {
  forwardRef,
  type ReactNode,
  type HTMLAttributes,
  type FormEvent,
  type KeyboardEvent,
  useState,
  useRef,
  useEffect,
} from 'react';
import { Send, Paperclip, Smile, MoreVertical, Check, CheckCheck, AlertCircle, Circle } from 'lucide-react';
import { cn } from '@/utils';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { ScrollArea } from '@/components/ui/ScrollArea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';

// ============================================================================
// TYPES
// ============================================================================

export interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  timestamp: Date;
  isOwn?: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
}

export interface MessageGroup {
  senderId: string;
  senderName: string;
  senderAvatar?: string | undefined;
  isOwn: boolean;
  messages: ChatMessage[];
  timestamp: Date;
}

// ============================================================================
// CHAT BOX CONTAINER
// ============================================================================

export interface ChatBoxProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/**
 * Main container for chat view layout.
 */
export const ChatBox = forwardRef<HTMLDivElement, ChatBoxProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col h-full overflow-hidden',
        'rounded-lg border border-gray-200 bg-white',
        'dark:border-gray-700 dark:bg-gray-800',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);

ChatBox.displayName = 'ChatBox';

// ============================================================================
// CHAT HEADER
// ============================================================================

export interface ChatHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /** Title text for the chat. */
  title: string;
  /** Subtitle or status text. */
  subtitle?: string;
  /** Avatar element or image URL. */
  avatar?: ReactNode | string;
  /** Actions to show in header menu. */
  actions?: Array<{
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  }>;
  /** Custom right-side content. */
  rightContent?: ReactNode;
}

/**
 * Header section for chat box.
 */
export const ChatHeader = forwardRef<HTMLDivElement, ChatHeaderProps>(
  ({ className, title, subtitle, avatar, actions, rightContent, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center gap-3 px-4 py-3',
        'border-b border-gray-200 dark:border-gray-700',
        className
      )}
      {...props}
    >
      {avatar && (
        <div className="flex-shrink-0">
          {typeof avatar === 'string' ? (
            <img
              src={avatar}
              alt={title}
              className="h-10 w-10 rounded-full object-cover"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (
            avatar
          )}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {subtitle}
          </p>
        )}
      </div>

      {rightContent}

      {actions && actions.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Chat options">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {actions.map((action, index) => (
              <DropdownMenuItem key={index} onClick={action.onClick}>
                {action.icon}
                <span>{action.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
);

ChatHeader.displayName = 'ChatHeader';

// ============================================================================
// MESSAGE LIST
// ============================================================================

export interface MessageListProps extends HTMLAttributes<HTMLDivElement> {
  /** Messages to display. */
  messages: ChatMessage[];
  /** Current user ID for identifying own messages. */
  currentUserId?: string;
  /** Render function for individual messages. */
  renderMessage?: (message: ChatMessage, isGrouped: boolean) => ReactNode;
  /** Whether to group consecutive messages from same sender. */
  groupMessages?: boolean;
  /** Time threshold for grouping messages (in minutes). */
  groupThresholdMinutes?: number;
  /** Loading state. */
  isLoading?: boolean;
  /** Empty state content. */
  emptyContent?: ReactNode;
  /** Title for empty state (i18n support). */
  emptyTitle?: string;
  /** Subtitle for empty state (i18n support). */
  emptySubtitle?: string;
}

/**
 * Groups messages from the same sender within a time threshold.
 */
function groupMessagesBySender(
  messages: ChatMessage[],
  thresholdMinutes: number = 5
): MessageGroup[] {
  if (messages.length === 0) return [];

  const groups: MessageGroup[] = [];
  let currentGroup: MessageGroup | null = null;

  for (const message of messages) {
    const shouldStartNewGroup =
      !currentGroup ||
      currentGroup.senderId !== message.senderId ||
      message.timestamp.getTime() - currentGroup.timestamp.getTime() >
        thresholdMinutes * 60 * 1000;

    if (shouldStartNewGroup) {
      if (currentGroup) {
        groups.push(currentGroup);
      }
      currentGroup = {
        senderId: message.senderId,
        senderName: message.senderName,
        senderAvatar: message.senderAvatar,
        isOwn: message.isOwn ?? false,
        messages: [message],
        timestamp: message.timestamp,
      };
    } else {
      currentGroup!.messages.push(message);
    }
  }

  if (currentGroup) {
    groups.push(currentGroup);
  }

  return groups;
}

/**
 * Scrollable message list with optional grouping.
 */
export const MessageList = forwardRef<HTMLDivElement, MessageListProps>(
  (
    {
      className,
      messages,
      currentUserId,
      renderMessage,
      groupMessages = true,
      groupThresholdMinutes = 5,
      isLoading,
      emptyContent,
      emptyTitle = 'No messages yet',
      emptySubtitle = 'Start the conversation!',
    },
    ref
  ) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
      if (scrollRef.current?.parentElement) {
        scrollRef.current.parentElement.scrollTop = scrollRef.current.parentElement.scrollHeight;
      }
    }, [messages.length]);

    // Mark messages with isOwn based on currentUserId
    const processedMessages = messages.map((msg) => ({
      ...msg,
      isOwn: msg.isOwn ?? msg.senderId === currentUserId,
    }));

    const groups = groupMessages
      ? groupMessagesBySender(processedMessages, groupThresholdMinutes)
      : null;

    const isEmpty = messages.length === 0 && !isLoading;

    return (
      <ScrollArea
        ref={ref}
        className={cn('flex-1', className)}
        viewportClassName="p-4"
      >
        <div ref={scrollRef} aria-live="polite" aria-atomic="false">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <span className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          )}

          {isEmpty &&
            (emptyContent || (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400">
                <p>{emptyTitle}</p>
                <p className="text-sm">{emptySubtitle}</p>
              </div>
            ))}

          {groups
            ? groups.map((group, groupIndex) => (
                <MessageGroupItem
                  key={`group-${group.senderId}-${groupIndex}`}
                  group={group}
                  renderMessage={renderMessage}
                />
              ))
            : processedMessages.map((message) =>
                renderMessage ? (
                  renderMessage(message, false)
                ) : (
                  <MessageItem key={message.id} message={message} />
                )
              )}
        </div>
      </ScrollArea>
    );
  }
);

MessageList.displayName = 'MessageList';

// ============================================================================
// MESSAGE GROUP ITEM
// ============================================================================

interface MessageGroupItemProps {
  group: MessageGroup;
  renderMessage?: ((message: ChatMessage, isGrouped: boolean) => ReactNode) | undefined;
}

function MessageGroupItem({
  group,
  renderMessage,
}: MessageGroupItemProps): ReactNode {
  return (
    <div
      className={cn(
        'flex gap-2 mb-4',
        group.isOwn ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {!group.isOwn && (
        <div className="flex-shrink-0 mt-auto">
          {group.senderAvatar ? (
            <img
              src={group.senderAvatar}
              alt={group.senderName}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                {group.senderName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      )}

      <div
        className={cn(
          'flex flex-col gap-1 max-w-[70%]',
          group.isOwn ? 'items-end' : 'items-start'
        )}
      >
        {!group.isOwn && (
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
            {group.senderName}
          </span>
        )}

        {group.messages.map((message, index) =>
          renderMessage ? (
            renderMessage(message, index > 0)
          ) : (
            <MessageItem
              key={message.id}
              message={message}
              isGrouped={index > 0}
            />
          )
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MESSAGE ITEM
// ============================================================================

export interface MessageItemProps {
  message: ChatMessage;
  isGrouped?: boolean;
}

/**
 * Individual message bubble.
 */
export function MessageItem({
  message,
  isGrouped = false,
}: MessageItemProps): ReactNode {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      className={cn(
        'px-3 py-2 rounded-2xl max-w-full break-words',
        message.isOwn
          ? 'bg-primary text-primary-foreground rounded-br-md'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-md',
        isGrouped && message.isOwn && 'rounded-tr-md',
        isGrouped && !message.isOwn && 'rounded-tl-md'
      )}
      data-testid="message-item"
    >
      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
      <div
        className={cn(
          'flex items-center gap-1 mt-1',
          message.isOwn ? 'justify-end' : 'justify-start'
        )}
      >
        <span className="text-xs opacity-70">{formatTime(message.timestamp)}</span>
        {message.isOwn && message.status && (
          <span className="text-xs opacity-70 inline-flex items-center">
            {message.status === 'sending' && <Circle className="h-3 w-3" aria-label="Sending" />}
            {message.status === 'sent' && <Check className="h-3 w-3" aria-label="Sent" />}
            {message.status === 'delivered' && <CheckCheck className="h-3 w-3" aria-label="Delivered" />}
            {message.status === 'read' && <CheckCheck className="h-3 w-3 text-blue-500" aria-label="Read" />}
            {message.status === 'error' && <AlertCircle className="h-3 w-3 text-red-500" aria-label="Error" />}
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// CHAT COMPOSER
// ============================================================================

export interface ChatComposerProps extends HTMLAttributes<HTMLFormElement> {
  /** Callback when message is submitted. */
  onSendMessage: (content: string) => void;
  /** Placeholder text. */
  placeholder?: string;
  /** Whether sending is disabled. */
  disabled?: boolean;
  /** Whether to show attachment button. */
  showAttachmentButton?: boolean;
  /** Callback when attachment button is clicked. */
  onAttachmentClick?: () => void;
  /** Whether to show emoji button. */
  showEmojiButton?: boolean;
  /** Callback when emoji button is clicked. */
  onEmojiClick?: () => void;
  /** Additional action buttons. */
  additionalActions?: ReactNode;
  /** Maximum character count (0 for unlimited). */
  maxLength?: number;
}

/**
 * Message composer with input and action buttons.
 */
export function ChatComposer({
  className,
  onSendMessage,
  placeholder = 'Type a message...',
  disabled = false,
  showAttachmentButton = true,
  onAttachmentClick,
  showEmojiButton = true,
  onEmojiClick,
  additionalActions,
  maxLength = 0,
  ...props
}: ChatComposerProps): ReactNode {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled) {
      onSendMessage(trimmedMessage);
      setMessage('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (maxLength === 0 || value.length <= maxLength) {
      setMessage(value);
    }

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const canSend = message.trim().length > 0 && !disabled;

  return (
    <form
      className={cn(
        'flex items-end gap-2 px-4 py-3',
        'border-t border-gray-200 dark:border-gray-700',
        className
      )}
      onSubmit={handleSubmit}
      {...props}
    >
      {showAttachmentButton && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onAttachmentClick}
          disabled={disabled}
          aria-label="Attach file"
        >
          <Paperclip className="h-5 w-5" />
        </Button>
      )}

      {showEmojiButton && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onEmojiClick}
          disabled={disabled}
          aria-label="Add emoji"
        >
          <Smile className="h-5 w-5" />
        </Button>
      )}

      {additionalActions}

      <div className="flex-1 relative">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          minRows={1}
          className="resize-none min-h-[40px] max-h-[120px] py-2"
          aria-label="Message input"
        />
        {maxLength > 0 && (
          <span
            role="status"
            aria-live="polite"
            className={cn(
              'absolute bottom-1 right-2 text-xs',
              message.length > maxLength * 0.9
                ? 'text-red-500'
                : 'text-gray-400'
            )}
          >
            {message.length}/{maxLength}
          </span>
        )}
      </div>

      <Button
        type="submit"
        size="icon"
        disabled={!canSend}
        aria-label="Send message"
      >
        <Send className="h-5 w-5" />
      </Button>
    </form>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export { groupMessagesBySender };
