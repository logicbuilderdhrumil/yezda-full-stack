/**
 * User Management Validators
 *
 * Zod schemas for user management request validation.
 * Extracted from legacy validation middleware into interface layer.
 */
import { z } from 'zod';
import { USER_STATUSES, USER_ROLES } from '../../domain/index.js';

const userStatusSchema = z.enum(USER_STATUSES);
const userRoleSchema = z.enum(USER_ROLES);

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
  { message: 'At least one field must be provided for update' },
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
