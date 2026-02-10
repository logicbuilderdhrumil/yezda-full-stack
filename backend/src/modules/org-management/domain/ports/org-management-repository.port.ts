/**
 * Org Management Repository Port
 */
import type {
  Organization,
  OrganizationStatus,
  OrgFilters,
  OrgPaginationOptions,
  OrgListResult,
} from '../entities/org-management.entity.js';

export interface IOrgManagementRepository {
  findAll(filters: OrgFilters, pagination: OrgPaginationOptions): Promise<OrgListResult>;
  findById(id: string): Promise<Organization | undefined>;
  findBySlug(slug: string): Promise<Organization | undefined>;
  slugExists(slug: string): Promise<boolean>;
  create(org: Organization): Promise<Organization>;
  update(id: string, data: Partial<Organization>): Promise<Organization | undefined>;
  updateStatus(id: string, status: OrganizationStatus, updatedBy: string): Promise<Organization | undefined>;
  softDelete(id: string, updatedBy: string): Promise<boolean>;
}
