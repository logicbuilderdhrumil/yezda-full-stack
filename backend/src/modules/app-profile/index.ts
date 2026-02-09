/**
 * App Profile Module - Composition Root
 */

import { Router } from 'express';
import { LegacyAppProfileRepository } from './infrastructure/repositories/LegacyAppProfileRepository.js';
import { AppProfileUseCases } from './application/use-cases/app-profile-use-cases.js';
import { AppProfileController } from './interface/controllers/app-profile.controller.js';
import { createAppProfileRoutes } from './interface/routes/app-profile.routes.js';

export function createAppProfileModule() {
  const repository = new LegacyAppProfileRepository();
  const useCases = new AppProfileUseCases(repository);
  const controller = new AppProfileController(useCases);
  const router: Router = createAppProfileRoutes(controller);

  return { router, controller, useCases, repository };
}
