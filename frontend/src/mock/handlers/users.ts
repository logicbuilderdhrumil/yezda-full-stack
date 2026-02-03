/**
 * Users endpoint mock handlers.
 */
import type MockAdapter from 'axios-mock-adapter';
import {
  usersListResponse,
  getUserById,
  createUserResponse,
  updateUserResponse,
  deleteUserResponse,
} from '../fixtures/users';

/**
 * Registers user endpoint handlers on the mock adapter.
 * @param mock - The axios mock adapter instance
 */
export function registerUserHandlers(mock: MockAdapter): void {
  // GET /api/v1/users
  mock.onGet('/api/v1/users').reply(200, usersListResponse);

  // GET /api/v1/users/:id
  mock.onGet(/\/api\/v1\/users\/([^/]+)$/).reply((config) => {
    const match = config.url?.match(/\/api\/v1\/users\/([^/]+)$/);
    const id = match?.[1];
    if (id) {
      const user = getUserById(id);
      if (user) {
        return [200, { data: user }];
      }
    }
    return [404, { error: 'User not found' }];
  });

  // POST /api/v1/users
  mock.onPost('/api/v1/users').reply((config) => {
    const data = config.data ? JSON.parse(config.data) : {};
    const newUser = createUserResponse(data);
    return [201, { data: newUser }];
  });

  // PUT /api/v1/users/:id
  mock.onPut(/\/api\/v1\/users\/([^/]+)$/).reply((config) => {
    const match = config.url?.match(/\/api\/v1\/users\/([^/]+)$/);
    const id = match?.[1];
    const data = config.data ? JSON.parse(config.data) : {};
    if (id) {
      const updatedUser = updateUserResponse(id, data);
      if (updatedUser) {
        return [200, { data: updatedUser }];
      }
    }
    return [404, { error: 'User not found' }];
  });

  // PATCH /api/v1/users/:id
  mock.onPatch(/\/api\/v1\/users\/([^/]+)$/).reply((config) => {
    const match = config.url?.match(/\/api\/v1\/users\/([^/]+)$/);
    const id = match?.[1];
    const data = config.data ? JSON.parse(config.data) : {};
    if (id) {
      const updatedUser = updateUserResponse(id, data);
      if (updatedUser) {
        return [200, { data: updatedUser }];
      }
    }
    return [404, { error: 'User not found' }];
  });

  // DELETE /api/v1/users/:id
  mock.onDelete(/\/api\/v1\/users\/([^/]+)$/).reply((config) => {
    const match = config.url?.match(/\/api\/v1\/users\/([^/]+)$/);
    const id = match?.[1];
    if (id && getUserById(id)) {
      return [200, deleteUserResponse];
    }
    return [404, { error: 'User not found' }];
  });
}
