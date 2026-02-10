/**
 * Candidate Management Routes
 * Interface layer — Express router wired to controller instance.
 */

import { Router } from 'express';
import type { CandidateManagementController } from '../controllers/candidate-management.controller.js';
import {
  requireAuthGuard,
  requireRoleGuard,
  validateBody,
  validateQuery,
  validateParams,
} from '../../../../shared/infrastructure/middleware/index.js';
import {
  candidateManagementListRateLimiter,
  candidateManagementCreateRateLimiter,
  candidateManagementUpdateRateLimiter,
  candidateManagementDeleteRateLimiter,
  candidateManagementBulkRateLimiter,
  candidateSubmissionRateLimiter,
  candidateListCacheMiddleware,
} from '../middleware/candidate-management-rate-limit.middleware.js';
import {
  createCandidateSchema,
  updateCandidateSchema,
  updateCandidateStatusSchema,
  bulkCreateCandidatesSchema,
  candidateSubmissionSchema,
  candidateSearchQuerySchema,
  candidateIdParamSchema,
  tenantIdParamSchema,
  inviteCandidateSchema,
} from '../validators/candidate-management.validators.js';

export function createCandidateManagementRoutes(controller: CandidateManagementController): Router {
  const router = Router();

  const authAndRoleGuards = [
    requireAuthGuard,
    requireRoleGuard('platform_admin', 'platform_manager', 'platform_agent'),
  ];

  // GET /api/v1/candidates
  router.get(
    '/',
    ...authAndRoleGuards,
    candidateManagementListRateLimiter,
    candidateListCacheMiddleware,
    validateQuery(candidateSearchQuerySchema),
    controller.listCandidates,
  );

  // POST /api/v1/candidates
  router.post(
    '/',
    ...authAndRoleGuards,
    candidateManagementCreateRateLimiter,
    validateBody(createCandidateSchema),
    controller.createCandidate,
  );

  // POST /api/v1/candidates/bulk
  router.post(
    '/bulk',
    ...authAndRoleGuards,
    candidateManagementBulkRateLimiter,
    validateBody(bulkCreateCandidatesSchema),
    controller.bulkCreateCandidates,
  );

  // POST /api/v1/candidates/invite
  router.post(
    '/invite',
    ...authAndRoleGuards,
    candidateManagementCreateRateLimiter,
    validateBody(inviteCandidateSchema),
    controller.inviteCandidate,
  );

  // POST /api/v1/candidates/submit/:tenantId
  router.post(
    '/submit/:tenantId',
    candidateSubmissionRateLimiter,
    validateParams(tenantIdParamSchema),
    validateBody(candidateSubmissionSchema),
    controller.submitCandidateForm,
  );

  // GET /api/v1/candidates/:id
  router.get(
    '/:id',
    ...authAndRoleGuards,
    candidateManagementListRateLimiter,
    validateParams(candidateIdParamSchema),
    controller.getCandidateById,
  );

  // PATCH /api/v1/candidates/:id
  router.patch(
    '/:id',
    ...authAndRoleGuards,
    candidateManagementUpdateRateLimiter,
    validateParams(candidateIdParamSchema),
    validateBody(updateCandidateSchema),
    controller.updateCandidate,
  );

  // PATCH /api/v1/candidates/:id/status
  router.patch(
    '/:id/status',
    ...authAndRoleGuards,
    candidateManagementUpdateRateLimiter,
    validateParams(candidateIdParamSchema),
    validateBody(updateCandidateStatusSchema),
    controller.updateCandidateStatus,
  );

  // DELETE /api/v1/candidates/:id
  router.delete(
    '/:id',
    requireAuthGuard,
    requireRoleGuard('platform_admin'),
    candidateManagementDeleteRateLimiter,
    validateParams(candidateIdParamSchema),
    controller.deleteCandidate,
  );

  return router;
}
