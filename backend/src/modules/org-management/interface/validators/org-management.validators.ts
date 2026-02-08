/**
 * Org Management Validators – Zod schemas
 */
import { z } from 'zod';

export const createOrganizationSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  plan: z.enum(['free', 'starter', 'professional', 'enterprise']).default('free'),
  logoUrl: z.string().url().optional(),
  website: z.string().url().optional(),
  primaryContactEmail: z.string().email(),
  primaryContactName: z.string().max(100).optional(),
  settings: z
    .object({
      allowSelfRegistration: z.boolean().default(false),
      requireMfa: z.boolean().default(false),
      sessionTimeoutMinutes: z.number().min(5).max(1440).default(60),
      features: z.record(z.boolean()).default({}),
    })
    .optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const updateOrganizationSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  plan: z.enum(['free', 'starter', 'professional', 'enterprise']).optional(),
  logoUrl: z.string().url().optional(),
  website: z.string().url().optional(),
  primaryContactEmail: z.string().email().optional(),
  primaryContactName: z.string().max(100).optional(),
  settings: z
    .object({
      allowSelfRegistration: z.boolean().optional(),
      requireMfa: z.boolean().optional(),
      sessionTimeoutMinutes: z.number().min(5).max(1440).optional(),
      features: z.record(z.boolean()).optional(),
    })
    .optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const listOrganizationsQuerySchema = z.object({
  status: z.enum(['active', 'suspended', 'pending', 'archived']).optional(),
  plan: z.enum(['free', 'starter', 'professional', 'enterprise']).optional(),
  search: z.string().max(100).optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
});

export const orgIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['active', 'suspended', 'pending', 'archived']),
});
