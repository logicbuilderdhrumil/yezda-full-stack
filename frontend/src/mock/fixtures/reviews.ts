/**
 * Reviews module mock fixtures.
 * Provides fake data for review task endpoints.
 */

/** Mock review task type. */
export interface MockReview {
  id: string;
  candidateName: string;
  candidateId: string;
  pipelineName: string;
  pipelineId: string;
  stageName: string;
  status: 'pending' | 'in_progress' | 'completed' | 'escalated';
  assignedTo: string;
  assignedToId: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/** Predefined mock reviews. */
export const mockReviews: MockReview[] = [
  {
    id: 'rev-001',
    candidateName: 'John Doe',
    candidateId: 'c001',
    pipelineName: 'Standard Background Check',
    pipelineId: 'pipe-001',
    stageName: 'Final Review',
    status: 'pending',
    assignedTo: 'Alice Agent',
    assignedToId: '003',
    priority: 'high',
    dueDate: '2026-02-10T17:00:00.000Z',
    notes: 'Candidate has international employment history — requires additional verification.',
    createdAt: '2026-02-06T10:00:00.000Z',
    updatedAt: '2026-02-06T10:00:00.000Z',
  },
  {
    id: 'rev-002',
    candidateName: 'Robert Johnson',
    candidateId: 'c003',
    pipelineName: 'Standard Background Check',
    pipelineId: 'pipe-001',
    stageName: 'Reference Check',
    status: 'in_progress',
    assignedTo: 'Bob Agent',
    assignedToId: '004',
    priority: 'medium',
    dueDate: '2026-02-12T17:00:00.000Z',
    createdAt: '2026-02-05T14:30:00.000Z',
    updatedAt: '2026-02-07T09:15:00.000Z',
  },
  {
    id: 'rev-003',
    candidateName: 'Emily Brown',
    candidateId: 'c004',
    pipelineName: 'Quick Pre-Screen',
    pipelineId: 'pipe-002',
    stageName: 'Automated ID Check',
    status: 'escalated',
    assignedTo: 'Alice Agent',
    assignedToId: '003',
    priority: 'urgent',
    dueDate: '2026-02-09T17:00:00.000Z',
    notes: 'ID verification flagged — possible document mismatch.',
    createdAt: '2026-02-04T11:00:00.000Z',
    updatedAt: '2026-02-08T08:00:00.000Z',
  },
];

/** Mock reviews list response. */
export const reviewsListResponse = mockReviews;

/** Mock "my queue" response (reviews assigned to current user). */
export const myQueueResponse = mockReviews.filter((r) => r.assignedToId === '003');

/** Get a single review by ID. */
export function getReviewById(id: string): MockReview | undefined {
  return mockReviews.find((r) => r.id === id);
}
