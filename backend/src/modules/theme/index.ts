import type { Router } from 'express';
import { PostgresThemeRepository } from './infrastructure/index.js';
import { GetPresetsUseCase, GetPreferenceUseCase, UpdatePreferenceUseCase } from './application/index.js';
import { ThemeController, createThemeRoutes } from './interface/index.js';
import type { IAuditService } from './domain/ports/IAuditService.js';
import type { RequestContext } from './domain/entities/theme.entity.js';
import { auditService } from '../../services/audit.service.js';
import type { AuditEventType } from '../../models/audit.model.js';

export interface ThemeModule { router: Router; }

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

export function createThemeModule(): ThemeModule {
  const repo = new PostgresThemeRepository();
  const getPresetsUC = new GetPresetsUseCase(repo);
  const getPrefUC = new GetPreferenceUseCase(repo, auditAdapter);
  const updatePrefUC = new UpdatePreferenceUseCase(repo, auditAdapter);
  const controller = new ThemeController(getPresetsUC, getPrefUC, updatePrefUC);
  const router = createThemeRoutes(controller);
  return { router };
}
