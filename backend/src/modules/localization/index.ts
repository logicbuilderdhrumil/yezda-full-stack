import type { Router } from 'express';
import { InMemoryLocalizationRepository } from './infrastructure/index.js';
import { GetLocalePreferenceUseCase, UpdateLocalePreferenceUseCase, GetTranslationsUseCase, GetSupportedLocalesUseCase } from './application/index.js';
import { LocalizationController, createLocalizationRoutes } from './interface/index.js';
import type { IAuditService } from './domain/ports/IAuditService.js';
import { auditService } from '../../services/audit.service.js';

export interface LocalizationModule { router: Router; }

export function createLocalizationModule(): LocalizationModule {
  const repo = new InMemoryLocalizationRepository();
  const audit = auditService as unknown as IAuditService;
  const getPrefUC = new GetLocalePreferenceUseCase(repo, audit);
  const updatePrefUC = new UpdateLocalePreferenceUseCase(repo, audit);
  const getTransUC = new GetTranslationsUseCase(repo);
  const getLocalesUC = new GetSupportedLocalesUseCase(repo);
  const controller = new LocalizationController(getPrefUC, updatePrefUC, getTransUC, getLocalesUC);
  const router = createLocalizationRoutes(controller);
  return { router };
}
