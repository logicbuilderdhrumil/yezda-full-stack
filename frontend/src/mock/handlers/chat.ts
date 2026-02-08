/**
 * Chat endpoint mock handlers.
 * Returns data matching ConversationDTO / MessageDTO contracts.
 */
import type MockAdapter from 'axios-mock-adapter';
import type { ConversationDTO } from '@/@types/contracts';
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
        // Strip embedded messages – return ConversationDTO shape only
        const { messages: _messages, ...dto }: { messages?: unknown } & ConversationDTO = conversation;
        return [200, dto];
      }
    }
    return [404, { error: 'Conversation not found' }];
  });

  // POST /api/v1/chat/conversations/:id/read
  mock.onPost(/\/api\/v1\/chat\/conversations\/([^/]+)\/read$/).reply(200, { success: true });

  // GET /api/v1/chat/conversations
  mock.onGet('/api/v1/chat/conversations').reply(200, conversationsListResponse);
}
