/**
 * Screening Pipeline Module — Composition Root
 * Wires domain, application, infrastructure, and interface layers together.
 */

import { Router } from 'express';

// Infrastructure
import { InMemoryScreeningPipelineRepository } from './infrastructure/index.js';

// Application — use cases
import {
  ListPipelinesUseCase,
  GetPipelineUseCase,
  CreatePipelineUseCase,
  UpdatePipelineUseCase,
  ActivatePipelineUseCase,
  ArchivePipelineUseCase,
  DeletePipelineUseCase,
  AssignPipelineUseCase,
  CompleteStageUseCase,
  GetAssignmentProgressUseCase,
  GetCandidateAssignmentsUseCase,
} from './application/index.js';

// Interface
import { ScreeningPipelineController, createScreeningPipelineRouter } from './interface/index.js';

// Shared infrastructure adapters
import { auditService } from '../../services/audit.service.js';
import { metricsService } from '../../services/metrics.service.js';
import { moduleRegistry } from '../../services/module-registry.service.js';

// Port adapters
import type { IAuditService } from './domain/ports/audit-service.port.js';
import type { IMetricsService } from './domain/ports/metrics-service.port.js';
import type { IModuleRegistryService } from './domain/ports/module-registry-service.port.js';

// Adapt legacy singletons to module ports
const auditAdapter: IAuditService = {
  log: (entry) => auditService.log(entry as Parameters<typeof auditService.log>[0]),
  logAnomaly: (entry) => auditService.logAnomaly({ ...entry, channel: (entry.channel || 'api') as 'web' | 'mobile' | 'api' }),
};

const metricsAdapter: IMetricsService = {
  incrementCounter: (n, l) => metricsService.incrementCounter(n, l),
  recordLatency: (n, d, l) => metricsService.recordLatency(n, d, l),
  recordRedisError: (ctx) => metricsService.recordRedisError(ctx),
};

import type { ModuleType } from '../../../../shared/@types/pipeline-modules.js';

const moduleRegistryAdapter: IModuleRegistryService = {
  validate: (moduleType, config) => moduleRegistry.validate(moduleType as ModuleType, config),
};

// Wire up
const repository = new InMemoryScreeningPipelineRepository();

const listPipelines = new ListPipelinesUseCase(repository, auditAdapter, metricsAdapter);
const getPipeline = new GetPipelineUseCase(repository, auditAdapter, metricsAdapter);
const createPipeline = new CreatePipelineUseCase(repository, auditAdapter, metricsAdapter, moduleRegistryAdapter);
const updatePipeline = new UpdatePipelineUseCase(repository, auditAdapter, metricsAdapter, moduleRegistryAdapter);
const activatePipeline = new ActivatePipelineUseCase(repository, auditAdapter, metricsAdapter);
const archivePipeline = new ArchivePipelineUseCase(repository, auditAdapter, metricsAdapter);
const deletePipeline = new DeletePipelineUseCase(repository, auditAdapter, metricsAdapter);
const assignPipeline = new AssignPipelineUseCase(repository, auditAdapter, metricsAdapter);
const completeStage = new CompleteStageUseCase(repository, auditAdapter, metricsAdapter);
const getAssignmentProgress = new GetAssignmentProgressUseCase(repository, metricsAdapter);
const getCandidateAssignments = new GetCandidateAssignmentsUseCase(repository, metricsAdapter);

const controller = new ScreeningPipelineController({
  listPipelines,
  getPipeline,
  createPipeline,
  updatePipeline,
  activatePipeline,
  archivePipeline,
  deletePipeline,
  assignPipeline,
  getAssignmentProgress,
  getCandidateAssignments,
  completeStage,
});

export const screeningPipelineRouter: Router = createScreeningPipelineRouter(
  controller,
  auditAdapter,
  metricsAdapter,
);

// Re-export for tests
export { repository as screeningPipelineRepository };
