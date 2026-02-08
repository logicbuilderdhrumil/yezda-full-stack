/**
 * UI Kit routes.
 */
import { Router } from 'express';
import type { UIKitController } from '../controllers/ui-kit.controller.js';
import { optionalAuth } from '../../../../middleware/auth.middleware.js';

export function createUIKitRoutes(controller: UIKitController): Router {
  const router = Router();

  router.get('/themes', controller.getAvailableThemes);
  router.get('/categories', controller.getAvailableCategories);
  router.get('/config', optionalAuth, controller.getUIConfig);
  router.get('/themed-variants', optionalAuth, controller.getThemedVariants);
  router.get('/health', controller.getUIKitHealth);

  return router;
}
