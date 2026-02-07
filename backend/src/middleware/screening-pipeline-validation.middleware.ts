/**
 * Screening Pipeline Validation Schemas
 * Zod schemas for request validation
 */

import { z } from 'zod';

/**
 * Stage input schema for creating/updating stages
 */
export const stageInputSchema = z.object({
  formDefinitionId: z.string().uuid('Invalid form definition ID'),
  name: z.string().min(1, 'Stage name is required').max(200, 'Stage name must be at most 200 characters'),
  description: z.string().max(500, 'Description must be at most 500 characters').optional(),
  order: z.number().int('Order must be an integer').min(0, 'Order must be non-negative'),
  isRequired: z.boolean().default(true),
  estimatedDurationMinutes: z.number().int().min(0).optional(),
});

/**
 * Create pipeline request body schema
 */
export const createPipelineSchema = z.object({
  name: z.string().min(1, 'Pipeline name is required').max(200, 'Pipeline name must be at most 200 characters'),
  description: z.string().max(1000, 'Description must be at most 1000 characters').optional(),
  stages: z.array(stageInputSchema).min(1, 'At least one stage is required').max(50, 'Maximum 50 stages allowed'),
});

/**
 * Update pipeline request body schema
 */
export const updatePipelineSchema = z.object({
  name: z.string().min(1).max(200, 'Pipeline name must be at most 200 characters').optional(),
  description: z.string().max(1000, 'Description must be at most 1000 characters').optional().nullable(),
  stages: z.array(stageInputSchema).min(1).max(50).optional(),
}).refine(
  (data) => data.name !== undefined || data.description !== undefined || data.stages !== undefined,
  { message: 'At least one field must be provided for update' }
);

/**
 * Assign pipeline request body schema
 */
export const assignPipelineSchema = z.object({
  candidateId: z.string().uuid('Invalid candidate ID'),
});

/**
 * Pipeline ID path parameter schema
 */
export const pipelineIdParamSchema = z.object({
  id: z.string().uuid('Invalid pipeline ID'),
});

/**
 * Assignment ID path parameter schema
 */
export const assignmentIdParamSchema = z.object({
  id: z.string().uuid('Invalid assignment ID'),
});

/**
 * Candidate ID path parameter schema
 */
export const candidateIdParamSchema = z.object({
  candidateId: z.string().uuid('Invalid candidate ID'),
});

/**
 * Stage completion path parameters schema
 */
export const stageCompletionParamsSchema = z.object({
  assignmentId: z.string().uuid('Invalid assignment ID'),
  stageId: z.string().uuid('Invalid stage ID'),
});

// Type exports
export type CreatePipelineInput = z.infer<typeof createPipelineSchema>;
export type UpdatePipelineInput = z.infer<typeof updatePipelineSchema>;
export type AssignPipelineInput = z.infer<typeof assignPipelineSchema>;
export type PipelineIdParam = z.infer<typeof pipelineIdParamSchema>;
export type AssignmentIdParam = z.infer<typeof assignmentIdParamSchema>;
export type CandidateIdParam = z.infer<typeof candidateIdParamSchema>;
export type StageCompletionParams = z.infer<typeof stageCompletionParamsSchema>;
