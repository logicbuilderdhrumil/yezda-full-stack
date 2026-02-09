/**
 * Org Management Module — Composition Root
 *
 * Wires all org-management dependencies using manual constructor injection.
 */
import { PostgresOrgManagementRepository } from './infrastructure/repositories/PostgresOrgManagementRepository.js';

import { ListOrganizationsUseCase } from './application/use-cases/ListOrganizationsUseCase.js';
import { GetOrganizationByIdUseCase } from './application/use-cases/GetOrganizationByIdUseCase.js';
import { CreateOrganizationUseCase } from './application/use-cases/CreateOrganizationUseCase.js';
import { UpdateOrganizationUseCase } from './application/use-cases/UpdateOrganizationUseCase.js';
import { UpdateOrganizationStatusUseCase } from './application/use-cases/UpdateOrganizationStatusUseCase.js';
import { DeleteOrganizationUseCase } from './application/use-cases/DeleteOrganizationUseCase.js';

import { OrgManagementController } from './interface/controllers/org-management.controller.js';
import { createOrgManagementRoutes } from './interface/routes/org-management.routes.js';

// Legacy service singletons (not yet migrated into this module)
import { auditService } from '../../services/audit.service.js';
import { metricsService } from '../../services/metrics.service.js';
import type { IAuditService } from './domain/ports/audit-service.port.js';
import type { IMetricsService } from './domain/ports/metrics-service.port.js';

export function createOrgManagementModule() {
  // ── Infrastructure ──────────────────────────────────────────────────────
  const orgRepo = new PostgresOrgManagementRepository();

  // Adapt legacy services to the module's port interfaces.
  const audit = auditService as unknown as IAuditService;
  const metrics = metricsService as unknown as IMetricsService;

  // ── Use Cases ───────────────────────────────────────────────────────────
  const listOrgsUC = new ListOrganizationsUseCase(orgRepo, audit, metrics);
  const getOrgByIdUC = new GetOrganizationByIdUseCase(orgRepo, audit, metrics);
  const createOrgUC = new CreateOrganizationUseCase(orgRepo, audit, metrics);
  const updateOrgUC = new UpdateOrganizationUseCase(orgRepo, audit, metrics);
  const updateOrgStatusUC = new UpdateOrganizationStatusUseCase(orgRepo, audit, metrics);
  const deleteOrgUC = new DeleteOrganizationUseCase(orgRepo, audit, metrics);

  // ── Interface ───────────────────────────────────────────────────────────
  const controller = new OrgManagementController(
    listOrgsUC,
    getOrgByIdUC,
    createOrgUC,
    updateOrgUC,
    updateOrgStatusUC,
    deleteOrgUC,
  );

  const routes = createOrgManagementRoutes(controller);

  return {
    routes,
    controller,
    repositories: {
      org: orgRepo,
    },
  };
}
