/**
 * Shared Widgets Routes
 * Tasks 1.2, 1.3, 1.5, 1.7: Widget data API endpoints with rate limiting and RBAC
 */

import { Router } from 'express';
import * as sharedWidgetsController from '../controllers/shared-widgets.controller.js';
import { optionalAuth } from '../middleware/auth.middleware.js';
import { sharedWidgetsRateLimiter } from '../middleware/shared-widgets-rate-limit.middleware.js';
import { validateQuery, validateParams } from '../middleware/validation.middleware.js';
import { z } from 'zod';
import { AVAILABLE_WIDGETS } from '../models/shared-widgets.model.js';

const router = Router();

// ============================================================
// Validation Schemas
// ============================================================

/**
 * Widget ID param validation
 */
const widgetIdParamSchema = z.object({
  widgetId: z.enum(AVAILABLE_WIDGETS),
});

/**
 * Table data query validation
 */
const tableDataQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  sortColumn: z.string().max(50).optional(),
  sortDirection: z.enum(['asc', 'desc']).optional(),
});

/**
 * Visualization data query validation
 */
const visualizationDataQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  granularity: z.enum(['hour', 'day', 'week', 'month']).optional(),
});

// ============================================================
// Routes
// ============================================================

/**
 * GET /api/v1/widgets
 * Get list of available widgets (public)
 */
router.get('/', sharedWidgetsController.getAvailableWidgets);

/**
 * GET /api/v1/widgets/health
 * Health check and SLO status (public)
 * Task 1.8: SLO monitoring
 */
router.get('/health', sharedWidgetsController.getWidgetsHealth);

/**
 * GET /api/v1/widgets/tables/:widgetId
 * Get table data with pagination and sorting
 * Task 1.2: Table data endpoints with rate limiting
 * Task 1.5: Optional auth for tenant scoping
 */
router.get(
  '/tables/:widgetId',
  sharedWidgetsRateLimiter,
  validateParams(widgetIdParamSchema),
  validateQuery(tableDataQuerySchema),
  optionalAuth,
  sharedWidgetsController.getTableData
);

/**
 * GET /api/v1/widgets/visualizations/:widgetId
 * Get visualization data
 * Task 1.3: Visualization data endpoints with rate limiting
 * Task 1.5: Optional auth for tenant scoping
 */
router.get(
  '/visualizations/:widgetId',
  sharedWidgetsRateLimiter,
  validateParams(widgetIdParamSchema),
  validateQuery(visualizationDataQuerySchema),
  optionalAuth,
  sharedWidgetsController.getVisualizationData
);

export default router;
