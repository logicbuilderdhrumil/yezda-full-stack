/**
 * Chat Feature Module
 *
 * Encapsulates chat pages, hooks, and services.
 */

// Pages
export { ChatView } from './pages/ChatView';

// Hooks (co-located with pages)
export {
  useChat,
  useUnreadChatCount,
  type UseChatConfig,
  type UseChatState,
  type UseChatActions,
  type UseChatReturn,
} from './pages/useChat';

// Services
export { ChatService, type MessageListOptions } from './services/ChatService';
