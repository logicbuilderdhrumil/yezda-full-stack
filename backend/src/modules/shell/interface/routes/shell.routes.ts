import { Router } from 'express';
import type { ShellController } from '../controllers/shell.controller.js';
import { requireAuth } from '../../../../shared/infrastructure/middleware.js';

export function createShellRoutes(controller: ShellController): Router {
  const router = Router();
  router.get('/config', controller.getShellConfig);
  router.get('/policies', controller.getRoutePolicies);
  router.get('/preferences/defaults', controller.getPreferenceDefaults);
  router.get('/navigation', requireAuth, controller.getNavigation);
  router.get('/preferences', requireAuth, controller.getPreferences);
  router.put('/preferences', requireAuth, controller.updatePreferences);
  return router;
}
