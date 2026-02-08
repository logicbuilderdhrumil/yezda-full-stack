import { Router } from 'express';
import type { ConsentController } from '../controllers/consent.controller.js';

export function createConsentRoutes(controller: ConsentController): Router {
  const router = Router();
  router.get('/prompt/:applicationId', controller.getPrompt);
  router.get('/', controller.getStatus);
  router.get('/:consentId', controller.getById);
  router.post('/', controller.submit);
  router.patch('/:consentId', controller.update);
  return router;
}
