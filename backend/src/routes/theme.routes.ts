/**
 * Theme Routes
 * Task 1.2: Define API routes for theme operations
 * Task 1.4: Apply authentication and tenant scoping
 * Task 1.6: Apply rate limiting to theme endpoints
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  themeReadRateLimiter,
  themeWriteRateLimiter,
} from '../middleware/theme-rate-limit.middleware.js';
import {
  getPresets,
  getPreset,
  getPreference,
  updatePreference,
  deletePreference,
  getEffectiveTokens,
  getHealthSummary,
} from '../controllers/theme.controller.js';

const router = Router();

// Public routes (presets are available without auth)
// GET /api/v1/theme/presets - Get all available theme presets
router.get('/presets', themeReadRateLimiter, getPresets);

// GET /api/v1/theme/presets/:presetId - Get a specific theme preset
router.get('/presets/:presetId', themeReadRateLimiter, getPreset);

// GET /api/v1/theme/health - Get theme system health (for monitoring)
router.get('/health', getHealthSummary);

// Authenticated routes
// GET /api/v1/theme/preference - Get user's theme preference
router.get('/preference', requireAuth, themeReadRateLimiter, getPreference);

// PUT /api/v1/theme/preference - Update user's theme preference
router.put('/preference', requireAuth, themeWriteRateLimiter, updatePreference);

// DELETE /api/v1/theme/preference - Reset user's theme preference
router.delete('/preference', requireAuth, themeWriteRateLimiter, deletePreference);

// GET /api/v1/theme/tokens - Get effective theme tokens for user
router.get('/tokens', requireAuth, themeReadRateLimiter, getEffectiveTokens);

export default router;
