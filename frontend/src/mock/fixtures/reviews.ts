/**
 * Reviews module mock fixtures.
 * Provides fake data for review task endpoints.
 */

/** Mock review task type. */
export interface MockReview {
  id: string;
  tenantId: string;
  candidateId: string;
  pipelineId: string;
  assignmentId: string;
  stageId: string;
  assigneeId: string | null;
  assigneeRole: string;
  status: 'pending' | 'assigned' | 'in_review' | 'decided' | 'escalated' | 'expired';
  decision: string | null;
  decisionNotes: string | null;
  reviewFormId: string | null;
  reviewFormData: Record<string, unknown> | null;
  decisionOptions: string[];
  timeoutHours: number;
  escalationPolicy: { action: string; targetRole?: string };
  dueAt: string | null;
  decidedAt: string | null;
  decidedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Predefined mock reviews. */
export const mockReviews: MockReview[] = [
  {
    id: 'rev-001',
    tenantId: 'tenant-001',
    candidateId: 'c001',
    pipelineId: 'pipe-001',
    assignmentId: 'assign-001',
    stageId: 'stage-final-review',
    assigneeId: '003',
    assigneeRole: 'reviewer',
    status: 'pending',
    decision: null,
    decisionNotes: null,
    reviewFormId: null,
    reviewFormData: null,
    decisionOptions: ['approve', 'reject', 'request_info'],
    timeoutHours: 48,
    escalationPolicy: { action: 'reassign', targetRole: 'senior_reviewer' },
    dueAt: '2026-02-10T17:00:00.000Z',
    decidedAt: null,
    decidedBy: null,
    createdAt: '2026-02-06T10:00:00.000Z',
    updatedAt: '2026-02-06T10:00:00.000Z',
  },
  {
    id: 'rev-002',
    tenantId: 'tenant-001',
    candidateId: 'c003',
    pipelineId: 'pipe-001',
    assignmentId: 'assign-002',
    stageId: 'stage-ref-check',
    assigneeId: '004',
    assigneeRole: 'agent',
    status: 'in_review',
    decision: null,
    decisionNotes: null,
    reviewFormId: null,
    reviewFormData: null,
    decisionOptions: ['approve', 'reject', 'escalate'],
    timeoutHours: 72,
    escalationPolicy: { action: 'notify', targetRole: 'manager' },
    dueAt: '2026-02-12T17:00:00.000Z',
    decidedAt: null,
    decidedBy: null,
    createdAt: '2026-02-05T14:30:00.000Z',
    updatedAt: '2026-02-07T09:15:00.000Z',
  },
  {
    id: 'rev-003',
    tenantId: 'tenant-001',
    candidateId: 'c004',
    pipelineId: 'pipe-002',
    assignmentId: 'assign-003',
    stageId: 'stage-id-check',
    assigneeId: '003',
    assigneeRole: 'reviewer',
    status: 'escalated',
    decision: null,
    decisionNotes: null,
    reviewFormId: null,
    reviewFormData: null,
    decisionOptions: ['approve', 'reject', 'request_info'],
    timeoutHours: 24,
    escalationPolicy: { action: 'reassign', targetRole: 'senior_reviewer' },
    dueAt: '2026-02-09T17:00:00.000Z',
    decidedAt: null,
    decidedBy: null,
    createdAt: '2026-02-04T11:00:00.000Z',
    updatedAt: '2026-02-08T08:00:00.000Z',
  },
];

/** Mock reviews list response. */
export const reviewsListResponse = mockReviews;

/** Mock "my queue" response (reviews assigned to current user). */
export const myQueueResponse = mockReviews.filter((r) => r.assigneeId === '003');

/** Get a single review by ID. */
export function getReviewById(id: string): MockReview | undefined {
  return mockReviews.find((r) => r.id === id);
}
