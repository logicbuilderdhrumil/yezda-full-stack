/**
 * Review Task routes.
 */
import { Router } from 'express';
import type { ReviewTaskController } from '../controllers/review-task.controller.js';
import { requireAuthGuard, requireRoleGuard } from '../../../../middleware/route-guards.middleware.js';

export function createReviewTaskRoutes(controller: ReviewTaskController): Router {
  const router = Router();

  const authAndView = [requireAuthGuard, requireRoleGuard('platform_admin', 'platform_manager', 'platform_agent')];
  const authAndManage = [requireAuthGuard, requireRoleGuard('platform_admin', 'platform_manager')];

  router.get('/', ...authAndView, controller.listReviewTasks);
  router.get('/my-queue', ...authAndView, controller.getMyQueue);
  router.get('/:id', ...authAndView, controller.getReviewTask);
  router.post('/', ...authAndManage, controller.createReviewTask);
  router.patch('/:id/assign', ...authAndManage, controller.assignReviewTask);
  router.post('/:id/decide', ...authAndView, controller.submitDecision);

  return router;
}
