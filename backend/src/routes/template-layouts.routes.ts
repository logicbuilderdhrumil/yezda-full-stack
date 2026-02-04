/**
 * Template Layouts Routes
 * Task 1.2, 1.3, 1.7: Layout navigation and profile summary API endpoints
 */

import { Router } from 'express';
import * as templateLayoutsController from '../controllers/template-layouts.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  templateLayoutNavigationRateLimiter,
  templateLayoutProfileRateLimiter,
} from '../middleware/template-layouts-rate-limit.middleware.js';

const router = Router();

// All template layout endpoints require authentication
// GET /api/v1/template-layouts/navigation - Layout navigation metadata
router.get(
  '/navigation',
  templateLayoutNavigationRateLimiter,
  requireAuth,
  templateLayoutsController.getLayoutNavigation
);

// GET /api/v1/template-layouts/profile-summary - Profile and notification summary
router.get(
  '/profile-summary',
  templateLayoutProfileRateLimiter,
  requireAuth,
  templateLayoutsController.getProfileSummary
);

// GET /api/v1/template-layouts/health - Health and SLO status (admin only)
router.get(
  '/health',
  requireAuth,
  templateLayoutsController.getHealthSummary
);

export default router;
