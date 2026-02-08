/**
 * Screening pipelines module mock fixtures.
 * Provides fake data for screening pipeline endpoints.
 * Aligned with ScreeningPipeline type in @/@types/pipeline.ts
 */

import type { ScreeningPipeline, PipelineStage, PipelineStatus } from '@/@types/pipeline';

/** Generate a mock pipeline stage. */
function createStage(id: string, overrides: Partial<PipelineStage> & Pick<PipelineStage, 'name' | 'order'>): PipelineStage {
  return {
    id,
    pipelineId: '',
    formDefinitionId: `form-${id}`,
    description: '',
    isRequired: true,
    createdAt: '2025-08-10T09:00:00.000Z',
    updatedAt: '2026-01-15T11:30:00.000Z',
    ...overrides,
  };
}

/** Generate a mock pipeline with given id. */
export function createMockPipeline(id: string, overrides?: Partial<ScreeningPipeline>): ScreeningPipeline {
  return {
    id,
    tenantId: 'tenant-001',
    name: `Pipeline ${id}`,
    description: `Description for pipeline ${id}`,
    status: 'active' as PipelineStatus,
    version: 1,
    stages: [],
    createdBy: 'user-001',
    createdAt: '2025-08-10T09:00:00.000Z',
    updatedAt: '2026-01-15T11:30:00.000Z',
    ...overrides,
  };
}

/** Predefined mock pipelines. */
export const mockPipelines: ScreeningPipeline[] = [
  createMockPipeline('pipe-001', {
    name: 'Standard Background Check',
    description: 'Full background check including identity, employment, and criminal records.',
    version: 3,
    stages: [
      createStage('stage-001', { pipelineId: 'pipe-001', name: 'Identity Verification', order: 1, moduleType: 'external_service' }),
      createStage('stage-002', { pipelineId: 'pipe-001', name: 'Employment History', order: 2, moduleType: 'human_review' }),
      createStage('stage-003', { pipelineId: 'pipe-001', name: 'Criminal Record Check', order: 3, moduleType: 'external_service' }),
      createStage('stage-004', { pipelineId: 'pipe-001', name: 'Reference Check', order: 4, moduleType: 'human_review', isRequired: false }),
      createStage('stage-005', { pipelineId: 'pipe-001', name: 'Final Review', order: 5, moduleType: 'human_review' }),
    ],
  }),
  createMockPipeline('pipe-002', {
    name: 'Quick Pre-Screen',
    description: 'Lightweight pre-screening for initial candidate evaluation.',
    version: 2,
    stages: [
      createStage('stage-006', { pipelineId: 'pipe-002', name: 'Document Upload', order: 1, moduleType: 'form' }),
      createStage('stage-007', { pipelineId: 'pipe-002', name: 'Automated ID Check', order: 2, moduleType: 'external_service' }),
    ],
  }),
  createMockPipeline('pipe-003', {
    name: 'Executive Screening',
    description: 'Comprehensive screening for senior leadership positions.',
    status: 'draft' as PipelineStatus,
    version: 1,
    stages: [
      createStage('stage-008', { pipelineId: 'pipe-003', name: 'Enhanced Identity Verification', order: 1, moduleType: 'external_service' }),
      createStage('stage-009', { pipelineId: 'pipe-003', name: 'Financial Background', order: 2, moduleType: 'external_service' }),
      createStage('stage-010', { pipelineId: 'pipe-003', name: 'Media & Reputation Check', order: 3, moduleType: 'human_review' }),
      createStage('stage-011', { pipelineId: 'pipe-003', name: 'Board Review', order: 4, moduleType: 'human_review' }),
    ],
  }),
];

/** Mock paginated pipelines list response (includes stages for count display). */
export const pipelinesListResponse = {
  data: mockPipelines,
  meta: {
    page: 1,
    limit: 10,
    total: mockPipelines.length,
    totalPages: 1,
  },
};

/** Get a single pipeline by ID. */
export function getPipelineById(id: string): ScreeningPipeline | undefined {
  return mockPipelines.find((p) => p.id === id);
}

/** Mock pipeline creation response. */
export function createPipelineResponse(data: Partial<ScreeningPipeline>): ScreeningPipeline {
  const id = `pipe-${String(mockPipelines.length + 1).padStart(3, '0')}`;
  return createMockPipeline(id, {
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

/** Mock pipeline update response. */
export function updatePipelineResponse(id: string, data: Partial<ScreeningPipeline>): ScreeningPipeline | undefined {
  const pipeline = getPipelineById(id);
  if (pipeline) {
    return { ...pipeline, ...data, updatedAt: new Date().toISOString() };
  }
  return undefined;
}
