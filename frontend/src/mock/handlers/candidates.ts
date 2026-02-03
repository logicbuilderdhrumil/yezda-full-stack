/**
 * Candidates endpoint mock handlers.
 */
import type MockAdapter from 'axios-mock-adapter';
import {
  candidatesListResponse,
  getCandidateById,
  createCandidateResponse,
  updateCandidateResponse,
  deleteCandidateResponse,
} from '../fixtures/candidates';

/**
 * Registers candidate endpoint handlers on the mock adapter.
 * @param mock - The axios mock adapter instance
 */
export function registerCandidateHandlers(mock: MockAdapter): void {
  // GET /api/v1/candidates
  mock.onGet('/api/v1/candidates').reply(200, candidatesListResponse);

  // GET /api/v1/candidates/:id
  mock.onGet(/\/api\/v1\/candidates\/([^/]+)$/).reply((config) => {
    const match = config.url?.match(/\/api\/v1\/candidates\/([^/]+)$/);
    const id = match?.[1];
    if (id) {
      const candidate = getCandidateById(id);
      if (candidate) {
        return [200, { data: candidate }];
      }
    }
    return [404, { error: 'Candidate not found' }];
  });

  // POST /api/v1/candidates
  mock.onPost('/api/v1/candidates').reply((config) => {
    const data = config.data ? JSON.parse(config.data) : {};
    const newCandidate = createCandidateResponse(data);
    return [201, { data: newCandidate }];
  });

  // PUT /api/v1/candidates/:id
  mock.onPut(/\/api\/v1\/candidates\/([^/]+)$/).reply((config) => {
    const match = config.url?.match(/\/api\/v1\/candidates\/([^/]+)$/);
    const id = match?.[1];
    const data = config.data ? JSON.parse(config.data) : {};
    if (id) {
      const updatedCandidate = updateCandidateResponse(id, data);
      if (updatedCandidate) {
        return [200, { data: updatedCandidate }];
      }
    }
    return [404, { error: 'Candidate not found' }];
  });

  // PATCH /api/v1/candidates/:id
  mock.onPatch(/\/api\/v1\/candidates\/([^/]+)$/).reply((config) => {
    const match = config.url?.match(/\/api\/v1\/candidates\/([^/]+)$/);
    const id = match?.[1];
    const data = config.data ? JSON.parse(config.data) : {};
    if (id) {
      const updatedCandidate = updateCandidateResponse(id, data);
      if (updatedCandidate) {
        return [200, { data: updatedCandidate }];
      }
    }
    return [404, { error: 'Candidate not found' }];
  });

  // DELETE /api/v1/candidates/:id
  mock.onDelete(/\/api\/v1\/candidates\/([^/]+)$/).reply((config) => {
    const match = config.url?.match(/\/api\/v1\/candidates\/([^/]+)$/);
    const id = match?.[1];
    if (id && getCandidateById(id)) {
      return [200, deleteCandidateResponse];
    }
    return [404, { error: 'Candidate not found' }];
  });
}
