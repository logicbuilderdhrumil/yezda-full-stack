import { Router } from 'express';
import type { ExportController } from '../controllers/export.controller.js';
import { requireAuth } from '../../../../middleware/auth.middleware.js';

export function createExportRoutes(controller: ExportController): Router {
  const router = Router();
  router.post('/', requireAuth, controller.requestExport);
  router.get('/:exportId', requireAuth, controller.getExportStatus);
  router.get('/:exportId/download', requireAuth, controller.downloadExport);
  return router;
}
