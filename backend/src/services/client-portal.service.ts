/**
 * Client Portal Service
 * Business logic for client-portal endpoints.
 * Returns mock/placeholder data scoped by tenantId.
 */

// ── Response interfaces ────────────────────────────────────────────

/** Single recent-activity item on the dashboard */
export interface RecentActivityItem {
  id: string;
  type: 'screening_completed' | 'candidate_added' | 'action_required' | 'report_ready';
  message: string;
  timestamp: string;
}

/** Dashboard summary returned by GET /client/dashboard */
export interface DashboardSummary {
  totalCandidates: number;
  activeScreenings: number;
  completedScreenings: number;
  pendingActions: number;
  recentActivity: RecentActivityItem[];
}

/** Candidate screening status */
export type CandidateScreeningStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'on_hold'
  | 'cancelled';

/** Candidate list item */
export interface CandidateListItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  screeningStatus: CandidateScreeningStatus;
  appliedAt: string;
  lastUpdatedAt: string;
}

/** Paginated candidate list */
export interface PaginatedCandidateList {
  candidates: CandidateListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Screening step within candidate detail */
export interface ScreeningStep {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  completedAt: string | null;
}

/** Candidate detail */
export interface CandidateDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  screeningStatus: CandidateScreeningStatus;
  appliedAt: string;
  lastUpdatedAt: string;
  screeningSteps: ScreeningStep[];
  progressPercentage: number;
}

/** Org settings */
export interface OrgSettings {
  orgName: string;
  contactEmail: string;
  logoUrl: string | null;
  notificationPrefs: {
    emailOnScreeningComplete: boolean;
    emailOnActionRequired: boolean;
    weeklyDigest: boolean;
  };
}

/** Org settings update DTO */
export interface UpdateOrgSettingsDto {
  orgName?: string;
  contactEmail?: string;
  notificationPrefs?: Partial<OrgSettings['notificationPrefs']>;
}

/** Generic service result wrapper */
export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

// ── Mock data generators ───────────────────────────────────────────

function mockDashboard(tenantId: string): DashboardSummary {
  return {
    totalCandidates: 142,
    activeScreenings: 38,
    completedScreenings: 96,
    pendingActions: 8,
    recentActivity: [
      {
        id: `${tenantId}-act-1`,
        type: 'screening_completed',
        message: 'Background check completed for Jane Smith',
        timestamp: new Date(Date.now() - 3600_000).toISOString(),
      },
      {
        id: `${tenantId}-act-2`,
        type: 'candidate_added',
        message: 'New candidate John Doe added',
        timestamp: new Date(Date.now() - 7200_000).toISOString(),
      },
      {
        id: `${tenantId}-act-3`,
        type: 'action_required',
        message: 'Document verification pending for Alex Johnson',
        timestamp: new Date(Date.now() - 10800_000).toISOString(),
      },
      {
        id: `${tenantId}-act-4`,
        type: 'report_ready',
        message: 'Screening report ready for Maria Garcia',
        timestamp: new Date(Date.now() - 14400_000).toISOString(),
      },
    ],
  };
}

