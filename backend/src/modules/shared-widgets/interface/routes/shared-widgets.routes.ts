import { Router } from 'express';
import type { SharedWidgetsController } from '../controllers/shared-widgets.controller.js';
import { optionalAuth } from '../../../../middleware/auth.middleware.js';

export function createSharedWidgetsRoutes(controller: SharedWidgetsController): Router {
  const router = Router();
  router.get('/', controller.getAvailableWidgets);
  router.get('/health', controller.getWidgetsHealth);
  router.get('/tables/:widgetId', optionalAuth, controller.getTableData);
  router.get('/visualizations/:widgetId', optionalAuth, controller.getVisualizationData);
  return router;
}
