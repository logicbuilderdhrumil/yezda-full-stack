/**
 * Screening Pipeline Tests
 * Comprehensive tests for pipeline CRUD, lifecycle, assignments, and progress tracking
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screeningPipelineService } from '../src/services/screening-pipeline.service.js';
import { screeningPipelineRepository } from '../src/repositories/screening-pipeline.repository.js';
import type {
  ScreeningPipeline,
  PipelineStage,
  PipelineAssignment,
  PipelineContext,
  CreatePipelineDto,
} from '../src/models/screening-pipeline.model.js';

// Mock the repository
vi.mock('../src/repositories/screening-pipeline.repository.js', () => ({
  screeningPipelineRepository: {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByIdAndTenant: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
    delete: vi.fn(),
    nameExists: vi.fn(),
    findAssignmentsByPipeline: vi.fn(),
    findAssignmentsByCandidate: vi.fn(),
    findAssignmentsByCandidateAndTenant: vi.fn(),
    findAssignmentById: vi.fn(),
    findAssignmentByIdAndTenant: vi.fn(),
    assignmentExists: vi.fn(),
    createAssignment: vi.fn(),
    updateAssignment: vi.fn(),
    updateStageStatus: vi.fn(),
    deleteAssignment: vi.fn(),
    clear: vi.fn(),
    countByTenant: vi.fn(),
    countAssignmentsByPipeline: vi.fn(),
  },
}));

// Helper to create a mock stage
function createMockStage(overrides: Partial<PipelineStage> = {}): PipelineStage {
  return {
    id: 'stage-1',
    pipelineId: 'pipeline-1',
    formDefinitionId: 'form-1',
    name: 'Test Stage',
    description: 'Test stage description',
    order: 0,
    isRequired: true,
    estimatedDurationMinutes: 30,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// Helper to create a mock pipeline
function createMockPipeline(overrides: Partial<ScreeningPipeline> = {}): ScreeningPipeline {
  return {
    id: 'pipeline-1',
    tenantId: 'tenant-1',
    name: 'Test Pipeline',
    description: 'Test pipeline description',
    stages: [
      createMockStage({ id: 'stage-1', order: 0, name: 'Stage 1' }),
      createMockStage({ id: 'stage-2', order: 1, name: 'Stage 2' }),
    ],
    status: 'draft',
    version: 1,
    createdBy: 'admin-user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// Helper to create a mock assignment
function createMockAssignment(overrides: Partial<PipelineAssignment> = {}): PipelineAssignment {
  return {
    id: 'assignment-1',
    tenantId: 'tenant-1',
    pipelineId: 'pipeline-1',
    candidateId: 'candidate-1',
    currentStageOrder: 0,
    status: 'in_progress',
    stageStatuses: {
      'stage-1': 'in_progress',
      'stage-2': 'pending',
    },
    progressPercentage: 0,
    assignedBy: 'admin-user-123',
    assignedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// Helper to create admin context
function createAdminContext(tenantId = 'tenant-1'): PipelineContext {
  return {
    actorId: 'admin-user-123',
    actorType: 'user',
    actorRoles: ['platform_admin'],
    tenantId,
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
    channel: 'api',
  };
}

// Helper to create manager context
function createManagerContext(tenantId = 'tenant-1'): PipelineContext {
  return {
    actorId: 'manager-user-456',
    actorType: 'user',
    actorRoles: ['platform_manager'],
    tenantId,
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
    channel: 'api',
  };
}

// Helper to create agent context
function createAgentContext(tenantId = 'tenant-1'): PipelineContext {
  return {
    actorId: 'agent-user-789',
    actorType: 'user',
    actorRoles: ['platform_agent'],
    tenantId,
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
    channel: 'api',
  };
}

// Helper to create viewer context (no pipeline permissions)
function createViewerContext(tenantId = 'tenant-1'): PipelineContext {
  return {
    actorId: 'viewer-user-000',
    actorType: 'user',
    actorRoles: ['platform_viewer'],
    tenantId,
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
    channel: 'api',
  };
}

describe('Screening Pipeline Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementations
    vi.mocked(screeningPipelineRepository.nameExists).mockResolvedValue(false);
    vi.mocked(screeningPipelineRepository.assignmentExists).mockResolvedValue(false);
    vi.mocked(screeningPipelineRepository.countAssignmentsByPipeline).mockResolvedValue(0);
  });

  describe('Pipeline CRUD', () => {
    describe('Create Pipeline', () => {
      it('should create a pipeline with admin role', async () => {
        const ctx = createAdminContext();
        const dto: CreatePipelineDto = {
          name: 'New Pipeline',
          description: 'A test pipeline',
          stages: [
            {
              formDefinitionId: 'form-1',
              name: 'Stage 1',
              order: 0,
              isRequired: true,
            },
          ],
        };

        vi.mocked(screeningPipelineRepository.create).mockImplementation(async (pipeline) => pipeline);

        const result = await screeningPipelineService.createPipeline(dto, ctx);

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data?.name).toBe('New Pipeline');
        expect(result.data?.status).toBe('draft');
        expect(result.data?.stages.length).toBe(1);
        expect(result.data?.tenantId).toBe('tenant-1');
        expect(result.data?.createdBy).toBe('admin-user-123');
      });

      it('should create a pipeline with manager role', async () => {
        const ctx = createManagerContext();
        const dto: CreatePipelineDto = {
          name: 'Manager Pipeline',
          stages: [
            {
              formDefinitionId: 'form-1',
              name: 'Stage 1',
              order: 0,
              isRequired: true,
            },
          ],
        };

        vi.mocked(screeningPipelineRepository.create).mockImplementation(async (pipeline) => pipeline);

        const result = await screeningPipelineService.createPipeline(dto, ctx);

        expect(result.success).toBe(true);
        expect(result.data?.name).toBe('Manager Pipeline');
      });

      it('should reject agent role creating pipelines', async () => {
        const ctx = createAgentContext();
        const dto: CreatePipelineDto = {
          name: 'Agent Pipeline',
          stages: [
            {
              formDefinitionId: 'form-1',
              name: 'Stage 1',
              order: 0,
              isRequired: true,
            },
          ],
        };

        const result = await screeningPipelineService.createPipeline(dto, ctx);

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('FORBIDDEN');
      });

      it('should reject viewer role creating pipelines', async () => {
        const ctx = createViewerContext();
        const dto: CreatePipelineDto = {
          name: 'Viewer Pipeline',
          stages: [
            {
              formDefinitionId: 'form-1',
              name: 'Stage 1',
              order: 0,
              isRequired: true,
            },
          ],
        };

        const result = await screeningPipelineService.createPipeline(dto, ctx);

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('FORBIDDEN');
      });

      it('should reject duplicate pipeline name in same tenant', async () => {
        const ctx = createAdminContext();
        vi.mocked(screeningPipelineRepository.nameExists).mockResolvedValue(true);

        const dto: CreatePipelineDto = {
          name: 'Duplicate Name',
          stages: [
            {
              formDefinitionId: 'form-1',
              name: 'Stage 1',
              order: 0,
              isRequired: true,
            },
          ],
        };

        const result = await screeningPipelineService.createPipeline(dto, ctx);

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('NAME_EXISTS');
      });
    });

    describe('List Pipelines', () => {
      it('should list all pipelines for tenant', async () => {
        const mockPipelines = [
          createMockPipeline({ id: 'p1', name: 'Pipeline 1' }),
          createMockPipeline({ id: 'p2', name: 'Pipeline 2' }),
        ];
        vi.mocked(screeningPipelineRepository.findAll).mockResolvedValue(mockPipelines);

        const ctx = createAdminContext();
        const result = await screeningPipelineService.listPipelines(ctx);

        expect(result.success).toBe(true);
        expect(result.data?.length).toBe(2);
      });

      it('should allow agent to list pipelines', async () => {
        vi.mocked(screeningPipelineRepository.findAll).mockResolvedValue([]);

        const ctx = createAgentContext();
        const result = await screeningPipelineService.listPipelines(ctx);

        expect(result.success).toBe(true);
      });

      it('should reject viewer listing pipelines', async () => {
        const ctx = createViewerContext();
        const result = await screeningPipelineService.listPipelines(ctx);

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('FORBIDDEN');
      });
    });

    describe('Get Pipeline', () => {
      it('should get pipeline by ID', async () => {
        const mockPipeline = createMockPipeline();
        vi.mocked(screeningPipelineRepository.findByIdAndTenant).mockResolvedValue(mockPipeline);

        const ctx = createAdminContext();
        const result = await screeningPipelineService.getPipeline('pipeline-1', ctx);

        expect(result.success).toBe(true);
        expect(result.data?.id).toBe('pipeline-1');
      });

      it('should return not found for non-existent pipeline', async () => {
        vi.mocked(screeningPipelineRepository.findByIdAndTenant).mockResolvedValue(undefined);

        const ctx = createAdminContext();
        const result = await screeningPipelineService.getPipeline('non-existent', ctx);

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('NOT_FOUND');
      });

      it('should enforce tenant isolation', async () => {
        // Pipeline exists in tenant-1, not visible from tenant-2
        vi.mocked(screeningPipelineRepository.findByIdAndTenant).mockResolvedValue(undefined);

        const ctx = createAdminContext('tenant-2');
        const result = await screeningPipelineService.getPipeline('pipeline-1', ctx);

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('NOT_FOUND');
      });
    });

    describe('Update Pipeline', () => {
      it('should update a draft pipeline', async () => {
        const existingPipeline = createMockPipeline({ status: 'draft' });
        vi.mocked(screeningPipelineRepository.findByIdAndTenant).mockResolvedValue(existingPipeline);
        vi.mocked(screeningPipelineRepository.update).mockResolvedValue({
          ...existingPipeline,
          name: 'Updated Name',
        });

        const ctx = createAdminContext();
        const result = await screeningPipelineService.updatePipeline(
          'pipeline-1',
          { name: 'Updated Name' },
          ctx
        );

        expect(result.success).toBe(true);
        expect(result.data?.name).toBe('Updated Name');
      });

      it('should reject updating an active pipeline', async () => {
        const existingPipeline = createMockPipeline({ status: 'active' });
        vi.mocked(screeningPipelineRepository.findByIdAndTenant).mockResolvedValue(existingPipeline);

        const ctx = createAdminContext();
        const result = await screeningPipelineService.updatePipeline(
          'pipeline-1',
          { name: 'New Name' },
          ctx
        );

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('NOT_EDITABLE');
      });

      it('should reject updating an archived pipeline', async () => {
        const existingPipeline = createMockPipeline({ status: 'archived' });
        vi.mocked(screeningPipelineRepository.findByIdAndTenant).mockResolvedValue(existingPipeline);

        const ctx = createAdminContext();
        const result = await screeningPipelineService.updatePipeline(
          'pipeline-1',
          { name: 'New Name' },
          ctx
        );

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('NOT_EDITABLE');
      });

      it('should reject agent updating pipelines', async () => {
        const ctx = createAgentContext();
        const result = await screeningPipelineService.updatePipeline(
          'pipeline-1',
          { name: 'New Name' },
          ctx
        );

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('FORBIDDEN');
      });
    });

    describe('Delete Pipeline', () => {
      it('should delete a draft pipeline', async () => {
        const existingPipeline = createMockPipeline({ status: 'draft' });
        vi.mocked(screeningPipelineRepository.findByIdAndTenant).mockResolvedValue(existingPipeline);
        vi.mocked(screeningPipelineRepository.delete).mockResolvedValue(true);

        const ctx = createAdminContext();
        const result = await screeningPipelineService.deletePipeline('pipeline-1', ctx);

        expect(result.success).toBe(true);
      });

      it('should reject deleting an active pipeline', async () => {
        const existingPipeline = createMockPipeline({ status: 'active' });
        vi.mocked(screeningPipelineRepository.findByIdAndTenant).mockResolvedValue(existingPipeline);

        const ctx = createAdminContext();
        const result = await screeningPipelineService.deletePipeline('pipeline-1', ctx);

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('NOT_DELETABLE');
      });

      it('should reject deleting pipeline with existing assignments', async () => {
        const existingPipeline = createMockPipeline({ status: 'draft' });
        vi.mocked(screeningPipelineRepository.findByIdAndTenant).mockResolvedValue(existingPipeline);
        vi.mocked(screeningPipelineRepository.countAssignmentsByPipeline).mockResolvedValue(5);

        const ctx = createAdminContext();
        const result = await screeningPipelineService.deletePipeline('pipeline-1', ctx);

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('HAS_ASSIGNMENTS');
      });
    });
  });

  describe('Pipeline Lifecycle', () => {
    describe('Activate Pipeline', () => {
      it('should activate a draft pipeline with stages', async () => {
        const existingPipeline = createMockPipeline({ status: 'draft' });
        vi.mocked(screeningPipelineRepository.findByIdAndTenant).mockResolvedValue(existingPipeline);
        vi.mocked(screeningPipelineRepository.updateStatus).mockResolvedValue({
          ...existingPipeline,
          status: 'active',
        });

        const ctx = createAdminContext();
        const result = await screeningPipelineService.activatePipeline('pipeline-1', ctx);

        expect(result.success).toBe(true);
        expect(result.data?.status).toBe('active');
      });

      it('should reject activating pipeline without stages', async () => {
        const existingPipeline = createMockPipeline({ status: 'draft', stages: [] });
        vi.mocked(screeningPipelineRepository.findByIdAndTenant).mockResolvedValue(existingPipeline);

        const ctx = createAdminContext();
        const result = await screeningPipelineService.activatePipeline('pipeline-1', ctx);

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('NO_STAGES');
      });

      it('should reject activating already active pipeline', async () => {
        const existingPipeline = createMockPipeline({ status: 'active' });
        vi.mocked(screeningPipelineRepository.findByIdAndTenant).mockResolvedValue(existingPipeline);

        const ctx = createAdminContext();
        const result = await screeningPipelineService.activatePipeline('pipeline-1', ctx);

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('ALREADY_ACTIVE');
      });

      it('should reject activating archived pipeline', async () => {
        const existingPipeline = createMockPipeline({ status: 'archived' });
        vi.mocked(screeningPipelineRepository.findByIdAndTenant).mockResolvedValue(existingPipeline);

        const ctx = createAdminContext();
        const result = await screeningPipelineService.activatePipeline('pipeline-1', ctx);

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('ARCHIVED');
      });
    });

    describe('Archive Pipeline', () => {
      it('should archive an active pipeline', async () => {
        const existingPipeline = createMockPipeline({ status: 'active' });
        vi.mocked(screeningPipelineRepository.findByIdAndTenant).mockResolvedValue(existingPipeline);
        vi.mocked(screeningPipelineRepository.updateStatus).mockResolvedValue({
          ...existingPipeline,
          status: 'archived',
        });

        const ctx = createAdminContext();
        const result = await screeningPipelineService.archivePipeline('pipeline-1', ctx);

        expect(result.success).toBe(true);
        expect(result.data?.status).toBe('archived');
      });

      it('should archive a draft pipeline', async () => {
        const existingPipeline = createMockPipeline({ status: 'draft' });
        vi.mocked(screeningPipelineRepository.findByIdAndTenant).mockResolvedValue(existingPipeline);
        vi.mocked(screeningPipelineRepository.updateStatus).mockResolvedValue({
          ...existingPipeline,
          status: 'archived',
        });

        const ctx = createAdminContext();
        const result = await screeningPipelineService.archivePipeline('pipeline-1', ctx);

        expect(result.success).toBe(true);
        expect(result.data?.status).toBe('archived');
      });

      it('should reject archiving already archived pipeline', async () => {
        const existingPipeline = createMockPipeline({ status: 'archived' });
        vi.mocked(screeningPipelineRepository.findByIdAndTenant).mockResolvedValue(existingPipeline);

        const ctx = createAdminContext();
        const result = await screeningPipelineService.archivePipeline('pipeline-1', ctx);

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('ALREADY_ARCHIVED');
      });
    });
  });

  describe('Pipeline Assignment', () => {
    describe('Assign Pipeline', () => {
      it('should assign an active pipeline to a candidate', async () => {
        const existingPipeline = createMockPipeline({ status: 'active' });
        vi.mocked(screeningPipelineRepository.findByIdAndTenant).mockResolvedValue(existingPipeline);
        vi.mocked(screeningPipelineRepository.createAssignment).mockImplementation(async (assignment) => assignment);

        const ctx = createAdminContext();
        const result = await screeningPipelineService.assignPipeline('pipeline-1', 'candidate-1', ctx);

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data?.pipelineId).toBe('pipeline-1');
        expect(result.data?.candidateId).toBe('candidate-1');
        expect(result.data?.status).toBe('in_progress');
        expect(result.data?.currentStageOrder).toBe(0);
        expect(result.data?.progressPercentage).toBe(0);
      });

      it('should initialize stage statuses correctly', async () => {
        const existingPipeline = createMockPipeline({
          status: 'active',
          stages: [
            createMockStage({ id: 's1', order: 0 }),
            createMockStage({ id: 's2', order: 1 }),
            createMockStage({ id: 's3', order: 2 }),
          ],
        });
        vi.mocked(screeningPipelineRepository.findByIdAndTenant).mockResolvedValue(existingPipeline);
        vi.mocked(screeningPipelineRepository.createAssignment).mockImplementation(async (assignment) => assignment);

        const ctx = createAdminContext();
        const result = await screeningPipelineService.assignPipeline('pipeline-1', 'candidate-1', ctx);

        expect(result.success).toBe(true);
        expect(result.data?.stageStatuses['s1']).toBe('in_progress');
        expect(result.data?.stageStatuses['s2']).toBe('pending');
        expect(result.data?.stageStatuses['s3']).toBe('pending');
      });

      it('should allow agent to assign pipelines', async () => {
        const existingPipeline = createMockPipeline({ status: 'active' });
        vi.mocked(screeningPipelineRepository.findByIdAndTenant).mockResolvedValue(existingPipeline);
        vi.mocked(screeningPipelineRepository.createAssignment).mockImplementation(async (assignment) => assignment);

        const ctx = createAgentContext();
        const result = await screeningPipelineService.assignPipeline('pipeline-1', 'candidate-1', ctx);

        expect(result.success).toBe(true);
      });

      it('should reject assigning a draft pipeline', async () => {
        const existingPipeline = createMockPipeline({ status: 'draft' });
        vi.mocked(screeningPipelineRepository.findByIdAndTenant).mockResolvedValue(existingPipeline);

        const ctx = createAdminContext();
        const result = await screeningPipelineService.assignPipeline('pipeline-1', 'candidate-1', ctx);

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('NOT_ACTIVE');
      });

      it('should reject duplicate assignment', async () => {
        const existingPipeline = createMockPipeline({ status: 'active' });
        vi.mocked(screeningPipelineRepository.findByIdAndTenant).mockResolvedValue(existingPipeline);
        vi.mocked(screeningPipelineRepository.assignmentExists).mockResolvedValue(true);

        const ctx = createAdminContext();
        const result = await screeningPipelineService.assignPipeline('pipeline-1', 'candidate-1', ctx);

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('ALREADY_ASSIGNED');
      });

      it('should reject viewer assigning pipelines', async () => {
        const ctx = createViewerContext();
        const result = await screeningPipelineService.assignPipeline('pipeline-1', 'candidate-1', ctx);

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('FORBIDDEN');
      });
    });

    describe('Get Assignments by Candidate', () => {
      it('should list assignments for a candidate', async () => {
        const mockAssignments = [
          createMockAssignment({ id: 'a1', pipelineId: 'p1' }),
          createMockAssignment({ id: 'a2', pipelineId: 'p2' }),
        ];
        vi.mocked(screeningPipelineRepository.findAssignmentsByCandidateAndTenant).mockResolvedValue(mockAssignments);

        const ctx = createAdminContext();
        const result = await screeningPipelineService.getAssignmentsByCandidate('candidate-1', ctx);

        expect(result.success).toBe(true);
        expect(result.data?.length).toBe(2);
      });
    });
  });

  describe('Stage Progression', () => {
    describe('Complete Stage', () => {
      it('should complete the current stage and unlock next', async () => {
        const existingPipeline = createMockPipeline({
          status: 'active',
          stages: [
            createMockStage({ id: 's1', order: 0 }),
            createMockStage({ id: 's2', order: 1 }),
          ],
        });
        const existingAssignment = createMockAssignment({
          stageStatuses: { 's1': 'in_progress', 's2': 'pending' },
        });

        vi.mocked(screeningPipelineRepository.findAssignmentByIdAndTenant).mockResolvedValue(existingAssignment);
        vi.mocked(screeningPipelineRepository.findById).mockResolvedValue(existingPipeline);
        vi.mocked(screeningPipelineRepository.updateAssignment).mockImplementation(async (id, data) => ({
          ...existingAssignment,
          ...data,
        }));

        const ctx = createAdminContext();
        const result = await screeningPipelineService.completeStage('assignment-1', 's1', ctx);

        expect(result.success).toBe(true);
        expect(result.data?.stageStatuses['s1']).toBe('completed');
        expect(result.data?.stageStatuses['s2']).toBe('in_progress');
        expect(result.data?.progressPercentage).toBe(50);
      });

      it('should complete assignment when last stage is completed', async () => {
        const existingPipeline = createMockPipeline({
          status: 'active',
          stages: [
            createMockStage({ id: 's1', order: 0 }),
            createMockStage({ id: 's2', order: 1 }),
          ],
        });
        const existingAssignment = createMockAssignment({
          stageStatuses: { 's1': 'completed', 's2': 'in_progress' },
          currentStageOrder: 1,
          progressPercentage: 50,
        });

        vi.mocked(screeningPipelineRepository.findAssignmentByIdAndTenant).mockResolvedValue(existingAssignment);
        vi.mocked(screeningPipelineRepository.findById).mockResolvedValue(existingPipeline);
        vi.mocked(screeningPipelineRepository.updateAssignment).mockImplementation(async (id, data) => ({
          ...existingAssignment,
          ...data,
        }));

        const ctx = createAdminContext();
        const result = await screeningPipelineService.completeStage('assignment-1', 's2', ctx);

        expect(result.success).toBe(true);
        expect(result.data?.stageStatuses['s1']).toBe('completed');
        expect(result.data?.stageStatuses['s2']).toBe('completed');
        expect(result.data?.status).toBe('completed');
        expect(result.data?.progressPercentage).toBe(100);
        expect(result.data?.completedAt).toBeDefined();
      });

      it('should reject completing a stage that is not in_progress', async () => {
        const existingPipeline = createMockPipeline({
          status: 'active',
          stages: [
            createMockStage({ id: 's1', order: 0 }),
            createMockStage({ id: 's2', order: 1 }),
          ],
        });
        const existingAssignment = createMockAssignment({
          stageStatuses: { 's1': 'in_progress', 's2': 'pending' },
        });

        vi.mocked(screeningPipelineRepository.findAssignmentByIdAndTenant).mockResolvedValue(existingAssignment);
        vi.mocked(screeningPipelineRepository.findById).mockResolvedValue(existingPipeline);

        const ctx = createAdminContext();
        const result = await screeningPipelineService.completeStage('assignment-1', 's2', ctx);

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('STAGE_NOT_IN_PROGRESS');
      });

      it('should reject completing stage for completed assignment', async () => {
        const existingAssignment = createMockAssignment({
          status: 'completed',
          stageStatuses: { 's1': 'completed', 's2': 'completed' },
        });

        vi.mocked(screeningPipelineRepository.findAssignmentByIdAndTenant).mockResolvedValue(existingAssignment);

        const ctx = createAdminContext();
        const result = await screeningPipelineService.completeStage('assignment-1', 's1', ctx);

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('NOT_IN_PROGRESS');
      });

      it('should allow agent to complete stages', async () => {
        const existingPipeline = createMockPipeline({
          status: 'active',
          stages: [createMockStage({ id: 's1', order: 0 })],
        });
        const existingAssignment = createMockAssignment({
          stageStatuses: { 's1': 'in_progress' },
        });

        vi.mocked(screeningPipelineRepository.findAssignmentByIdAndTenant).mockResolvedValue(existingAssignment);
        vi.mocked(screeningPipelineRepository.findById).mockResolvedValue(existingPipeline);
        vi.mocked(screeningPipelineRepository.updateAssignment).mockImplementation(async (id, data) => ({
          ...existingAssignment,
          ...data,
        }));

        const ctx = createAgentContext();
        const result = await screeningPipelineService.completeStage('assignment-1', 's1', ctx);

        expect(result.success).toBe(true);
      });
    });

    describe('Get Assignment Progress', () => {
      it('should return progress details', async () => {
        const existingPipeline = createMockPipeline({
          status: 'active',
          stages: [
            createMockStage({ id: 's1', order: 0, name: 'Stage 1' }),
            createMockStage({ id: 's2', order: 1, name: 'Stage 2' }),
            createMockStage({ id: 's3', order: 2, name: 'Stage 3' }),
          ],
        });
        const existingAssignment = createMockAssignment({
          stageStatuses: { 's1': 'completed', 's2': 'in_progress', 's3': 'pending' },
          progressPercentage: 33,
        });

        vi.mocked(screeningPipelineRepository.findAssignmentByIdAndTenant).mockResolvedValue(existingAssignment);
        vi.mocked(screeningPipelineRepository.findById).mockResolvedValue(existingPipeline);

        const ctx = createAdminContext();
        const result = await screeningPipelineService.getAssignmentProgress('assignment-1', ctx);

        expect(result.success).toBe(true);
        expect(result.data?.assignment).toBeDefined();
        expect(result.data?.pipeline).toBeDefined();
        expect(result.data?.currentStage?.id).toBe('s2');
        expect(result.data?.completedStages).toBe(1);
        expect(result.data?.totalStages).toBe(3);
      });

      it('should return null currentStage when all stages completed', async () => {
        const existingPipeline = createMockPipeline({
          status: 'active',
          stages: [
            createMockStage({ id: 's1', order: 0 }),
            createMockStage({ id: 's2', order: 1 }),
          ],
        });
        const existingAssignment = createMockAssignment({
          status: 'completed',
          stageStatuses: { 's1': 'completed', 's2': 'completed' },
          progressPercentage: 100,
        });

        vi.mocked(screeningPipelineRepository.findAssignmentByIdAndTenant).mockResolvedValue(existingAssignment);
        vi.mocked(screeningPipelineRepository.findById).mockResolvedValue(existingPipeline);

        const ctx = createAdminContext();
        const result = await screeningPipelineService.getAssignmentProgress('assignment-1', ctx);

        expect(result.success).toBe(true);
        expect(result.data?.currentStage).toBeNull();
        expect(result.data?.completedStages).toBe(2);
      });
    });
  });

  describe('Progress Calculation', () => {
    it('should calculate 0% for first stage in progress', async () => {
      const existingPipeline = createMockPipeline({
        status: 'active',
        stages: [
          createMockStage({ id: 's1', order: 0 }),
          createMockStage({ id: 's2', order: 1 }),
          createMockStage({ id: 's3', order: 2 }),
          createMockStage({ id: 's4', order: 3 }),
        ],
      });
      vi.mocked(screeningPipelineRepository.findByIdAndTenant).mockResolvedValue(existingPipeline);
      vi.mocked(screeningPipelineRepository.createAssignment).mockImplementation(async (assignment) => assignment);

      const ctx = createAdminContext();
      const result = await screeningPipelineService.assignPipeline('pipeline-1', 'candidate-1', ctx);

      expect(result.success).toBe(true);
      expect(result.data?.progressPercentage).toBe(0);
    });

    it('should calculate 25% after completing 1 of 4 stages', async () => {
      const existingPipeline = createMockPipeline({
        status: 'active',
        stages: [
          createMockStage({ id: 's1', order: 0 }),
          createMockStage({ id: 's2', order: 1 }),
          createMockStage({ id: 's3', order: 2 }),
          createMockStage({ id: 's4', order: 3 }),
        ],
      });
      const existingAssignment = createMockAssignment({
        stageStatuses: {
          's1': 'in_progress',
          's2': 'pending',
          's3': 'pending',
          's4': 'pending',
        },
      });

      vi.mocked(screeningPipelineRepository.findAssignmentByIdAndTenant).mockResolvedValue(existingAssignment);
      vi.mocked(screeningPipelineRepository.findById).mockResolvedValue(existingPipeline);
      vi.mocked(screeningPipelineRepository.updateAssignment).mockImplementation(async (id, data) => ({
        ...existingAssignment,
        ...data,
      }));

      const ctx = createAdminContext();
      const result = await screeningPipelineService.completeStage('assignment-1', 's1', ctx);

      expect(result.success).toBe(true);
      expect(result.data?.progressPercentage).toBe(25);
    });

    it('should calculate 100% when all stages completed', async () => {
      const existingPipeline = createMockPipeline({
        status: 'active',
        stages: [
          createMockStage({ id: 's1', order: 0 }),
          createMockStage({ id: 's2', order: 1 }),
        ],
      });
      const existingAssignment = createMockAssignment({
        stageStatuses: { 's1': 'completed', 's2': 'in_progress' },
        progressPercentage: 50,
      });

      vi.mocked(screeningPipelineRepository.findAssignmentByIdAndTenant).mockResolvedValue(existingAssignment);
      vi.mocked(screeningPipelineRepository.findById).mockResolvedValue(existingPipeline);
      vi.mocked(screeningPipelineRepository.updateAssignment).mockImplementation(async (id, data) => ({
        ...existingAssignment,
        ...data,
      }));

      const ctx = createAdminContext();
      const result = await screeningPipelineService.completeStage('assignment-1', 's2', ctx);

      expect(result.success).toBe(true);
      expect(result.data?.progressPercentage).toBe(100);
    });
  });

  describe('Validation Errors', () => {
    describe('Pipeline Validation', () => {
      it('should require at least one stage', async () => {
        // This is validated at the controller/validation level
        // Testing that the pipeline with no stages cannot be activated
        const existingPipeline = createMockPipeline({ status: 'draft', stages: [] });
        vi.mocked(screeningPipelineRepository.findByIdAndTenant).mockResolvedValue(existingPipeline);

        const ctx = createAdminContext();
        const result = await screeningPipelineService.activatePipeline('pipeline-1', ctx);

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('NO_STAGES');
      });
    });
  });

  describe('Tenant Isolation', () => {
    it('should enforce tenant isolation in list operation', async () => {
      vi.mocked(screeningPipelineRepository.findAll).mockImplementation(async (tenantId) =>
        [createMockPipeline({ tenantId })]
      );

      const ctx1 = createAdminContext('tenant-a');
      const ctx2 = createAdminContext('tenant-b');

      const result1 = await screeningPipelineService.listPipelines(ctx1);
      const result2 = await screeningPipelineService.listPipelines(ctx2);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.data?.[0].tenantId).toBe('tenant-a');
      expect(result2.data?.[0].tenantId).toBe('tenant-b');
    });

    it('should enforce tenant isolation in update operation', async () => {
      vi.mocked(screeningPipelineRepository.findByIdAndTenant).mockResolvedValue(undefined);

      const ctx = createAdminContext('tenant-different');
      const result = await screeningPipelineService.updatePipeline(
        'pipeline-1',
        { name: 'Hacked Name' },
        ctx
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should enforce tenant isolation in delete operation', async () => {
      vi.mocked(screeningPipelineRepository.findByIdAndTenant).mockResolvedValue(undefined);

      const ctx = createAdminContext('tenant-different');
      const result = await screeningPipelineService.deletePipeline('pipeline-1', ctx);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should enforce tenant isolation in assignment operations', async () => {
      vi.mocked(screeningPipelineRepository.findByIdAndTenant).mockResolvedValue(undefined);

      const ctx = createAdminContext('tenant-different');
      const result = await screeningPipelineService.assignPipeline('pipeline-1', 'candidate-1', ctx);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });
  });
});
