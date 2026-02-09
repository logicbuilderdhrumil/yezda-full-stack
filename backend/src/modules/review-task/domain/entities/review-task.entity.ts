/**
 * Review Task domain entity.
 */

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

export interface EscalationPolicy {
  action: string;
  targetRole?: string;
}

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
  escalationPolicy: EscalationPolicy;
  dueAt: Date | null;
  decidedAt: Date | null;
  decidedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}
