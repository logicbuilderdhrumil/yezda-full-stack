/**
 * User Management Validation Schemas
 * Task 1.1: Define user schema and validation rules
 */

import { z } from 'zod';

// User status enum
const userStatusSchema = z.enum(['active', 'inactive', 'suspended', 'pending']);

// User role enum
const userRoleSchema = z.enum(['platform_admin', 'platform_manager', 'platform_agent', 'platform_viewer', 'org_admin', 'org_manager', 'org_viewer']);

/**
 * Create user request body schema
 */
export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  displayName: z.string().max(255, 'Display name must be at most 255 characters').optional(),
  firstName: z.string().max(100, 'First name must be at most 100 characters').optional(),
  lastName: z.string().max(100, 'Last name must be at most 100 characters').optional(),
  status: userStatusSchema.optional(),
  roles: z
    .array(userRoleSchema)
    .min(1, 'At least one role is required')
    .max(4, 'At most 4 roles can be assigned'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters')
    .optional(),
});

/**
 * Update user request body schema
 */
export const updateUserSchema = z.object({
  displayName: z.string().max(255, 'Display name must be at most 255 characters').optional(),
  firstName: z.string().max(100, 'First name must be at most 100 characters').optional(),
  lastName: z.string().max(100, 'Last name must be at most 100 characters').optional(),
  status: userStatusSchema.optional(),
  roles: z
    .array(userRoleSchema)
    .min(1, 'At least one role is required')
    .max(4, 'At most 4 roles can be assigned')
    .optional(),
}).refine(
  (data) =>
    data.displayName !== undefined ||
    data.firstName !== undefined ||
    data.lastName !== undefined ||
    data.status !== undefined ||
    data.roles !== undefined,
  { message: 'At least one field must be provided for update' }
);

/**
 * Update user status request body schema
 */
export const updateUserStatusSchema = z.object({
  status: userStatusSchema,
});

/**
 * Update user roles request body schema
 */
export const updateUserRolesSchema = z.object({
  roles: z
    .array(userRoleSchema)
    .min(1, 'At least one role is required')
    .max(4, 'At most 4 roles can be assigned'),
});

/**
 * User search query parameters schema
 */
export const userSearchQuerySchema = z.object({
  q: z.string().max(200, 'Search query must be at most 200 characters').optional(),
  status: userStatusSchema.optional(),
  role: userRoleSchema.optional(),
  page: z.coerce.number().int().positive().max(10000).optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  sortBy: z.enum(['email', 'displayName', 'createdAt', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * User ID path parameter schema
 */
export const userIdParamSchema = z.object({
  id: z.string().uuid('Invalid user ID'),
});

// Type exports
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
export type UpdateUserRolesInput = z.infer<typeof updateUserRolesSchema>;
export type UserSearchQuery = z.infer<typeof userSearchQuerySchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
