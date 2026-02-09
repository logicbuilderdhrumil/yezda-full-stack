/**
 * Custom Components Routes
 * Task 1.2: Organization selection API endpoints
 * Task 1.3: Theme preference API endpoints
 * Task 1.5: RBAC enforcement - authenticated users only
 * Task 1.7: Rate limiting for update endpoints
 */

import { Router } from 'express';
import * as customComponentsController from '../controllers/custom-components.controller.js';
import { requireAuthGuard } from '../middleware/route-guards.middleware.js';
import {
  componentsReadRateLimiter,
  componentsUpdateRateLimiter,
} from '../middleware/custom-components-rate-limit.middleware.js';

const router = Router();

// All component endpoints require authentication
router.use(requireAuthGuard);

// ── Organization Context Endpoints ───────────────────────

/**
 * GET /api/v1/components/organizations
 * List organizations the user belongs to
 */
router.get(
  '/organizations',
  componentsReadRateLimiter,
  customComponentsController.listOrganizations
);

/**
 * PUT /api/v1/components/organizations/active
 * Set the active organization context
 */
router.put(
  '/organizations/active',
  componentsUpdateRateLimiter,
  customComponentsController.setActiveOrganization
);

// ── Theme Preference Endpoints ───────────────────────────

/**
 * GET /api/v1/components/preferences/theme
 * Get user's theme preference
 */
router.get(
  '/preferences/theme',
  componentsReadRateLimiter,
  customComponentsController.getThemePreference
);

/**
 * PUT /api/v1/components/preferences/theme
 * Update user's theme preference
 */
router.put(
  '/preferences/theme',
  componentsUpdateRateLimiter,
  customComponentsController.updateThemePreference
);

export default router;
