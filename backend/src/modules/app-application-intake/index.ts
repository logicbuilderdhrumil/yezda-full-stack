/**
 * App Application Intake Module - Composition Root
 */

import { Router } from 'express';
import { LegacyAppApplicationIntakeRepository } from './infrastructure/repositories/LegacyAppApplicationIntakeRepository.js';
import { AppApplicationIntakeUseCases } from './application/use-cases/app-application-intake-use-cases.js';
import { AppApplicationIntakeController } from './interface/controllers/app-application-intake.controller.js';
import { createAppApplicationIntakeRoutes } from './interface/routes/app-application-intake.routes.js';

export function createAppApplicationIntakeModule() {
  const repository = new LegacyAppApplicationIntakeRepository();
  const useCases = new AppApplicationIntakeUseCases(repository);
  const controller = new AppApplicationIntakeController(useCases);
  const router: Router = createAppApplicationIntakeRoutes(controller);

  return { router, controller, useCases, repository };
}
