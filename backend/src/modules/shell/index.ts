import type { Router } from 'express';
import { InMemoryShellRepository } from './infrastructure/repositories/InMemoryShellRepository.js';
import { GetShellConfigUseCase, GetRoutePoliciesUseCase, GetNavigationUseCase, GetPreferenceDefaultsUseCase, GetUserPreferencesUseCase, UpdateUserPreferencesUseCase } from './application/use-cases/shell-use-cases.js';
import { ShellController } from './interface/controllers/shell.controller.js';
import { createShellRoutes } from './interface/routes/shell.routes.js';

export interface ShellModule { router: Router; }

export function createShellModule(): ShellModule {
  const repo = new InMemoryShellRepository();
  const controller = new ShellController(
    new GetShellConfigUseCase(repo), new GetRoutePoliciesUseCase(repo), new GetNavigationUseCase(repo),
    new GetPreferenceDefaultsUseCase(repo), new GetUserPreferencesUseCase(repo), new UpdateUserPreferencesUseCase(repo),
  );
  return { router: createShellRoutes(controller) };
}
