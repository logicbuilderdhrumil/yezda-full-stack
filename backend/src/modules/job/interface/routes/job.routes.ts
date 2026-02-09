import { Router } from 'express';
import type { JobController } from '../controllers/job.controller.js';
import { requireAuth } from '../../../../middleware/auth.middleware.js';

export function createJobRoutes(controller: JobController): Router {
  const router = Router();

  router.get('/', requireAuth, controller.listJobs);
  router.get('/:jobId', requireAuth, controller.getJobStatus);
  router.post('/:jobId/cancel', requireAuth, controller.cancelJob);

  return router;
}
