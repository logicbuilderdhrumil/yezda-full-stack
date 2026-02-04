/**
 * Charting Routes
 * Task 1.2: Chart data endpoints
 * Task 1.4: RBAC enforcement
 * Task 1.6: Rate limiting for chart endpoints
 */

import { Router } from 'express';
import * as chartController from '../controllers/charting.controller.js';
import { requireAuthGuard, requireRoleGuard } from '../middleware/route-guards.middleware.js';
import {
  chartQueryRateLimiter,
  chartAggregateRateLimiter,
  chartMetricsListRateLimiter,
} from '../middleware/charting-rate-limit.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { chartQuerySchema } from '../models/charting.model.js';
import { z } from 'zod';

const router = Router();

// All chart endpoints require authentication
router.use(requireAuthGuard);

// Chart endpoints require at least viewer role
// This enforces RBAC and tenant isolation for all charting operations
router.use(requireRoleGuard('viewer', 'agent', 'manager', 'admin'));

/**
 * GET /api/v1/charts/metrics
 * Get available metrics for charting
 */
router.get(
  '/metrics',
  chartMetricsListRateLimiter,
  chartController.getAvailableMetrics
);

/**
 * POST /api/v1/charts/query
 * Query chart data for specified metrics
 */
router.post(
  '/query',
  chartQueryRateLimiter,
  validateBody(chartQuerySchema),
  chartController.queryChartData
);

/** Aggregate request schema */
const aggregateRequestSchema = z.object({
  metric: z.enum([
    'screenings_completed',
    'screenings_pending',
    'candidates_active',
    'candidates_onboarded',
    'applications_received',
    'turnaround_time',
    'completion_rate',
    'user_activity',
    'api_latency',
    'error_rate',
  ]),
  aggregation: z.enum(['sum', 'avg', 'min', 'max', 'count', 'median', 'percentile']),
  timeRange: z.object({
    preset: z.enum(['hour', 'day', 'week', 'month', 'quarter', 'year']).optional(),
    start: z.string().datetime().optional(),
    end: z.string().datetime().optional(),
  }).optional(),
});

/**
 * POST /api/v1/charts/aggregate
 * Get aggregated metric value
 */
router.post(
  '/aggregate',
  chartAggregateRateLimiter,
  validateBody(aggregateRequestSchema),
  chartController.aggregateMetric
);

/**
 * GET /api/v1/charts/health
 * Get charting service health and SLO status
 * Only admin/manager can view health status
 */
router.get(
  '/health',
  requireRoleGuard('admin', 'manager'),
  chartController.getChartingHealth
);

export default router;
