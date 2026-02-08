/**
 * Account Settings routes.
 */
import { Router } from 'express';
import type { AccountSettingsController } from '../controllers/account-settings.controller.js';
import { requireAuth } from '../../../../middleware/auth.middleware.js';

export function createAccountSettingsRoutes(controller: AccountSettingsController): Router {
  const router = Router();

  router.get('/profile', requireAuth, controller.getProfile);
  router.patch('/profile', requireAuth, controller.updateProfile);
  router.get('/integrations', requireAuth, controller.getIntegrations);
  router.get('/integrations/:provider', requireAuth, controller.getIntegration);
  router.post('/integrations/:provider/verify', requireAuth, controller.verifyIntegration);
  router.delete('/integrations/:provider', requireAuth, controller.disconnectIntegration);
  router.get('/health', controller.getHealthSummary);

  return router;
}
