import type { Router } from 'express';
import { InMemoryLocalizationRepository } from './infrastructure/index.js';
import { GetLocalePreferenceUseCase, UpdateLocalePreferenceUseCase, GetTranslationsUseCase, GetSupportedLocalesUseCase } from './application/index.js';
import { LocalizationController, createLocalizationRoutes } from './interface/index.js';
import type { IAuditService } from './domain/ports/IAuditService.js';
import type { RequestContext } from './domain/entities/localization.entity.js';
import { auditService } from '../../services/audit.service.js';
import type { AuditEventType } from '../../models/audit.model.js';

export interface LocalizationModule { router: Router; }

/** Adapter that bridges IAuditService port to the real auditService */
const auditAdapter: IAuditService = {
  log(event: string, context: RequestContext, details?: Record<string, unknown>): void {
    auditService.log({
      eventType: event as AuditEventType,
      actorId: context.userId,
      actorType: context.userType,
      channel: context.channel ?? 'api',
      ipAddress: context.ipAddress,
      metadata: { tenantId: context.tenantId, ...details },
      success: true,
    });
  },
};

export function createLocalizationModule(): LocalizationModule {
  const repo = new InMemoryLocalizationRepository();
  const getPrefUC = new GetLocalePreferenceUseCase(repo, auditAdapter);
  const updatePrefUC = new UpdateLocalePreferenceUseCase(repo, auditAdapter);
  const getTransUC = new GetTranslationsUseCase(repo);
  const getLocalesUC = new GetSupportedLocalesUseCase(repo);
  const controller = new LocalizationController(getPrefUC, updatePrefUC, getTransUC, getLocalesUC);
  const router = createLocalizationRoutes(controller);
  return { router };
}
