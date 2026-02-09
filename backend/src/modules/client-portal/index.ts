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
import { auditService } from '../../services/audit.service.js';

export interface ClientPortalModule {
  router: Router;
}

export function createClientPortalModule(): ClientPortalModule {
  // Infrastructure
  const repo = new InMemoryClientPortalRepository();

  // Adapt shared audit service
  const audit = auditService as unknown as IAuditService;

  // Use cases
  const getDashboardUC = new GetDashboardUseCase(repo, audit);
  const listCandidatesUC = new ListCandidatesUseCase(repo, audit);
  const getCandidateDetailUC = new GetCandidateDetailUseCase(repo, audit);
  const getOrgSettingsUC = new GetOrgSettingsUseCase(repo);
  const updateOrgSettingsUC = new UpdateOrgSettingsUseCase(repo, audit);
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
