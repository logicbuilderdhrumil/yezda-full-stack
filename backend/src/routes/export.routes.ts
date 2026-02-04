/**
 * Export Routes
 * API endpoints for data export operations.
 */

import { Router } from 'express';
import * as exportController from '../controllers/export.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { exportRequestSchema } from '../models/export.model.js';

const router = Router();

// POST /api/v1/exports - Request a new export
router.post(
  '/',
  requireAuth,
  validateBody(exportRequestSchema),
  exportController.requestExport
);

// GET /api/v1/exports/:exportId - Get export status
router.get(
  '/:exportId',
  requireAuth,
  exportController.getExportStatus
);

// GET /api/v1/exports/:exportId/download - Download export file
router.get(
  '/:exportId/download',
  requireAuth,
  exportController.downloadExport
);

export default router;
