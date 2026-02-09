/**
 * Screenings module mock fixtures.
 * Provides fake data for screening list endpoints.
 */

/** Mock screening request type aligned with ClientPortalService.ScreeningRequest. */
export interface MockScreening {
  id: string;
  candidateId: string;
  candidateName: string;
  type: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  requestedAt: string;
  completedAt: string | null;
  result: 'pass' | 'fail' | 'pending' | null;
}

/** Generate a mock screening with given id. */
export function createMockScreening(id: string, overrides?: Partial<MockScreening>): MockScreening {
  return {
    id,
    candidateId: `c00${id.replace(/\D/g, '')}`,
    candidateName: `Candidate ${id}`,
    type: 'background_check',
    status: 'pending',
    requestedAt: '2026-01-10T09:00:00.000Z',
    completedAt: null,
    result: null,
    ...overrides,
  };
}

/** Predefined mock screenings list. */
export const mockScreenings: MockScreening[] = [
  createMockScreening('scr-001', {
    candidateId: 'c001',
    candidateName: 'John Doe',
    type: 'background_check',
    status: 'completed',
    completedAt: '2026-01-18T14:30:00.000Z',
    result: 'pass',
  }),
  createMockScreening('scr-002', {
    candidateId: 'c002',
    candidateName: 'Jane Smith',
    type: 'identity_verification',
    status: 'in_progress',
    result: 'pending',
  }),
  createMockScreening('scr-003', {
    candidateId: 'c003',
    candidateName: 'Robert Johnson',
    type: 'reference_check',
    status: 'pending',
  }),
  createMockScreening('scr-004', {
    candidateId: 'c004',
    candidateName: 'Emily Brown',
    type: 'criminal_record',
    status: 'completed',
    completedAt: '2026-01-20T11:00:00.000Z',
    result: 'fail',
  }),
  createMockScreening('scr-005', {
    candidateId: 'c005',
    candidateName: 'Michael Davis',
    type: 'employment_history',
    status: 'completed',
    completedAt: '2026-02-01T16:45:00.000Z',
    result: 'pass',
  }),
  createMockScreening('scr-006', {
    candidateId: 'c006',
    candidateName: 'Sarah Wilson',
    type: 'education_verification',
    status: 'failed',
    completedAt: '2026-02-05T08:20:00.000Z',
    result: 'fail',
  }),
];

/** Mock paginated screenings list response. */
export const screeningsListResponse = {
  data: mockScreenings,
  meta: {
    page: 1,
    limit: 10,
    total: mockScreenings.length,
    totalPages: 1,
  },
};
