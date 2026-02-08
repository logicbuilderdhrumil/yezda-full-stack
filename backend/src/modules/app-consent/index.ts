/**
 * App Consent Module - Composition Root
 */

import { Router } from 'express';
import { LegacyAppConsentRepository } from './infrastructure/repositories/LegacyAppConsentRepository.js';
import { AppConsentUseCases } from './application/use-cases/app-consent-use-cases.js';
import { AppConsentController } from './interface/controllers/app-consent.controller.js';
import { createAppConsentRoutes } from './interface/routes/app-consent.routes.js';

export function createAppConsentModule() {
  const repository = new LegacyAppConsentRepository();
  const useCases = new AppConsentUseCases(repository);
  const controller = new AppConsentController(useCases);
  const router: Router = createAppConsentRoutes(controller);

  return { router, controller, useCases, repository };
}