const MOCK_CANDIDATES: CandidateListItem[] = [
  { id: 'cand-1', firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@example.com', screeningStatus: 'completed', appliedAt: '2025-12-01T10:00:00Z', lastUpdatedAt: '2026-01-15T14:30:00Z' },
  { id: 'cand-2', firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', screeningStatus: 'in_progress', appliedAt: '2026-01-05T09:00:00Z', lastUpdatedAt: '2026-02-01T11:00:00Z' },
  { id: 'cand-3', firstName: 'Alex', lastName: 'Johnson', email: 'alex.j@example.com', screeningStatus: 'pending', appliedAt: '2026-01-20T08:00:00Z', lastUpdatedAt: '2026-01-20T08:00:00Z' },
  { id: 'cand-4', firstName: 'Maria', lastName: 'Garcia', email: 'maria.g@example.com', screeningStatus: 'completed', appliedAt: '2025-11-15T12:00:00Z', lastUpdatedAt: '2026-01-10T16:00:00Z' },
  { id: 'cand-5', firstName: 'David', lastName: 'Wilson', email: 'david.w@example.com', screeningStatus: 'on_hold', appliedAt: '2026-01-12T14:00:00Z', lastUpdatedAt: '2026-01-28T09:30:00Z' },
  { id: 'cand-6', firstName: 'Sarah', lastName: 'Brown', email: 'sarah.b@example.com', screeningStatus: 'in_progress', appliedAt: '2026-01-18T10:00:00Z', lastUpdatedAt: '2026-02-03T13:00:00Z' },
];

function mockCandidateDetail(id: string): CandidateDetail | undefined {
  const item = MOCK_CANDIDATES.find((c) => c.id === id);
  if (!item) return undefined;

  return {
    ...item,
    phone: '+44 7700 900000',
    screeningSteps: [
      { id: 'step-1', name: 'Identity Verification', status: 'completed', completedAt: '2026-01-10T10:00:00Z' },
      { id: 'step-2', name: 'Right to Work', status: 'completed', completedAt: '2026-01-12T11:00:00Z' },
      { id: 'step-3', name: 'DBS Check', status: item.screeningStatus === 'completed' ? 'completed' : 'in_progress', completedAt: item.screeningStatus === 'completed' ? '2026-01-15T14:00:00Z' : null },
      { id: 'step-4', name: 'Reference Check', status: item.screeningStatus === 'completed' ? 'completed' : 'pending', completedAt: item.screeningStatus === 'completed' ? '2026-01-15T14:30:00Z' : null },
    ],
    progressPercentage: item.screeningStatus === 'completed' ? 100 : item.screeningStatus === 'in_progress' ? 50 : 0,
  };
}

// In-memory org settings store keyed by tenantId (mock)
const orgSettingsStore = new Map<string, OrgSettings>();

function getOrgSettings(tenantId: string): OrgSettings {
  if (!orgSettingsStore.has(tenantId)) {
    orgSettingsStore.set(tenantId, {
      orgName: 'Acme Screening Ltd',
      contactEmail: 'admin@acme-screening.co.uk',
      logoUrl: null,
      notificationPrefs: {
        emailOnScreeningComplete: true,
        emailOnActionRequired: true,
        weeklyDigest: false,
      },
    });
  }
  return orgSettingsStore.get(tenantId)!;
}

// ── Service methods ────────────────────────────────────────────────

/**
 * Get dashboard summary for a tenant.
 */
export function getDashboardSummary(tenantId: string): ServiceResult<DashboardSummary> {
  return { success: true, data: mockDashboard(tenantId) };
}

/**
 * List candidates with pagination, search and status filter.
 */
export function listCandidates(
  tenantId: string,
  params: { page?: number; limit?: number; search?: string; status?: string }
): ServiceResult<PaginatedCandidateList> {
  let filtered = [...MOCK_CANDIDATES];

  if (params.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.firstName.toLowerCase().includes(q) ||
        c.lastName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
    );
  }

  if (params.status) {
    filtered = filtered.filter((c) => c.screeningStatus === params.status);
  }

  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, Math.max(1, params.limit ?? 20));
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  const candidates = filtered.slice(start, start + limit);

  return {
    success: true,
    data: { candidates, total, page, limit, totalPages },
  };
}

/**
 * Get single candidate detail.
 */
export function getCandidateDetail(
  tenantId: string,
  candidateId: string
): ServiceResult<CandidateDetail> {
  const detail = mockCandidateDetail(candidateId);
  if (!detail) {
    return { success: false, error: 'Candidate not found', errorCode: 'NOT_FOUND' };
  }
  return { success: true, data: detail };
}

/**
 * Get org settings for a tenant.
 */
export function getOrgSettingsForTenant(tenantId: string): ServiceResult<OrgSettings> {
  return { success: true, data: getOrgSettings(tenantId) };
}

/**
 * Update org settings for a tenant (client_admin only — enforced at route level).
 */
export function updateOrgSettings(
  tenantId: string,
  dto: UpdateOrgSettingsDto
): ServiceResult<OrgSettings> {
  const current = getOrgSettings(tenantId);

  if (dto.orgName !== undefined) current.orgName = dto.orgName;
  if (dto.contactEmail !== undefined) current.contactEmail = dto.contactEmail;
  if (dto.notificationPrefs) {
    current.notificationPrefs = { ...current.notificationPrefs, ...dto.notificationPrefs };
  }

  orgSettingsStore.set(tenantId, current);
  return { success: true, data: current };
}

/** Export for testing — resets the in-memory org settings store. */
export function _resetOrgSettingsStore(): void {
  orgSettingsStore.clear();
}
