/**
 * Forms endpoint mock handlers.
 */
import type MockAdapter from 'axios-mock-adapter';
import {
  formsListResponse,
  getFormById,
  createFormResponse,
} from '../fixtures/forms';

/**
 * Registers form endpoint handlers on the mock adapter.
 * @param mock - The axios mock adapter instance
 */
export function registerFormHandlers(mock: MockAdapter): void {
  // GET /api/v1/forms
  mock.onGet('/api/v1/forms').reply(200, formsListResponse);

  // GET /api/v1/forms/:id
  mock.onGet(/\/api\/v1\/forms\/([^/]+)$/).reply((config) => {
    const match = config.url?.match(/\/api\/v1\/forms\/([^/]+)$/);
    const id = match?.[1];
    if (id) {
      const form = getFormById(id);
      if (form) {
        return [200, form];
      }
    }
    return [404, { error: 'Form not found' }];
  });

  // POST /api/v1/forms
  mock.onPost('/api/v1/forms').reply((config) => {
    const data = config.data ? JSON.parse(config.data) : {};
    const newForm = createFormResponse(data);
    return [201, newForm];
  });
}
