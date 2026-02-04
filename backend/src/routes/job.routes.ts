/**
 * Job Routes
 * API endpoints for async job management.
 */

import { Router } from 'express';
import * as jobController from '../controllers/job.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateQuery } from '../middleware/validation.middleware.js';
import { jobStatusQuerySchema } from '../models/job.model.js';

const router = Router();

// GET /api/v1/jobs - List jobs
router.get(
  '/',
  requireAuth,
  validateQuery(jobStatusQuerySchema),
  jobController.listJobs
);

// GET /api/v1/jobs/:jobId - Get job status
router.get(
  '/:jobId',
  requireAuth,
  jobController.getJobStatus
);

// POST /api/v1/jobs/:jobId/cancel - Cancel a job
router.post(
  '/:jobId/cancel',
  requireAuth,
  jobController.cancelJob
);

export default router;
