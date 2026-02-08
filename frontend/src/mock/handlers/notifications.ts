/**
 * Notifications endpoint mock handlers.
 */
import type MockAdapter from 'axios-mock-adapter';
import {
  notificationsListResponse,
  unreadCountResponse,
} from '../fixtures/notifications';

/**
 * Registers notification endpoint handlers on the mock adapter.
 * @param mock - The axios mock adapter instance
 */
export function registerNotificationHandlers(mock: MockAdapter): void {
  // GET /api/v1/notifications/unread-count (register before the list to avoid regex conflicts)
  mock.onGet('/api/v1/notifications/unread-count').reply(200, unreadCountResponse);

  // GET /api/v1/notifications
  mock.onGet('/api/v1/notifications').reply(200, notificationsListResponse);

  // POST /api/v1/notifications/mark-read (mark all as read)
  mock.onPost('/api/v1/notifications/mark-read').reply(200, { success: true });

  // POST /api/v1/notifications/:id/read (mark individual as read)
  mock.onPost(/\/api\/v1\/notifications\/.*\/read/).reply(200, { success: true });
}
