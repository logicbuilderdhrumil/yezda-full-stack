/**
 * Organization Management Models
 * Task 1.1: Define organization schema and validation rules.
 */

import { z } from 'zod';

/** Organization status values */
export type OrganizationStatus = 'active' | 'suspended' | 'pending' | 'archived';

/** Organization plan/tier levels */
export type OrganizationPlan = 'free' | 'starter' | 'professional' | 'enterprise';

/** Organization entity */
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

/** Organization settings */
export interface OrganizationSettings {
  allowSelfRegistration: boolean;
  requireMfa: boolean;
  sessionTimeoutMinutes: number;
  maxUsersAllowed?: number;
  features: string[];
}

/** Default organization settings */
export const DEFAULT_ORG_SETTINGS: OrganizationSettings = {
  allowSelfRegistration: false,
  requireMfa: false,
  sessionTimeoutMinutes: 60,
  features: [],
};

/** Input for creating an organization */
export interface CreateOrganizationInput {
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
  createdBy: string;
}

/** Input for updating an organization */
export interface UpdateOrganizationInput {
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
  updatedBy: string;
}

/** Filters for listing organizations */
export interface OrganizationFilters {
  status?: OrganizationStatus;
  plan?: OrganizationPlan;
  search?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}

/** Pagination options for organization lists */
export interface OrganizationPaginationOptions {
  limit?: number;
  offset?: number;
  cursor?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

/** Result of organization list operation */
export interface OrganizationListResult {
  organizations: Organization[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

/** Result type for organization operations */
export type OrganizationOperationResult<T = Organization> =
  | { success: true; data: T }
  | { success: false; error: string; errorCode: string };

/** Zod schema for organization settings */
export const organizationSettingsSchema = z.object({
  allowSelfRegistration: z.boolean().optional(),
  requireMfa: z.boolean().optional(),
  sessionTimeoutMinutes: z.number().int().positive().max(1440).optional(),
  maxUsersAllowed: z.number().int().positive().optional(),
  features: z.array(z.string()).optional(),
});

/** Zod schema for creating an organization */
export const createOrganizationSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens')
    .optional(),
  description: z.string().max(500).optional(),
  plan: z.enum(['free', 'starter', 'professional', 'enterprise']).optional(),
  logoUrl: z.string().url().optional(),
  website: z.string().url().optional(),
  primaryContactEmail: z.string().email(),
  primaryContactName: z.string().max(100).optional(),
  settings: organizationSettingsSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});

/** Zod schema for updating an organization */
export const updateOrganizationSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  description: z.string().max(500).optional().nullable(),
  status: z.enum(['active', 'suspended', 'pending', 'archived']).optional(),
  plan: z.enum(['free', 'starter', 'professional', 'enterprise']).optional(),
  logoUrl: z.string().url().optional().nullable(),
  website: z.string().url().optional().nullable(),
  primaryContactEmail: z.string().email().optional(),
  primaryContactName: z.string().max(100).optional().nullable(),
  settings: organizationSettingsSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});

/** Zod schema for organization list query parameters */
export const listOrganizationsQuerySchema = z.object({
  status: z.enum(['active', 'suspended', 'pending', 'archived']).optional(),
  plan: z.enum(['free', 'starter', 'professional', 'enterprise']).optional(),
  search: z.string().max(100).optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
  cursor: z.string().optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/** Zod schema for organization ID parameter */
export const orgIdParamSchema = z.object({
  id: z.string().uuid(),
});

/** Generate a URL-friendly slug from organization name */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50);
}

/** Organization-specific audit event types */
export type OrgAuditEventType =
  | 'ORG_CREATED'
  | 'ORG_UPDATED'
  | 'ORG_STATUS_CHANGED'
  | 'ORG_ACCESSED'
  | 'ORG_LIST_ACCESSED'
  | 'ORG_ACCESS_DENIED'
  | 'ORG_RATE_LIMITED';
