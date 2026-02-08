/**
 * Organizations endpoint mock handlers.
 */
import type MockAdapter from 'axios-mock-adapter';
import {
  organizationsListResponse,
  getOrganizationById,
  createOrganizationResponse,
  updateOrganizationResponse,
} from '../fixtures/organizations';

/**
 * Registers organization endpoint handlers on the mock adapter.
 * @param mock - The axios mock adapter instance
 */
export function registerOrganizationHandlers(mock: MockAdapter): void {
  // GET /api/v1/organizations
  mock.onGet('/api/v1/organizations').reply(200, organizationsListResponse);

  // GET /api/v1/organizations/:id
  mock.onGet(/\/api\/v1\/organizations\/([^/]+)$/).reply((config) => {
    const match = config.url?.match(/\/api\/v1\/organizations\/([^/]+)$/);
    const id = match?.[1];
    if (id) {
      const org = getOrganizationById(id);
      if (org) {
        return [200, org];
      }
    }
    return [404, { error: 'Organization not found' }];
  });

  // POST /api/v1/organizations
  mock.onPost('/api/v1/organizations').reply((config) => {
    const data = config.data ? JSON.parse(config.data) : {};
    const newOrg = createOrganizationResponse(data);
    return [201, newOrg];
  });

  // PATCH /api/v1/organizations/:id
  mock.onPatch(/\/api\/v1\/organizations\/([^/]+)$/).reply((config) => {
    const match = config.url?.match(/\/api\/v1\/organizations\/([^/]+)$/);
    const id = match?.[1];
    const data = config.data ? JSON.parse(config.data) : {};
    if (id) {
      const updated = updateOrganizationResponse(id, data);
      if (updated) {
        return [200, updated];
      }
    }
    return [404, { error: 'Organization not found' }];
  });

  // DELETE /api/v1/organizations/:id
  mock.onDelete(/\/api\/v1\/organizations\/([^/]+)$/).reply((config) => {
    const match = config.url?.match(/\/api\/v1\/organizations\/([^/]+)$/);
    const id = match?.[1];
    if (id && getOrganizationById(id)) {
      return [204, null];
    }
    return [404, { error: 'Organization not found' }];
  });
}
