import { Router } from 'express';
import type { FirebaseController } from '../controllers/firebase.controller.js';
import { requireAuth } from '../../../../shared/infrastructure/middleware/index.js';
export function createFirebaseRoutes(ctrl: FirebaseController): Router {
  const r = Router();
  r.post('/tokens', requireAuth, ctrl.register);
  r.delete('/tokens', requireAuth, ctrl.unregister);
  r.get('/tokens', requireAuth, ctrl.listTokens);
  r.post('/dispatch', requireAuth, ctrl.dispatchNotification);
  return r;
}
