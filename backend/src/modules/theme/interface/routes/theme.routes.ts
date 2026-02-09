import { Router } from 'express';
import type { ThemeController } from '../controllers/theme.controller.js';
import { requireAuth as requireAuthGuard } from '../../../../shared/infrastructure/middleware/index.js';

export function createThemeRoutes(controller: ThemeController): Router {
  const router = Router();
  router.use(requireAuthGuard);
  router.get('/presets', controller.getPresets);
  router.get('/preference', controller.getPreference);
  router.put('/preference', controller.updatePreference);
  return router;
}
