/**
 * View Components Routes
 * Task 1.2, 1.6, 1.7: View component API endpoints with rate limiting
 */

import { Router } from 'express';
import type { ZodSchema } from 'zod';
import * as viewComponentsController from '../controllers/view-components.controller.js';
import { requireAuthGuard } from '../middleware/route-guards.middleware.js';
import { viewComponentsRateLimiter } from '../middleware/view-components-rate-limit.middleware.js';
import { validateQuery } from '../middleware/validation.middleware.js';
import {
  getChatSummaryQuerySchema,
  getFileTypeMetadataQuerySchema,
} from '../models/view-components.model.js';

const router = Router();

/**
 * GET /api/v1/view-components/conversation-types
 * Get list of available conversation types (public)
 */
router.get('/conversation-types', viewComponentsController.getAvailableConversationTypes);

/**
 * GET /api/v1/view-components/file/categories
 * Get list of available file type categories (public)
 */
router.get('/file/categories', viewComponentsController.getAvailableFileCategories);

/**
 * GET /api/v1/view-components/chat/summaries
 * Get chat summaries for view components (authenticated, rate limited, cached)
 * Task 1.6: Rate limiting for chat summary endpoints
 */
router.get(
  '/chat/summaries',
  viewComponentsRateLimiter,
  validateQuery(getChatSummaryQuerySchema as unknown as ZodSchema),
  requireAuthGuard,
  viewComponentsController.getChatSummaries
);

/**
 * GET /api/v1/view-components/file/types
 * Get file type metadata (authenticated, rate limited, cached)
 * Task 1.6: Rate limiting for file type metadata endpoints
 */
router.get(
  '/file/types',
  viewComponentsRateLimiter,
  validateQuery(getFileTypeMetadataQuerySchema as unknown as ZodSchema),
  requireAuthGuard,
  viewComponentsController.getFileTypeMetadata
);

/**
 * GET /api/v1/view-components/health
 * Health check and SLO status (public)
 * Task 1.7: SLO monitoring
 */
router.get('/health', viewComponentsController.getViewComponentsHealth);

export default router;
