/**
 * View components - page-specific specialized components.
 */

// Chat view components
export {
  ChatBox,
  ChatHeader,
  MessageList,
  MessageItem,
  ChatComposer,
  groupMessagesBySender,
  type ChatBoxProps,
  type ChatHeaderProps,
  type MessageListProps,
  type MessageItemProps,
  type ChatComposerProps,
  type ChatMessage,
  type MessageGroup,
} from './ChatBox';

// File icon component
export {
  FileIcon,
  getFileIcon,
  getExtension,
  FILE_ICON_MAP,
  MIME_ICON_MAP,
  type FileIconProps,
} from './FileIcon';
