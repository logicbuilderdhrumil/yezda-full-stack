/**
 * Screening pipelines endpoint mock handlers.
 */
import type MockAdapter from 'axios-mock-adapter';
import {
  pipelinesListResponse,
  getPipelineById,
  createPipelineResponse,
  updatePipelineResponse,
} from '../fixtures/pipelines';

/**
 * Registers screening pipeline endpoint handlers on the mock adapter.
 * @param mock - The axios mock adapter instance
 */
export function registerPipelineHandlers(mock: MockAdapter): void {
  // GET /api/v1/screening-pipelines
  mock.onGet('/api/v1/screening-pipelines').reply(200, pipelinesListResponse);

  // GET /api/v1/screening-pipelines/:id
  mock.onGet(/\/api\/v1\/screening-pipelines\/([^/]+)$/).reply((config) => {
    const match = config.url?.match(/\/api\/v1\/screening-pipelines\/([^/]+)$/);
    const id = match?.[1];
    if (id) {
      const pipeline = getPipelineById(id);
      if (pipeline) {
        return [200, pipeline];
      }
    }
    return [404, { error: 'Pipeline not found' }];
  });

  // POST /api/v1/screening-pipelines
  mock.onPost('/api/v1/screening-pipelines').reply((config) => {
    const data = config.data ? JSON.parse(config.data) : {};
    const newPipeline = createPipelineResponse(data);
    return [201, newPipeline];
  });

  // PUT /api/v1/screening-pipelines/:id
  mock.onPut(/\/api\/v1\/screening-pipelines\/([^/]+)$/).reply((config) => {
    const match = config.url?.match(/\/api\/v1\/screening-pipelines\/([^/]+)$/);
    const id = match?.[1];
    const data = config.data ? JSON.parse(config.data) : {};
    if (id) {
      const updated = updatePipelineResponse(id, data);
      if (updated) {
        return [200, updated];
      }
    }
    return [404, { error: 'Pipeline not found' }];
  });

  // DELETE /api/v1/screening-pipelines/:id
  mock.onDelete(/\/api\/v1\/screening-pipelines\/([^/]+)$/).reply((config) => {
    const match = config.url?.match(/\/api\/v1\/screening-pipelines\/([^/]+)$/);
    const id = match?.[1];
    if (id && getPipelineById(id)) {
      return [204, null];
    }
    return [404, { error: 'Pipeline not found' }];
  });
}
