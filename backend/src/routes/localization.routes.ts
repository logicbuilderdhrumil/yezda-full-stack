/**
 * Localization Routes
 * Task 1.2, 1.3, 1.7: Localization API endpoints with rate limiting
 */

import { Router } from 'express';
import * as localizationController from '../controllers/localization.controller.js';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware.js';
import { translationRateLimiter } from '../middleware/localization-rate-limit.middleware.js';
import {
  validateBody,
  validateQuery,
} from '../middleware/validation.middleware.js';
import {
  updateLocalePreferenceSchema,
  getTranslationsQuerySchema,
} from '../models/localization.model.js';

const router = Router();

/**
 * GET /api/v1/localization/locales
 * Get list of supported locales (public)
 */
router.get('/locales', localizationController.getSupportedLocales);

/**
 * GET /api/v1/localization/translations
 * Get translation resources (public, rate limited, cached)
 * Task 1.7: Rate limiting for translation endpoints
 */
router.get(
  '/translations',
  translationRateLimiter,
  validateQuery(getTranslationsQuerySchema),
  optionalAuth,
  localizationController.getTranslations
);

/**
 * GET /api/v1/localization/preferences
 * Get current user's locale preference (authenticated)
 */
router.get('/preferences', requireAuth, localizationController.getLocalePreference);

/**
 * PUT /api/v1/localization/preferences
 * Update current user's locale preference (authenticated)
 */
router.put(
  '/preferences',
  requireAuth,
  validateBody(updateLocalePreferenceSchema),
  localizationController.updateLocalePreference
);

/**
 * GET /api/v1/localization/health
 * Health check and SLO status (public)
 */
router.get('/health', localizationController.getLocalizationHealth);

export default router;
