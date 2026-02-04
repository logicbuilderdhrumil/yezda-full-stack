/**
 * Asset Management Routes
 * Task 1.2: Define API routes for asset catalog operations
 * Task 1.3: Define API routes for template asset operations
 * Task 1.4: Apply authentication and tenant scoping
 * Task 1.6: Apply rate limiting to asset endpoints
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  assetReadRateLimiter,
  assetCatalogRateLimiter,
} from '../middleware/asset-management-rate-limit.middleware.js';
import {
  queryAssets,
  getAssetsByType,
  getAssetById,
  getTemplateById,
  getTemplatesByType,
  getHealthSummary,
} from '../controllers/asset-management.controller.js';

const router = Router();

// Health check endpoint (public)
// GET /api/v1/assets/health - Get asset system health
router.get('/health', getHealthSummary);

// Authenticated routes with rate limiting

// GET /api/v1/assets - Query assets with filters
router.get('/', requireAuth, assetCatalogRateLimiter, queryAssets);

// GET /api/v1/assets/type/:type - Get assets by type
router.get('/type/:type', requireAuth, assetCatalogRateLimiter, getAssetsByType);

// GET /api/v1/assets/templates/type/:templateType - Get templates by type
router.get('/templates/type/:templateType', requireAuth, assetCatalogRateLimiter, getTemplatesByType);

// GET /api/v1/assets/templates/:templateId - Get specific template
router.get('/templates/:templateId', requireAuth, assetReadRateLimiter, getTemplateById);

// GET /api/v1/assets/:assetId - Get specific asset (must be last due to param matching)
router.get('/:assetId', requireAuth, assetReadRateLimiter, getAssetById);

export default router;
