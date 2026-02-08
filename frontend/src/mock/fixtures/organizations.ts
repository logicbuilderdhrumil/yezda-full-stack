/**
 * Organizations module mock fixtures.
 * Provides fake data for organization management endpoints.
 */

/** Mock organization type. */
export interface MockOrganization {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  industry: string;
  employeeCount: number;
  contactEmail: string;
  createdAt: string;
  updatedAt: string;
}

/** Generate a mock organization with given id. */
export function createMockOrganization(id: string, overrides?: Partial<MockOrganization>): MockOrganization {
  return {
    id,
    name: `Organization ${id}`,
    slug: `org-${id}`,
    status: 'active',
    industry: 'Technology',
    employeeCount: 50,
    contactEmail: `contact@org-${id}.example.com`,
    createdAt: '2025-06-15T10:00:00.000Z',
    updatedAt: '2026-01-20T14:30:00.000Z',
    ...overrides,
  };
}

/** Predefined mock organizations. */
export const mockOrganizations: MockOrganization[] = [
  createMockOrganization('org-001', {
    name: 'Acme Corp',
    slug: 'acme-corp',
    industry: 'Manufacturing',
    employeeCount: 1200,
    contactEmail: 'hr@acmecorp.com',
  }),
  createMockOrganization('org-002', {
    name: 'Global Staffing Ltd',
    slug: 'global-staffing',
    industry: 'Staffing & Recruitment',
    employeeCount: 350,
    contactEmail: 'admin@globalstaffing.co.uk',
  }),
  createMockOrganization('org-003', {
    name: 'TechVentures Inc',
    slug: 'techventures',
    industry: 'Technology',
    employeeCount: 85,
    contactEmail: 'people@techventures.io',
    status: 'pending',
  }),
];

/** Mock paginated organizations list response. */
export const organizationsListResponse = {
  organizations: mockOrganizations,
  total: mockOrganizations.length,
  hasMore: false,
  nextCursor: null,
};

/** Get a single organization by ID. */
export function getOrganizationById(id: string): MockOrganization | undefined {
  return mockOrganizations.find((org) => org.id === id);
}

/** Mock organization creation response. */
export function createOrganizationResponse(data: Partial<MockOrganization>): MockOrganization {
  const id = `org-${String(mockOrganizations.length + 1).padStart(3, '0')}`;
  return createMockOrganization(id, {
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

/** Mock organization update response. */
export function updateOrganizationResponse(id: string, data: Partial<MockOrganization>): MockOrganization | undefined {
  const org = getOrganizationById(id);
  if (org) {
    return { ...org, ...data, updatedAt: new Date().toISOString() };
  }
  return undefined;
}
