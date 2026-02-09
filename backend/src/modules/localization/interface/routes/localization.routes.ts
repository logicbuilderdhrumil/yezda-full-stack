import { Router } from 'express';
import type { LocalizationController } from '../controllers/localization.controller.js';
import { requireAuth as requireAuthGuard } from '../../../../shared/infrastructure/middleware/index.js';

export function createLocalizationRoutes(controller: LocalizationController): Router {
  const router = Router();
  router.use(requireAuthGuard);
  router.get('/preference', controller.getPreference);
  router.put('/preference', controller.updatePreference);
  router.get('/translations', controller.getTranslations);
  router.get('/locales', controller.getSupportedLocales);
  return router;
}
