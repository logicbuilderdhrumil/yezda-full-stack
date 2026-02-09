/**
 * Review Task Model
 * Defines types and Zod schemas for human review tasks in the screening pipeline.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Enums / Literal Types
// ---------------------------------------------------------------------------

export type ReviewTaskStatus =
  | 'pending'
  | 'assigned'
  | 'in_review'
  | 'decided'
  | 'escalated'
  | 'expired';

export type ReviewDecision =
  | 'approved'
  | 'rejected'
  | 'more_info_needed'
  | 'escalated';

// ---------------------------------------------------------------------------
// Core Entity
// ---------------------------------------------------------------------------

export interface ReviewTask {
  id: string;
  tenantId: string;
  pipelineId: string;
  assignmentId: string;
  stageId: string;
  candidateId: string;
  assigneeId: string | null;
  assigneeRole: string;
  status: ReviewTaskStatus;
  decision: ReviewDecision | null;
  decisionNotes: string | null;
  reviewFormId: string | null;
  reviewFormData: Record<string, unknown> | null;
  decisionOptions: string[];
  timeoutHours: number;
  escalationPolicy: { action: string; targetRole?: string };
  dueAt: Date | null;
  decidedAt: Date | null;
  decidedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

/** Schema for creating a new review task */
export const CreateReviewTaskSchema = z.object({
  pipelineId: z.string().uuid(),
  assignmentId: z.string().uuid(),
  stageId: z.string().uuid(),
  candidateId: z.string().uuid(),
  assigneeId: z.string().uuid().nullable().optional(),
  assigneeRole: z.string().min(1).max(100),
  reviewFormId: z.string().uuid().nullable().optional(),
  decisionOptions: z.array(z.string().min(1)).min(1),
  timeoutHours: z.number().int().min(1).max(720).default(24),
  escalationPolicy: z.object({
    action: z.enum(['reassign', 'notify_manager', 'auto_approve', 'auto_reject']),
    targetRole: z.string().min(1).optional(),
  }),
});

export type CreateReviewTaskDto = z.infer<typeof CreateReviewTaskSchema>;

/** Schema for submitting a review decision */
export const ReviewDecisionSchema = z.object({
  decision: z.enum(['approved', 'rejected', 'more_info_needed', 'escalated']),
  decisionNotes: z.string().max(5000).optional(),
  reviewFormData: z.record(z.unknown()).optional(),
});

export type ReviewDecisionDto = z.infer<typeof ReviewDecisionSchema>;

/** Schema for assigning a task */
export const AssignReviewTaskSchema = z.object({
  assigneeId: z.string().uuid(),
});

export type AssignReviewTaskDto = z.infer<typeof AssignReviewTaskSchema>;

/** Schema for list filters */
export const ReviewTaskFilterSchema = z.object({
  status: z
    .enum(['pending', 'assigned', 'in_review', 'decided', 'escalated', 'expired'])
    .optional(),
  assigneeRole: z.string().optional(),
  assigneeId: z.string().uuid().optional(),
});

export type ReviewTaskFilter = z.infer<typeof ReviewTaskFilterSchema>;

// ---------------------------------------------------------------------------
// Operation Result
// ---------------------------------------------------------------------------

export interface ReviewTaskOperationResult<T = ReviewTask> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}
