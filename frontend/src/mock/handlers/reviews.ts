/**
 * Reviews endpoint mock handlers.
 */
import type MockAdapter from 'axios-mock-adapter';
import {
  reviewsListResponse,
  myQueueResponse,
  getReviewById,
} from '../fixtures/reviews';

/**
 * Registers review endpoint handlers on the mock adapter.
 * @param mock - The axios mock adapter instance
 */
export function registerReviewHandlers(mock: MockAdapter): void {
  // GET /api/v1/reviews/my-queue (register before generic list to avoid regex conflicts)
  mock.onGet('/api/v1/reviews/my-queue').reply(200, myQueueResponse);

  // GET /api/v1/reviews
  mock.onGet('/api/v1/reviews').reply(200, reviewsListResponse);

  // GET /api/v1/reviews/:id
  mock.onGet(/\/api\/v1\/reviews\/([^/]+)$/).reply((config) => {
    const match = config.url?.match(/\/api\/v1\/reviews\/([^/]+)$/);
    const id = match?.[1];
    if (id) {
      const review = getReviewById(id);
      if (review) {
        return [200, review];
      }
    }
    return [404, { error: 'Review not found' }];
  });

  // POST /api/v1/reviews/:id/decide
  mock.onPost(/\/api\/v1\/reviews\/([^/]+)\/decide$/).reply((config) => {
    const match = config.url?.match(/\/api\/v1\/reviews\/([^/]+)\/decide$/);
    const id = match?.[1];
    if (id) {
      const review = getReviewById(id);
      if (review) {
        const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
        return [200, {
          ...review,
          status: 'decided' as const,
          decision: body?.decision ?? 'approve',
          decisionNotes: body?.decisionNotes ?? null,
          decidedAt: new Date().toISOString(),
          decidedBy: '003',
        }];
      }
    }
    return [404, { error: 'Review not found' }];
  });

  // PATCH /api/v1/reviews/:id/assign
  mock.onPatch(/\/api\/v1\/reviews\/([^/]+)\/assign$/).reply((config) => {
    const match = config.url?.match(/\/api\/v1\/reviews\/([^/]+)\/assign$/);
    const id = match?.[1];
    if (id) {
      const review = getReviewById(id);
      if (review) {
        const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
        return [200, {
          ...review,
          status: 'assigned' as const,
          assigneeId: body?.assigneeId ?? '003',
        }];
      }
    }
    return [404, { error: 'Review not found' }];
  });
}
