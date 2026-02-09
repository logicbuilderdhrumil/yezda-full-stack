/**
 * Asset Management Routes
 * Wires HTTP endpoints to the asset controller with middleware.
 */
import { Router } from 'express';
import type { AssetController } from '../controllers/asset.controller.js';
import { requireAuth as requireAuthGuard } from '../../../../shared/infrastructure/middleware/index.js';

export function createAssetRoutes(controller: AssetController): Router {
  const router = Router();

  // All routes require authentication
  router.use(requireAuthGuard);

  // GET /assets — query assets with filters
  router.get('/', controller.queryAssets);

  // GET /assets/type/:type — get assets by type
  router.get('/type/:type', controller.getAssetsByType);

  // GET /assets/templates/type/:templateType — get templates by type
  router.get('/templates/type/:templateType', controller.getTemplatesByType);

  // GET /assets/templates/:templateId — get template by ID
  router.get('/templates/:templateId', controller.getTemplateById);

  // GET /assets/health — health summary
  router.get('/health', controller.getHealthSummary);

  // GET /assets/:assetId — get asset by ID
  router.get('/:assetId', controller.getAssetById);

  return router;
}
