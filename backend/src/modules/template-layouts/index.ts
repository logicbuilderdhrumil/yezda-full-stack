import type { Router } from 'express';
import { InMemoryTemplateLayoutRepository } from './infrastructure/index.js';
import { GetNavigationUseCase, GetGlobalControlsUseCase } from './application/index.js';
import { TemplateLayoutController, createTemplateLayoutRoutes } from './interface/index.js';
import type { IAuditService } from './domain/ports/IAuditService.js';
import { auditService } from '../../services/audit.service.js';

export interface TemplateLayoutsModule { router: Router; }

export function createTemplateLayoutsModule(): TemplateLayoutsModule {
  const repo = new InMemoryTemplateLayoutRepository();
  const audit = auditService as unknown as IAuditService;
  const getNavUC = new GetNavigationUseCase(repo, audit);
  const getControlsUC = new GetGlobalControlsUseCase(repo, audit);
  const controller = new TemplateLayoutController(getNavUC, getControlsUC);
  const router = createTemplateLayoutRoutes(controller);
  return { router };
}
