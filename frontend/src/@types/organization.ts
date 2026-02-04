/**
 * Organization-related types for the frontend.
 */

/** Organization status. */
export type OrganizationStatus = 'active' | 'suspended' | 'pending';

/** Organization record. */
export interface Organization {
  id: string;
  name: string;
  slug: string;
  status: OrganizationStatus;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

/** Payload for creating an organization. */
export interface CreateOrganizationPayload {
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

/** Payload for updating an organization. */
export interface UpdateOrganizationPayload {
  name?: string;
  slug?: string;
  status?: OrganizationStatus;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

/** Filter parameters for listing organizations. */
export interface OrganizationListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: OrganizationStatus;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

/** Paginated list response for organizations. */
export interface OrganizationListResponse {
  data: Organization[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
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
  { key: 'email', label: 'Email', sortable: false },
  { key: 'createdAt', label: 'Created', sortable: true },
  { key: 'actions', label: '', sortable: false, width: '100px' },
];
