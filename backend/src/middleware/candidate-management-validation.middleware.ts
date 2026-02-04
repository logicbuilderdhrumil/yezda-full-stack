/**
 * Candidate Management Validation Schemas
 * Task 1.1: Define candidate schema and validation rules
 */

import { z } from 'zod';

// Candidate status enum
const candidateStatusSchema = z.enum(['pending', 'in_review', 'certified', 'rejected', 'archived']);

/**
 * Create candidate request body schema
 */
export const createCandidateSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required').max(100, 'First name must be at most 100 characters'),
  lastName: z.string().min(1, 'Last name is required').max(100, 'Last name must be at most 100 characters'),
  phone: z.string().max(50, 'Phone must be at most 50 characters').optional(),
  status: candidateStatusSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Update candidate request body schema
 */
export const updateCandidateSchema = z.object({
  firstName: z.string().min(1).max(100, 'First name must be at most 100 characters').optional(),
  lastName: z.string().min(1).max(100, 'Last name must be at most 100 characters').optional(),
  phone: z.string().max(50, 'Phone must be at most 50 characters').optional().nullable(),
  status: candidateStatusSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
}).refine(
  (data) =>
    data.firstName !== undefined ||
    data.lastName !== undefined ||
    data.phone !== undefined ||
    data.status !== undefined ||
    data.metadata !== undefined,
  { message: 'At least one field must be provided for update' }
);

/**
 * Update candidate status request body schema
 */
export const updateCandidateStatusSchema = z.object({
  status: candidateStatusSchema,
});

/**
 * Bulk create candidates request body schema
 */
export const bulkCreateCandidatesSchema = z.object({
  candidates: z.array(
    z.object({
      email: z.string().email('Invalid email address'),
      firstName: z.string().min(1, 'First name is required').max(100),
      lastName: z.string().min(1, 'Last name is required').max(100),
      phone: z.string().max(50).optional(),
      status: candidateStatusSchema.optional(),
      metadata: z.record(z.unknown()).optional(),
    })
  ).min(1, 'At least one candidate is required').max(100, 'Cannot create more than 100 candidates at once'),
});

/**
 * Public submission form request body schema
 */
export const candidateSubmissionSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required').max(100, 'First name must be at most 100 characters'),
  lastName: z.string().min(1, 'Last name is required').max(100, 'Last name must be at most 100 characters'),
  phone: z.string().max(50, 'Phone must be at most 50 characters').optional(),
  consentGiven: z.literal(true, {
    errorMap: () => ({ message: 'Consent must be given to submit' }),
  }),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Candidate search query parameters schema
 */
export const candidateSearchQuerySchema = z.object({
  q: z.string().max(200, 'Search query must be at most 200 characters').optional(),
  status: candidateStatusSchema.optional(),
  certified: z.coerce.boolean().optional(),
  archived: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().max(10000).optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  sortBy: z.enum(['email', 'firstName', 'lastName', 'applicationDate', 'createdAt', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * Candidate ID path parameter schema
 */
export const candidateIdParamSchema = z.object({
  id: z.string().uuid('Invalid candidate ID'),
});

/**
 * Tenant ID path parameter schema for public submission
 */
export const tenantIdParamSchema = z.object({
  tenantId: z.string().uuid('Invalid tenant ID'),
});

// Type exports
export type CreateCandidateInput = z.infer<typeof createCandidateSchema>;
export type UpdateCandidateInput = z.infer<typeof updateCandidateSchema>;
export type UpdateCandidateStatusInput = z.infer<typeof updateCandidateStatusSchema>;
export type BulkCreateCandidatesInput = z.infer<typeof bulkCreateCandidatesSchema>;
export type CandidateSubmissionInput = z.infer<typeof candidateSubmissionSchema>;
export type CandidateSearchQuery = z.infer<typeof candidateSearchQuerySchema>;
export type CandidateIdParam = z.infer<typeof candidateIdParamSchema>;
export type TenantIdParam = z.infer<typeof tenantIdParamSchema>;
