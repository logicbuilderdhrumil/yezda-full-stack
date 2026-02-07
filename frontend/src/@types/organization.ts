/**
 * Organization-related types for the frontend.
 * Aligned with backend contract (org-management.model.ts).
 */

/** Organization status - matches backend OrganizationStatus. */
export type OrganizationStatus = 'active' | 'suspended' | 'pending' | 'archived';

/** Organization plan/tier levels - matches backend OrganizationPlan. */
export type OrganizationPlan = 'free' | 'starter' | 'professional' | 'enterprise';

/** Organization settings - matches backend OrganizationSettings. */
export interface OrganizationSettings {
  allowSelfRegistration: boolean;
  requireMfa: boolean;
  sessionTimeoutMinutes: number;
  maxUsersAllowed?: number;
  features: string[];
}

/** Organization record - aligned with backend Organization entity. */
export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  status: OrganizationStatus;
  plan: OrganizationPlan;
  logoUrl?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  primaryContactEmail: string;
  primaryContactName?: string;
  metadata?: Record<string, unknown>;
  settings?: OrganizationSettings;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
}

/** Payload for creating an organization - aligned with backend CreateOrganizationInput. */
export interface CreateOrganizationPayload {
  name: string;
  slug?: string;
  description?: string;
  plan?: OrganizationPlan;
  logoUrl?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  primaryContactEmail?: string;
  primaryContactName?: string;
  settings?: Partial<OrganizationSettings>;
  metadata?: Record<string, unknown>;
}

/** Payload for updating an organization - aligned with backend UpdateOrganizationInput. */
export interface UpdateOrganizationPayload {
  name?: string;
  description?: string;
  status?: OrganizationStatus;
  plan?: OrganizationPlan;
  logoUrl?: string;
  website?: string;
  primaryContactEmail?: string;
  primaryContactName?: string;
  settings?: Partial<OrganizationSettings>;
  metadata?: Record<string, unknown>;
}

/** Filter parameters for listing organizations - aligned with backend OrganizationFilters & pagination. */
export interface OrganizationListParams {
  /** Page number (1-indexed, for convenience - converted to offset internally) */
  page?: number;
  /** Items per page (maps to limit) */
  pageSize?: number;
  /** Search query string */
  search?: string;
  /** Filter by status */
  status?: OrganizationStatus;
  /** Filter by plan */
  plan?: OrganizationPlan;
  /** Sort field */
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
  /** Cursor for cursor-based pagination (optional) */
  cursor?: string;
  /** Created after date filter */
  createdAfter?: string;
  /** Created before date filter */
  createdBefore?: string;
}

/** Backend list result structure - matches OrganizationListResult. */
export interface OrganizationListResult {
  organizations: Organization[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

/** Paginated list response for organizations - normalized for frontend consumption. */
export interface OrganizationListResponse {
  data: Organization[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasMore: boolean;
    nextCursor?: string | undefined;
  };
}

/** Table column definition for organizations. */
export interface OrganizationColumn {
  key: keyof Organization | 'actions';
  label: string;
  sortable?: boolean;
  width?: string;
}

/** Default columns for the organizations list. */
export const ORGANIZATION_COLUMNS: OrganizationColumn[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'slug', label: 'Slug', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'plan', label: 'Plan', sortable: true },
  { key: 'primaryContactEmail', label: 'Contact Email', sortable: false },
  { key: 'createdAt', label: 'Created', sortable: true },
  { key: 'actions', label: '', sortable: false, width: '100px' },
];

/** Default organization settings - matches backend DEFAULT_ORG_SETTINGS. */
export const DEFAULT_ORG_SETTINGS: OrganizationSettings = {
  allowSelfRegistration: false,
  requireMfa: false,
  sessionTimeoutMinutes: 60,
  features: [],
};
