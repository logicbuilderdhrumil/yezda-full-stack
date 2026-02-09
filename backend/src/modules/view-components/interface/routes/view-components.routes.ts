import { Router } from 'express';
import type { ViewComponentsController } from '../controllers/view-components.controller.js';
import { requireAuthGuard } from '../../../../middleware/route-guards.middleware.js';

export function createViewComponentsRoutes(controller: ViewComponentsController): Router {
  const router = Router();
  router.get('/conversation-types', controller.getConversationTypes);
  router.get('/file/categories', controller.getFileCategories);
  router.get('/chat/summaries', requireAuthGuard, controller.getChatSummaries);
  router.get('/file/types', requireAuthGuard, controller.getFileTypeMetadata);
  router.get('/health', controller.getHealth);
  return router;
}
