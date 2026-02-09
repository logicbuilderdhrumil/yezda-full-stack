import type { Router } from 'express';
import { InMemoryCustomComponentsRepository } from './infrastructure/repositories/InMemoryCustomComponentsRepository.js';
import { ListOrganizationsUseCase, SetActiveOrganizationUseCase, GetThemePreferenceUseCase, UpdateThemePreferenceUseCase } from './application/use-cases/custom-components-use-cases.js';
import { CustomComponentsController } from './interface/controllers/custom-components.controller.js';
import { createCustomComponentsRoutes } from './interface/routes/custom-components.routes.js';
import { auditService } from '../../services/audit.service.js';

export interface CustomComponentsModule {
  router: Router;
}

export function createCustomComponentsModule(): CustomComponentsModule {
  const repo = new InMemoryCustomComponentsRepository();
  const audit = { log: (e: Parameters<typeof auditService.log>[0]) => auditService.log(e) };

  const listOrgs = new ListOrganizationsUseCase(repo, audit);
  const setActiveOrg = new SetActiveOrganizationUseCase(repo, audit);
  const getTheme = new GetThemePreferenceUseCase(repo, audit);
  const updateTheme = new UpdateThemePreferenceUseCase(repo, audit);

  const controller = new CustomComponentsController(listOrgs, setActiveOrg, getTheme, updateTheme);
  const router = createCustomComponentsRoutes(controller);

  return { router };
}
