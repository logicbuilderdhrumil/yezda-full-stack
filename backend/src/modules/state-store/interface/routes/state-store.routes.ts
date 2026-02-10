import { Router } from 'express';
import type { StateStoreController } from '../controllers/state-store.controller.js';
import { requireAuth } from '../../../../shared/infrastructure/middleware/index.js';

export function createStateStoreRoutes(controller: StateStoreController): Router {
  const router = Router();
  router.use(requireAuth);

  router.get('/', controller.getAllState);
  router.delete('/', controller.clearAllState);
  router.get('/preferences', controller.getPreferences);
  router.put('/preferences', controller.updatePreferences);
  router.patch('/preferences/:key', controller.updatePreference);
  router.get('/session', controller.getSessionState);
  router.put('/session', controller.updateSessionState);

  return router;
}
