/**
 * Home Dashboard Routes
 * Task 1.2: Implement dashboard summary and activity endpoints
 * Task 1.4: RBAC enforcement - authenticated users with dashboard access
 * Task 1.6: Rate limiting for dashboard endpoints
 */

import { Router } from 'express';
import * as dashboardController from '../controllers/home-dashboard.controller.js';
import { requireAuthGuard, requireRoleGuard } from '../middleware/route-guards.middleware.js';
import {
  dashboardSummaryRateLimiter,
  dashboardActivityRateLimiter,
  dashboardTrendsRateLimiter,
} from '../middleware/home-dashboard-rate-limit.middleware.js';
import { validateQuery } from '../middleware/validation.middleware.js';
import {
  dashboardSummaryQuerySchema,
  activityFeedQuerySchema,
  trendDataQuerySchema,
} from '../models/home-dashboard.model.js';

const router = Router();

// All dashboard endpoints require authentication
router.use(requireAuthGuard);

// Dashboard endpoints require at least 'viewer' role
// This enforces RBAC for dashboard access (any authenticated role can view)
router.use(requireRoleGuard('viewer'));

/**
 * GET /api/v1/dashboard/summary
 * Get dashboard summary with KPIs and recent activity
 */
router.get(
  '/summary',
  dashboardSummaryRateLimiter,
  validateQuery(dashboardSummaryQuerySchema),
  dashboardController.getDashboardSummary
);

/**
 * GET /api/v1/dashboard/kpis
 * Get KPI metrics only
 */
router.get(
  '/kpis',
  dashboardSummaryRateLimiter,
  validateQuery(dashboardSummaryQuerySchema),
  dashboardController.getKpiMetrics
);

/**
 * GET /api/v1/dashboard/activity
 * Get activity feed
 */
router.get(
  '/activity',
  dashboardActivityRateLimiter,
  validateQuery(activityFeedQuerySchema),
  dashboardController.getActivityFeed
);

/**
 * GET /api/v1/dashboard/trends
 * Get trend data for charts
 */
router.get(
  '/trends',
  dashboardTrendsRateLimiter,
  validateQuery(trendDataQuerySchema),
  dashboardController.getTrends
);

export default router;
