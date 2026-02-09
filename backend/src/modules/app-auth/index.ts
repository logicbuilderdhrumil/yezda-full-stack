/**
 * App Auth Module - Composition Root
 * Wires domain, application, infrastructure, and interface layers
 */

import { Router } from 'express';
import { LegacyAppAuthRepository } from './infrastructure/repositories/LegacyAppAuthRepository.js';
import { AppAuthUseCases } from './application/use-cases/app-auth-use-cases.js';
import { AppAuthController } from './interface/controllers/app-auth.controller.js';
import { createAppAuthRoutes } from './interface/routes/app-auth.routes.js';

export function createAppAuthModule() {
  const repository = new LegacyAppAuthRepository();
  const useCases = new AppAuthUseCases(repository);
  const controller = new AppAuthController(useCases);
  const router: Router = createAppAuthRoutes(controller);

  return { router, controller, useCases, repository };
}
