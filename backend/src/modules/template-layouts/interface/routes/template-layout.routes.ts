import { Router } from 'express';
import type { TemplateLayoutController } from '../controllers/template-layout.controller.js';
import { requireAuth as requireAuthGuard } from '../../../../shared/infrastructure/middleware/index.js';

export function createTemplateLayoutRoutes(controller: TemplateLayoutController): Router {
  const router = Router();
  router.use(requireAuthGuard);
  router.get('/navigation', controller.getNavigation);
  router.get('/controls', controller.getGlobalControls);
  return router;
}
