/**
 * Screening Pipeline Routes
 * API endpoints for screening pipeline management
 */

import { Router } from 'express';
import * as screeningPipelineController from '../controllers/screening-pipeline.controller.js';
import { requireAuthGuard, requireRoleGuard } from '../middleware/route-guards.middleware.js';
import {
  validateBody,
  validateParams,
} from '../middleware/validation.middleware.js';
import {
  screeningPipelineListRateLimiter,
  screeningPipelineReadRateLimiter,
  screeningPipelineCreateRateLimiter,
  screeningPipelineUpdateRateLimiter,
  screeningPipelineDeleteRateLimiter,
  screeningPipelineAssignRateLimiter,
  screeningPipelineProgressRateLimiter,
} from '../middleware/screening-pipeline-rate-limit.middleware.js';
import {
  createPipelineSchema,
  updatePipelineSchema,
  assignPipelineSchema,
  pipelineIdParamSchema,
  assignmentIdParamSchema,
  candidateIdParamSchema,
  stageCompletionParamsSchema,
} from '../middleware/screening-pipeline-validation.middleware.js';

const router = Router();

// Auth and role guards for pipeline viewing
const authAndViewGuards = [
  requireAuthGuard,
  requireRoleGuard('platform_admin', 'platform_manager', 'platform_agent'),
];

// Auth and role guards for pipeline management (create/update/delete)
const authAndManageGuards = [
  requireAuthGuard,
  requireRoleGuard('platform_admin', 'platform_manager'),
];

// ========================================
// Pipeline CRUD routes
// ========================================

// GET /api/v1/screening-pipelines - List all pipelines
router.get(
  '/',
  ...authAndViewGuards,
  screeningPipelineListRateLimiter,
  screeningPipelineController.listPipelines
);

// POST /api/v1/screening-pipelines - Create a new pipeline
router.post(
  '/',
  ...authAndManageGuards,
  screeningPipelineCreateRateLimiter,
  validateBody(createPipelineSchema),
  screeningPipelineController.createPipeline
);

// GET /api/v1/screening-pipelines/:id - Get pipeline by ID
router.get(
  '/:id',
  ...authAndViewGuards,
  screeningPipelineReadRateLimiter,
  validateParams(pipelineIdParamSchema),
  screeningPipelineController.getPipeline
);

// PUT /api/v1/screening-pipelines/:id - Update a pipeline
router.put(
  '/:id',
  ...authAndManageGuards,
  screeningPipelineUpdateRateLimiter,
  validateParams(pipelineIdParamSchema),
  validateBody(updatePipelineSchema),
  screeningPipelineController.updatePipeline
);

// DELETE /api/v1/screening-pipelines/:id - Delete a pipeline
router.delete(
  '/:id',
  ...authAndManageGuards,
  screeningPipelineDeleteRateLimiter,
  validateParams(pipelineIdParamSchema),
  screeningPipelineController.deletePipeline
);

// ========================================
// Pipeline lifecycle routes
// ========================================

// PATCH /api/v1/screening-pipelines/:id/activate - Activate a pipeline
router.patch(
  '/:id/activate',
  ...authAndManageGuards,
  screeningPipelineUpdateRateLimiter,
  validateParams(pipelineIdParamSchema),
  screeningPipelineController.activatePipeline
);

// PATCH /api/v1/screening-pipelines/:id/archive - Archive a pipeline
router.patch(
  '/:id/archive',
  ...authAndManageGuards,
  screeningPipelineUpdateRateLimiter,
  validateParams(pipelineIdParamSchema),
  screeningPipelineController.archivePipeline
);

// ========================================
// Assignment routes
// ========================================

// POST /api/v1/screening-pipelines/:id/assign - Assign pipeline to candidate
router.post(
  '/:id/assign',
  ...authAndViewGuards, // Agents can assign
  screeningPipelineAssignRateLimiter,
  validateParams(pipelineIdParamSchema),
  validateBody(assignPipelineSchema),
  screeningPipelineController.assignPipeline
);

// GET /api/v1/screening-pipelines/assignments/:id/progress - Get assignment progress
router.get(
  '/assignments/:id/progress',
  ...authAndViewGuards,
  screeningPipelineProgressRateLimiter,
  validateParams(assignmentIdParamSchema),
  screeningPipelineController.getAssignmentProgress
);

// GET /api/v1/screening-pipelines/candidates/:candidateId/assignments - List candidate assignments
router.get(
  '/candidates/:candidateId/assignments',
  ...authAndViewGuards,
  screeningPipelineListRateLimiter,
  validateParams(candidateIdParamSchema),
  screeningPipelineController.getCandidateAssignments
);

// PATCH /api/v1/screening-pipelines/assignments/:assignmentId/stages/:stageId/complete - Complete a stage
router.patch(
  '/assignments/:assignmentId/stages/:stageId/complete',
  ...authAndViewGuards, // Agents can complete stages
  screeningPipelineProgressRateLimiter,
  validateParams(stageCompletionParamsSchema),
  screeningPipelineController.completeStage
);

export default router;
