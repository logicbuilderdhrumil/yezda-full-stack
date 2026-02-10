import type { Router } from 'express';
import { InMemoryTemplateLayoutRepository } from './infrastructure/index.js';
import { GetNavigationUseCase, GetGlobalControlsUseCase } from './application/index.js';
import { TemplateLayoutController, createTemplateLayoutRoutes } from './interface/index.js';
import type { IAuditService } from './domain/ports/IAuditService.js';
import type { RequestContext } from './domain/entities/template-layout.entity.js';
import { auditService } from '../../services/audit.service.js';
import type { AuditEventType } from '../../models/audit.model.js';

export interface TemplateLayoutsModule { router: Router; }

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

export function createTemplateLayoutsModule(): TemplateLayoutsModule {
  const repo = new InMemoryTemplateLayoutRepository();
  const getNavUC = new GetNavigationUseCase(repo, auditAdapter);
  const getControlsUC = new GetGlobalControlsUseCase(repo, auditAdapter);
  const controller = new TemplateLayoutController(getNavUC, getControlsUC);
  const router = createTemplateLayoutRoutes(controller);
  return { router };
}
