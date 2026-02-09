/**
 * Org Management Domain — barrel export
 */
export type {
  OrganizationStatus,
  OrganizationPlan,
  OrganizationSettings,
  Organization,
  CreateOrgDto,
  UpdateOrgDto,
  OrgFilters,
  OrgPaginationOptions,
  OrgListResult,
  OrgOperationResult,
  OrgContext,
  OrgAuditEventType,
} from './entities/org-management.entity.js';

export { DEFAULT_ORG_SETTINGS, generateSlug } from './entities/org-management.entity.js';

export type { IOrgManagementRepository } from './ports/org-management-repository.port.js';
export type { IAuditService } from './ports/audit-service.port.js';
export type { IMetricsService } from './ports/metrics-service.port.js';
