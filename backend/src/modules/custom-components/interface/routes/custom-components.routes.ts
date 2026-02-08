import { Router } from 'express';
import type { CustomComponentsController } from '../controllers/custom-components.controller.js';
import { requireAuth } from '../../../../shared/infrastructure/middleware.js';

export function createCustomComponentsRoutes(controller: CustomComponentsController): Router {
  const router = Router();
  router.use(requireAuth);

  router.get('/organizations', controller.listOrganizations);
  router.put('/organizations/active', controller.setActiveOrganization);
  router.get('/preferences/theme', controller.getThemePreference);
  router.put('/preferences/theme', controller.updateThemePreference);

  return router;
}
