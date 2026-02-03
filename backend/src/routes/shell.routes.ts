/**
 * Shell Routes
 * Task 1.2, 1.3, 1.7: Shell configuration and preference API endpoints
 */

import { Router } from 'express';
import * as shellController from '../controllers/shell.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { shellConfigRateLimiter } from '../middleware/rate-limit.middleware.js';

const router = Router();

// Public endpoints with rate limiting
// GET /api/v1/shell/config - Shell layout configuration
router.get('/config', shellConfigRateLimiter, shellController.getShellConfig);

// GET /api/v1/shell/policies - Route access policies
router.get('/policies', shellConfigRateLimiter, shellController.getRoutePolicies);

// GET /api/v1/shell/preferences/defaults - Theme and locale defaults
router.get('/preferences/defaults', shellConfigRateLimiter, shellController.getPreferenceDefaults);

// Protected endpoints requiring authentication
// GET /api/v1/shell/navigation - Role-based navigation
router.get('/navigation', requireAuth, shellController.getNavigation);

// GET /api/v1/shell/preferences - User preferences
router.get('/preferences', requireAuth, shellController.getUserPreferences);

// PUT /api/v1/shell/preferences - Update user preferences
router.put('/preferences', requireAuth, shellController.updateUserPreferences);

export default router;
