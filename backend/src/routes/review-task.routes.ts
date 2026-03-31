/**
 * Review Task Routes
 * API endpoints for human review task management.
 */

import { Router } from 'express';
import * as reviewTaskController from '../controllers/review-task.controller.js';
import {
  requireAuthGuard,
  requireRoleGuard,
} from '../middleware/route-guards.middleware.js';

const router = Router();

// Guards shared across endpoints
const authAndViewGuards = [
  requireAuthGuard,
  requireRoleGuard('platform_admin', 'platform_manager', 'platform_agent'),
];

const authAndManageGuards = [
  requireAuthGuard,
  requireRoleGuard('platform_admin', 'platform_manager'),
];

// GET /api/v1/reviews — list review tasks (query: status, assigneeRole)
router.get('/', ...authAndViewGuards, reviewTaskController.listReviewTasks);

// GET /api/v1/reviews/my-queue — current user's queue
router.get('/my-queue', ...authAndViewGuards, reviewTaskController.getMyQueue);

// GET /api/v1/reviews/:id — single task
router.get('/:id', ...authAndViewGuards, reviewTaskController.getReviewTask);

// POST /api/v1/reviews — create review task
router.post('/', ...authAndManageGuards, reviewTaskController.createReviewTask);

// PATCH /api/v1/reviews/:id/assign — assign/reassign
router.patch(
  '/:id/assign',
  ...authAndManageGuards,
  reviewTaskController.assignReviewTask,
);

// POST /api/v1/reviews/:id/decide — submit decision
router.post(
  '/:id/decide',
  ...authAndViewGuards,
  reviewTaskController.submitDecision,
);

export default router;
