/**
 * Chat endpoint mock handlers.
 */
import type MockAdapter from 'axios-mock-adapter';
import {
  conversationsListResponse,
  getConversationById,
  getConversationMessages,
} from '../fixtures/chat';

/**
 * Registers chat endpoint handlers on the mock adapter.
 * @param mock - The axios mock adapter instance
 */
export function registerChatHandlers(mock: MockAdapter): void {
  // GET /api/v1/chat/conversations/:id/messages
  mock.onGet(/\/api\/v1\/chat\/conversations\/([^/]+)\/messages$/).reply((config) => {
    const match = config.url?.match(/\/api\/v1\/chat\/conversations\/([^/]+)\/messages$/);
    const id = match?.[1];
    if (id) {
      const result = getConversationMessages(id);
      if (result) {
        return [200, result];
      }
    }
    return [404, { error: 'Conversation not found' }];
  });

  // GET /api/v1/chat/conversations/:id
  mock.onGet(/\/api\/v1\/chat\/conversations\/([^/]+)$/).reply((config) => {
    const match = config.url?.match(/\/api\/v1\/chat\/conversations\/([^/]+)$/);
    const id = match?.[1];
    if (id) {
      const conversation = getConversationById(id);
      if (conversation) {
        // Return without messages for the single conversation endpoint
        const { messages: _messages, ...rest } = conversation;
        return [200, rest];
      }
    }
    return [404, { error: 'Conversation not found' }];
  });

  // GET /api/v1/chat/conversations
  mock.onGet('/api/v1/chat/conversations').reply(200, conversationsListResponse);
}
