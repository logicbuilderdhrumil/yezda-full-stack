/**
 * Candidate Management Routes
 * Task 1.2, 1.3, 1.5, 1.7: Candidate management API endpoints
 */

import { Router } from 'express';
import * as candidateManagementController from '../controllers/candidate-management.controller.js';
import { requireAuthGuard, requireRoleGuard } from '../middleware/route-guards.middleware.js';
import {
  validateBody,
  validateQuery,
  validateParams,
} from '../middleware/validation.middleware.js';
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
} from '../middleware/candidate-management-validation.middleware.js';

const router = Router();

// All candidate management endpoints require authentication and admin/manager/agent role
const authAndRoleGuards = [
  requireAuthGuard,
  requireRoleGuard('platform_admin', 'platform_manager', 'platform_agent'),
];

// GET /api/v1/candidates - List candidates with search, filter, and pagination
// Task 1.7: Rate limiting and caching applied
router.get(
  '/',
  ...authAndRoleGuards,
  candidateManagementListRateLimiter,
  candidateListCacheMiddleware,
  validateQuery(candidateSearchQuerySchema),
  candidateManagementController.listCandidates
);

// POST /api/v1/candidates - Create a new candidate
router.post(
  '/',
  ...authAndRoleGuards,
  candidateManagementCreateRateLimiter,
  validateBody(createCandidateSchema),
  candidateManagementController.createCandidate
);

// POST /api/v1/candidates/bulk - Bulk create candidates
// Task 1.3: Bulk-create endpoint
router.post(
  '/bulk',
  ...authAndRoleGuards,
  candidateManagementBulkRateLimiter,
  validateBody(bulkCreateCandidatesSchema),
  candidateManagementController.bulkCreateCandidates
);

// POST /api/v1/candidates/submit/:tenantId - Public submission form endpoint
// Task 1.3: Public submission form endpoint (no auth required)
router.post(
  '/submit/:tenantId',
  candidateSubmissionRateLimiter,
  validateParams(tenantIdParamSchema),
  validateBody(candidateSubmissionSchema),
  candidateManagementController.submitCandidateForm
);

// GET /api/v1/candidates/:id - Get candidate details
router.get(
  '/:id',
  ...authAndRoleGuards,
  candidateManagementListRateLimiter,
  validateParams(candidateIdParamSchema),
  candidateManagementController.getCandidateById
);

// PATCH /api/v1/candidates/:id - Update candidate details
router.patch(
  '/:id',
  ...authAndRoleGuards,
  candidateManagementUpdateRateLimiter,
  validateParams(candidateIdParamSchema),
  validateBody(updateCandidateSchema),
  candidateManagementController.updateCandidate
);

// PATCH /api/v1/candidates/:id/status - Update candidate status
router.patch(
  '/:id/status',
  ...authAndRoleGuards,
  candidateManagementUpdateRateLimiter,
  validateParams(candidateIdParamSchema),
  validateBody(updateCandidateStatusSchema),
  candidateManagementController.updateCandidateStatus
);

// DELETE /api/v1/candidates/:id - Delete a candidate (admin only)
router.delete(
  '/:id',
  requireAuthGuard,
  requireRoleGuard('platform_admin'), // Only admins can delete
  candidateManagementDeleteRateLimiter,
  validateParams(candidateIdParamSchema),
  candidateManagementController.deleteCandidate
);

export default router;
