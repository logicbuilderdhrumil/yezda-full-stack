/**
 * Org Management Domain Entities
 */

export type OrganizationStatus = 'active' | 'suspended' | 'pending' | 'archived';
export type OrganizationPlan = 'free' | 'starter' | 'professional' | 'enterprise';

export interface OrganizationSettings {
  allowSelfRegistration: boolean;
  requireMfa: boolean;
  sessionTimeoutMinutes: number;
  maxUsersAllowed?: number;
  features: string[];
}

export const DEFAULT_ORG_SETTINGS: OrganizationSettings = {
  allowSelfRegistration: false,
  requireMfa: false,
  sessionTimeoutMinutes: 60,
  features: [],
};

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  status: OrganizationStatus;
  plan: OrganizationPlan;
  logoUrl?: string;
  website?: string;
  primaryContactEmail: string;
  primaryContactName?: string;
  metadata?: Record<string, unknown>;
  settings?: OrganizationSettings;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
}

export interface CreateOrgDto {
  name: string;
  slug?: string;
  description?: string;
  plan?: OrganizationPlan;
  logoUrl?: string;
  website?: string;
  primaryContactEmail: string;
  primaryContactName?: string;
  settings?: Partial<OrganizationSettings>;
  metadata?: Record<string, unknown>;
}

export interface UpdateOrgDto {
  name?: string;
  description?: string | null;
  status?: OrganizationStatus;
  plan?: OrganizationPlan;
  logoUrl?: string | null;
  website?: string | null;
  primaryContactEmail?: string;
  primaryContactName?: string | null;
  settings?: Partial<OrganizationSettings>;
  metadata?: Record<string, unknown>;
}

export interface OrgFilters {
  status?: OrganizationStatus;
  plan?: OrganizationPlan;
  search?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface OrgPaginationOptions {
  limit?: number;
  offset?: number;
  cursor?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface OrgListResult {
  organizations: Organization[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

export interface OrgOperationResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

export interface OrgContext {
  actorId: string;
  actorType: 'user' | 'candidate';
  actorRoles: string[];
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
  channel: 'web' | 'mobile' | 'api';
}

export type OrgAuditEventType =
  | 'ORG_CREATED'
  | 'ORG_UPDATED'
  | 'ORG_STATUS_CHANGED'
  | 'ORG_ACCESSED'
  | 'ORG_LIST_ACCESSED'
  | 'ORG_ACCESS_DENIED'
  | 'ORG_RATE_LIMITED';

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50);
}
