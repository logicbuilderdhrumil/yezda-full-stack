import { Router } from 'express';
import type { DashboardController } from '../controllers/dashboard.controller.js';
import { requireAuth as requireAuthGuard } from '../../../../shared/infrastructure/middleware/index.js';

export function createDashboardRoutes(controller: DashboardController): Router {
  const router = Router();
  router.use(requireAuthGuard);
  router.get('/summary', controller.getSummary);
  router.get('/activity', controller.getActivity);
  router.get('/trends', controller.getTrends);
  router.get('/kpis', controller.getKpis);
  return router;
}
