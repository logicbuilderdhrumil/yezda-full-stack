/**
 * Candidate Management Validation Schemas
 * Zod schemas for request validation.
 */

import { z } from 'zod';

const candidateStatusSchema = z.enum(['pending', 'in_review', 'certified', 'rejected', 'archived']);

export const createCandidateSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required').max(100, 'First name must be at most 100 characters'),
  lastName: z.string().min(1, 'Last name is required').max(100, 'Last name must be at most 100 characters'),
  phone: z.string().max(50, 'Phone must be at most 50 characters').optional(),
  status: candidateStatusSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});

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
  { message: 'At least one field must be provided for update' },
);

export const updateCandidateStatusSchema = z.object({
  status: candidateStatusSchema,
});

export const bulkCreateCandidatesSchema = z.object({
  candidates: z.array(
    z.object({
      email: z.string().email('Invalid email address'),
      firstName: z.string().min(1, 'First name is required').max(100),
      lastName: z.string().min(1, 'Last name is required').max(100),
      phone: z.string().max(50).optional(),
      status: candidateStatusSchema.optional(),
      metadata: z.record(z.unknown()).optional(),
    }),
  ).min(1, 'At least one candidate is required').max(100, 'Cannot create more than 100 candidates at once'),
});

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

export const candidateIdParamSchema = z.object({
  id: z.string().uuid('Invalid candidate ID'),
});

export const tenantIdParamSchema = z.object({
  tenantId: z.string().uuid('Invalid tenant ID'),
});
