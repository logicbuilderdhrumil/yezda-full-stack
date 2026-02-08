import { Router } from 'express';
import type { ChartingController } from '../controllers/charting.controller.js';
import { requireAuthGuard, requireRoleGuard } from '../../../../middleware/route-guards.middleware.js';

export function createChartingRoutes(controller: ChartingController): Router {
  const router = Router();
  router.use(requireAuthGuard);
  router.use(requireRoleGuard('viewer', 'agent', 'manager', 'admin'));
  router.get('/metrics', controller.getAvailableMetrics);
  router.post('/query', controller.queryChartData);
  router.post('/aggregate', controller.aggregateMetric);
  router.get('/health', requireRoleGuard('admin', 'manager'), controller.getChartingHealth);
  return router;
}
