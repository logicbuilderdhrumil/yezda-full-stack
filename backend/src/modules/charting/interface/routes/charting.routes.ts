import { Router } from 'express';
import type { ChartingController } from '../controllers/charting.controller.js';
import { requireAuthGuard, requireRoleGuard } from '../../../../middleware/route-guards.middleware.js';

export function createChartingRoutes(controller: ChartingController): Router {
  const router = Router();
  router.use(requireAuthGuard);
  router.use(requireRoleGuard('platform_viewer', 'platform_agent', 'platform_manager', 'platform_admin'));
  router.get('/metrics', controller.getAvailableMetrics);
  router.post('/query', controller.queryChartData);
  router.post('/aggregate', controller.aggregateMetric);
  router.get('/health', requireRoleGuard('platform_admin', 'platform_manager'), controller.getChartingHealth);
  return router;
}
