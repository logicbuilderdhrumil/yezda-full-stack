/**
 * Screening Pipeline Routes
 * API endpoints wired to the module controller with rate limiting and validation.
 */

import { Router } from 'express';
import {
  requireAuthGuard,
  requireRoleGuard,
  validateBody,
  validateParams,
} from '../../../../shared/infrastructure/middleware/index.js';
import type { ScreeningPipelineController } from '../controllers/screening-pipeline.controller.js';
import {
  createPipelineSchema,
  updatePipelineSchema,
  assignPipelineSchema,
  pipelineIdParamSchema,
  assignmentIdParamSchema,
  candidateIdParamSchema,
  stageCompletionParamsSchema,
} from '../validators/screening-pipeline.validators.js';
import type { IAuditService } from '../../domain/ports/audit-service.port.js';
import type { IMetricsService } from '../../domain/ports/metrics-service.port.js';
import { createScreeningPipelineRateLimiter } from '../middleware/screening-pipeline-rate-limit.middleware.js';

export function createScreeningPipelineRouter(
  controller: ScreeningPipelineController,
  audit: IAuditService,
  metrics: IMetricsService,
): Router {
  const router = Router();

  const authAndViewGuards = [requireAuthGuard, requireRoleGuard('admin', 'manager', 'agent')];
  const authAndManageGuards = [requireAuthGuard, requireRoleGuard('admin', 'manager')];

  // Rate limiters with injected services
  const listRL = createScreeningPipelineRateLimiter('list', audit, metrics);
  const readRL = createScreeningPipelineRateLimiter('read', audit, metrics);
  const createRL = createScreeningPipelineRateLimiter('create', audit, metrics);
  const updateRL = createScreeningPipelineRateLimiter('update', audit, metrics);
  const deleteRL = createScreeningPipelineRateLimiter('delete', audit, metrics);
  const assignRL = createScreeningPipelineRateLimiter('assign', audit, metrics);
  const progressRL = createScreeningPipelineRateLimiter('progress', audit, metrics);

  // Pipeline CRUD
  router.get('/', ...authAndViewGuards, listRL, controller.listPipelines);
  router.post('/', ...authAndManageGuards, createRL, validateBody(createPipelineSchema), controller.createPipeline);
  router.get('/:id', ...authAndViewGuards, readRL, validateParams(pipelineIdParamSchema), controller.getPipeline);
  router.put('/:id', ...authAndManageGuards, updateRL, validateParams(pipelineIdParamSchema), validateBody(updatePipelineSchema), controller.updatePipeline);
  router.delete('/:id', ...authAndManageGuards, deleteRL, validateParams(pipelineIdParamSchema), controller.deletePipeline);

  // Lifecycle
  router.patch('/:id/activate', ...authAndManageGuards, updateRL, validateParams(pipelineIdParamSchema), controller.activatePipeline);
  router.patch('/:id/archive', ...authAndManageGuards, updateRL, validateParams(pipelineIdParamSchema), controller.archivePipeline);

  // Assignments
  router.post('/:id/assign', ...authAndViewGuards, assignRL, validateParams(pipelineIdParamSchema), validateBody(assignPipelineSchema), controller.assignPipeline);
  router.get('/assignments/:id/progress', ...authAndViewGuards, progressRL, validateParams(assignmentIdParamSchema), controller.getAssignmentProgress);
  router.get('/candidates/:candidateId/assignments', ...authAndViewGuards, listRL, validateParams(candidateIdParamSchema), controller.getCandidateAssignments);
  router.patch('/assignments/:assignmentId/stages/:stageId/complete', ...authAndViewGuards, progressRL, validateParams(stageCompletionParamsSchema), controller.completeStage);

  return router;
}
