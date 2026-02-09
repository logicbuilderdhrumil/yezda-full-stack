/**
 * Candidates module mock fixtures.
 * Provides fake data for candidate management endpoints.
 */

/** Mock candidate type. */
export interface MockCandidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: 'pending' | 'active' | 'certified' | 'archived';
  organizationId: string;
  organizationName: string;
  applicationDate: string;
  createdAt: string;
  updatedAt: string;
}

/** Generate a mock candidate with given id. */
export function createMockCandidate(id: string, overrides?: Partial<MockCandidate>): MockCandidate {
  return {
    id,
    firstName: `Candidate${id}`,
    lastName: `Last${id}`,
    email: `candidate${id}@example.com`,
    phone: `+1-555-000-${id.padStart(4, '0')}`,
    status: 'pending',
    organizationId: 'org-001',
    organizationName: 'Acme Corp',
    applicationDate: '2025-01-15T00:00:00.000Z',
    createdAt: '2025-01-15T00:00:00.000Z',
    updatedAt: '2025-01-15T00:00:00.000Z',
    ...overrides,
  };
}

/** Predefined mock candidates list. */
export const mockCandidates: MockCandidate[] = [
  createMockCandidate('c001', { firstName: 'John', lastName: 'Doe', status: 'active' }),
  createMockCandidate('c002', { firstName: 'Jane', lastName: 'Smith', status: 'certified', organizationName: 'Beta Inc' }),
  createMockCandidate('c003', { firstName: 'Robert', lastName: 'Johnson', status: 'pending' }),
  createMockCandidate('c004', { firstName: 'Emily', lastName: 'Brown', status: 'archived', organizationName: 'Gamma Ltd' }),
  createMockCandidate('c005', { firstName: 'Michael', lastName: 'Davis', status: 'active' }),
  createMockCandidate('c006', { firstName: 'Sarah', lastName: 'Wilson', status: 'pending', organizationName: 'Delta Co' }),
];

/** Mock paginated candidates list response. */
export const candidatesListResponse = {
  data: mockCandidates,
  meta: {
    page: 1,
    pageSize: 10,
    totalItems: mockCandidates.length,
    totalPages: 1,
  },
};

/** Get a single candidate by ID. */
export function getCandidateById(id: string): MockCandidate | undefined {
  return mockCandidates.find((candidate) => candidate.id === id);
}

/** Mock candidate creation response. */
export function createCandidateResponse(data: Partial<MockCandidate>): MockCandidate {
  const id = `c${String(mockCandidates.length + 1).padStart(3, '0')}`;
  return createMockCandidate(id, data);
}

/** Mock candidate update response. */
export function updateCandidateResponse(id: string, data: Partial<MockCandidate>): MockCandidate | undefined {
  const candidate = getCandidateById(id);
  if (candidate) {
    return { ...candidate, ...data, updatedAt: new Date().toISOString() };
  }
  return undefined;
}

/** Mock candidate deletion response. */
export const deleteCandidateResponse = {
  success: true,
  message: 'Candidate deleted successfully.',
};
