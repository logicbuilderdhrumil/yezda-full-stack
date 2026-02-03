/**
 * UI Kit Routes
 * Task 1.2, 1.6, 1.7: UI configuration API endpoints with rate limiting
 */

import { Router } from 'express';
import * as uiKitController from '../controllers/ui-kit.controller.js';
import { optionalAuth } from '../middleware/auth.middleware.js';
import { uiKitRateLimiter } from '../middleware/ui-kit-rate-limit.middleware.js';
import { validateQuery } from '../middleware/validation.middleware.js';
import {
  getUIConfigQuerySchema,
  getThemedVariantsQuerySchema,
} from '../models/ui-kit.model.js';

const router = Router();

/**
 * GET /api/v1/ui-kit/themes
 * Get list of available themes (public)
 */
router.get('/themes', uiKitController.getAvailableThemes);

/**
 * GET /api/v1/ui-kit/categories
 * Get list of available component categories (public)
 */
router.get('/categories', uiKitController.getAvailableCategories);

/**
 * GET /api/v1/ui-kit/config
 * Get UI component configuration (public, rate limited, cached)
 * Task 1.6: Rate limiting for UI configuration endpoints
 */
router.get(
  '/config',
  uiKitRateLimiter,
  validateQuery(getUIConfigQuerySchema),
  optionalAuth,
  uiKitController.getUIConfig
);

/**
 * GET /api/v1/ui-kit/themed-variants
 * Get themed variants (public, rate limited, cached)
 * Task 1.6: Rate limiting for themed variants endpoints
 */
router.get(
  '/themed-variants',
  uiKitRateLimiter,
  validateQuery(getThemedVariantsQuerySchema),
  optionalAuth,
  uiKitController.getThemedVariants
);

/**
 * GET /api/v1/ui-kit/health
 * Health check and SLO status (public)
 * Task 1.7: SLO monitoring
 */
router.get('/health', uiKitController.getUIKitHealth);

export default router;
