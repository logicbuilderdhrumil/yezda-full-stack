/**
 * Client Portal Module — Composition Root
 * Wires domain, application, infrastructure, and interface layers.
 */
import type { Router } from 'express';
import { InMemoryClientPortalRepository } from './infrastructure/index.js';
import {
  GetDashboardUseCase,
  ListCandidatesUseCase,
  GetCandidateDetailUseCase,
  GetOrgSettingsUseCase,
  UpdateOrgSettingsUseCase,
  ListScreeningsUseCase,
  GetReportUseCase,
} from './application/index.js';
import { ClientPortalController, createClientPortalRoutes } from './interface/index.js';
import type { IAuditService } from './domain/ports/IAuditService.js';
import type { RequestContext } from './domain/entities/client-portal.entity.js';
import { auditService } from '../../services/audit.service.js';
import type { AuditEventType } from '../../models/audit.model.js';

export interface ClientPortalModule {
  router: Router;
}

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

export function createClientPortalModule(): ClientPortalModule {
  // Infrastructure
  const repo = new InMemoryClientPortalRepository();

  // Use cases
  const getDashboardUC = new GetDashboardUseCase(repo, auditAdapter);
  const listCandidatesUC = new ListCandidatesUseCase(repo, auditAdapter);
  const getCandidateDetailUC = new GetCandidateDetailUseCase(repo, auditAdapter);
  const getOrgSettingsUC = new GetOrgSettingsUseCase(repo);
  const updateOrgSettingsUC = new UpdateOrgSettingsUseCase(repo, auditAdapter);
  const listScreeningsUC = new ListScreeningsUseCase(repo);
  const getReportUC = new GetReportUseCase(repo);

  // Controller
  const controller = new ClientPortalController(
    getDashboardUC,
    listCandidatesUC,
    getCandidateDetailUC,
    getOrgSettingsUC,
    updateOrgSettingsUC,
    listScreeningsUC,
    getReportUC,
  );

  // Routes
  const router = createClientPortalRoutes(controller);

  return { router };
}
