import type { Router } from 'express';
import { PostgresThemeRepository } from './infrastructure/index.js';
import { GetPresetsUseCase, GetPreferenceUseCase, UpdatePreferenceUseCase } from './application/index.js';
import { ThemeController, createThemeRoutes } from './interface/index.js';
import type { IAuditService } from './domain/ports/IAuditService.js';
import { auditService } from '../../services/audit.service.js';

export interface ThemeModule { router: Router; }

export function createThemeModule(): ThemeModule {
  const repo = new PostgresThemeRepository();
  const audit = auditService as unknown as IAuditService;
  const getPresetsUC = new GetPresetsUseCase(repo);
  const getPrefUC = new GetPreferenceUseCase(repo, audit);
  const updatePrefUC = new UpdatePreferenceUseCase(repo, audit);
  const controller = new ThemeController(getPresetsUC, getPrefUC, updatePrefUC);
  const router = createThemeRoutes(controller);
  return { router };
}
