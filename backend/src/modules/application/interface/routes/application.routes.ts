import { Router } from 'express';
import type { ApplicationController } from '../controllers/application.controller.js';

export function createApplicationRoutes(controller: ApplicationController): Router {
  const router = Router();
  router.get('/', controller.list);
  router.get('/:applicationId', controller.get);
  router.get('/:applicationId/draft', controller.getDraft);
  router.put('/:applicationId/draft', controller.saveDraft);
  router.post('/:applicationId/submit', controller.submit);
  return router;
}
