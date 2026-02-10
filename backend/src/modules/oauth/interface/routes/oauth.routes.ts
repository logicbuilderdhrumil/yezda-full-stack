import { Router } from 'express';
import type { OAuthController } from '../controllers/oauth.controller.js';
import { requireAuth } from '../../../../shared/infrastructure/middleware/index.js';

export function createOAuthRoutes(controller: OAuthController): Router {
  const router = Router();

  router.get('/providers', controller.getProviders);
  router.post('/authorize/:provider', requireAuth, controller.authorize);
  router.get('/callback/:provider', controller.callback);
  router.get('/status/:provider', requireAuth, controller.status);
  router.get('/status', requireAuth, controller.allStatuses);
  router.delete('/integration/:provider', requireAuth, controller.disconnect);
  router.post('/refresh/:provider', requireAuth, controller.refresh);

  return router;
}
