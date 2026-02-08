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
}
