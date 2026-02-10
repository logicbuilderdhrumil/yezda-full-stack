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
  candidateId?: string;
  candidateName?: string;
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
  status: string;
  screeningStatus: CandidateScreeningStatus;
  submittedAt: string;
  updatedAt: string;
}

/** Paginated candidate list */
export interface PaginatedCandidateList {
  candidates: CandidateListItem[];
  page: number;
  limit: number;
  total: number;
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
  logo?: string;
  contactPhone?: string;
  address?: string;
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
  contactPhone?: string;
  address?: string;
  notificationPrefs?: Partial<OrgSettings['notificationPrefs']>;
}

/** Screening request item */
export interface ScreeningRequest {
  id: string;
  candidateId: string;
  candidateName: string;
  type: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  requestedAt: string;
  completedAt: string | null;
  result: 'pass' | 'fail' | 'pending' | null;
}

/** Paginated screening list response */
export interface ScreeningListResponse {
  data: ScreeningRequest[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

/** Screening report / analytics */
export interface ScreeningReport {
  summary: {
    totalScreenings: number;
    completed: number;
    inProgress: number;
    pending: number;
    failed: number;
    passRate: number;
    averageDaysToComplete: number;
  };
  byType: Array<{ type: string; count: number; passRate: number }>;
  monthlyTrend: Array<{ month: string; completed: number; submitted: number }>;
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
        candidateId: 'cand-1',
        candidateName: 'Jane Smith',
      },
      {
        id: `${tenantId}-act-2`,
        type: 'candidate_added',
        message: 'New candidate John Doe added',
        timestamp: new Date(Date.now() - 7200_000).toISOString(),
        candidateId: 'cand-2',
        candidateName: 'John Doe',
      },
      {
        id: `${tenantId}-act-3`,
        type: 'action_required',
        message: 'Document verification pending for Alex Johnson',
        timestamp: new Date(Date.now() - 10800_000).toISOString(),
        candidateId: 'cand-3',
        candidateName: 'Alex Johnson',
      },
      {
        id: `${tenantId}-act-4`,
        type: 'report_ready',
        message: 'Screening report ready for Maria Garcia',
        timestamp: new Date(Date.now() - 14400_000).toISOString(),
        candidateId: 'cand-4',
        candidateName: 'Maria Garcia',
      },
    ],
  };
}

const MOCK_CANDIDATES: CandidateListItem[] = [
  { id: 'cand-1', firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@example.com', status: 'active', screeningStatus: 'completed', submittedAt: '2025-12-01T10:00:00Z', updatedAt: '2026-01-15T14:30:00Z' },
  { id: 'cand-2', firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', status: 'active', screeningStatus: 'in_progress', submittedAt: '2026-01-05T09:00:00Z', updatedAt: '2026-02-01T11:00:00Z' },
  { id: 'cand-3', firstName: 'Alex', lastName: 'Johnson', email: 'alex.j@example.com', status: 'active', screeningStatus: 'pending', submittedAt: '2026-01-20T08:00:00Z', updatedAt: '2026-01-20T08:00:00Z' },
  { id: 'cand-4', firstName: 'Maria', lastName: 'Garcia', email: 'maria.g@example.com', status: 'active', screeningStatus: 'completed', submittedAt: '2025-11-15T12:00:00Z', updatedAt: '2026-01-10T16:00:00Z' },
  { id: 'cand-5', firstName: 'David', lastName: 'Wilson', email: 'david.w@example.com', status: 'inactive', screeningStatus: 'on_hold', submittedAt: '2026-01-12T14:00:00Z', updatedAt: '2026-01-28T09:30:00Z' },
  { id: 'cand-6', firstName: 'Sarah', lastName: 'Brown', email: 'sarah.b@example.com', status: 'active', screeningStatus: 'in_progress', submittedAt: '2026-01-18T10:00:00Z', updatedAt: '2026-02-03T13:00:00Z' },
];

function mockCandidateDetail(id: string): CandidateDetail | undefined {
  const item = MOCK_CANDIDATES.find((c) => c.id === id);
  if (!item) return undefined;

  return {
    id: item.id,
    firstName: item.firstName,
    lastName: item.lastName,
    email: item.email,
    phone: '+44 7700 900000',
    screeningStatus: item.screeningStatus,
    appliedAt: item.submittedAt,
    lastUpdatedAt: item.updatedAt,
    screeningSteps: [
      { id: 'step-1', name: 'Identity Verification', status: 'completed', completedAt: '2026-01-10T10:00:00Z' },
      { id: 'step-2', name: 'Right to Work', status: 'completed', completedAt: '2026-01-12T11:00:00Z' },
      { id: 'step-3', name: 'DBS Check', status: item.screeningStatus === 'completed' ? 'completed' : 'in_progress', completedAt: item.screeningStatus === 'completed' ? '2026-01-15T14:00:00Z' : null },
      { id: 'step-4', name: 'Reference Check', status: item.screeningStatus === 'completed' ? 'completed' : 'pending', completedAt: item.screeningStatus === 'completed' ? '2026-01-15T14:30:00Z' : null },
    ],
    progressPercentage: item.screeningStatus === 'completed' ? 100 : item.screeningStatus === 'in_progress' ? 50 : 0,
  };
}

// ── Mock screening requests ────────────────────────────────────────

const MOCK_SCREENINGS: ScreeningRequest[] = [
  { id: 'scr-1', candidateId: 'cand-1', candidateName: 'Jane Smith', type: 'background_check', status: 'completed', requestedAt: '2025-12-02T10:00:00Z', completedAt: '2025-12-20T15:00:00Z', result: 'pass' },
  { id: 'scr-2', candidateId: 'cand-1', candidateName: 'Jane Smith', type: 'identity_verification', status: 'completed', requestedAt: '2025-12-02T10:00:00Z', completedAt: '2025-12-05T09:30:00Z', result: 'pass' },
  { id: 'scr-3', candidateId: 'cand-2', candidateName: 'John Doe', type: 'right_to_work', status: 'in_progress', requestedAt: '2026-01-06T09:00:00Z', completedAt: null, result: 'pending' },
  { id: 'scr-4', candidateId: 'cand-2', candidateName: 'John Doe', type: 'dbs_check', status: 'pending', requestedAt: '2026-01-06T09:00:00Z', completedAt: null, result: null },
  { id: 'scr-5', candidateId: 'cand-3', candidateName: 'Alex Johnson', type: 'identity_verification', status: 'pending', requestedAt: '2026-01-21T08:00:00Z', completedAt: null, result: null },
  { id: 'scr-6', candidateId: 'cand-3', candidateName: 'Alex Johnson', type: 'reference_check', status: 'pending', requestedAt: '2026-01-21T08:00:00Z', completedAt: null, result: null },
  { id: 'scr-7', candidateId: 'cand-4', candidateName: 'Maria Garcia', type: 'background_check', status: 'completed', requestedAt: '2025-11-16T12:00:00Z', completedAt: '2025-12-01T10:00:00Z', result: 'pass' },
  { id: 'scr-8', candidateId: 'cand-4', candidateName: 'Maria Garcia', type: 'dbs_check', status: 'completed', requestedAt: '2025-11-16T12:00:00Z', completedAt: '2025-12-10T14:00:00Z', result: 'pass' },
  { id: 'scr-9', candidateId: 'cand-5', candidateName: 'David Wilson', type: 'right_to_work', status: 'failed', requestedAt: '2026-01-13T14:00:00Z', completedAt: '2026-01-20T11:00:00Z', result: 'fail' },
  { id: 'scr-10', candidateId: 'cand-5', candidateName: 'David Wilson', type: 'identity_verification', status: 'completed', requestedAt: '2026-01-13T14:00:00Z', completedAt: '2026-01-16T09:00:00Z', result: 'pass' },
  { id: 'scr-11', candidateId: 'cand-6', candidateName: 'Sarah Brown', type: 'background_check', status: 'in_progress', requestedAt: '2026-01-19T10:00:00Z', completedAt: null, result: 'pending' },
  { id: 'scr-12', candidateId: 'cand-6', candidateName: 'Sarah Brown', type: 'reference_check', status: 'in_progress', requestedAt: '2026-01-19T10:00:00Z', completedAt: null, result: 'pending' },
];

// In-memory org settings store keyed by tenantId (mock)
const orgSettingsStore = new Map<string, OrgSettings>();

function getOrgSettings(tenantId: string): OrgSettings {
  if (!orgSettingsStore.has(tenantId)) {
    orgSettingsStore.set(tenantId, {
      orgName: 'Acme Screening Ltd',
      contactEmail: 'admin@acme-screening.co.uk',
      logo: undefined,
      contactPhone: '+44 20 7946 0958',
      address: '123 Screening Lane, London, EC1A 1BB',
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
  _tenantId: string,
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
    data: { candidates, page, limit, total, totalPages },
  };
}

/**
 * Get single candidate detail.
 */
export function getCandidateDetail(
  _tenantId: string,
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
  if (dto.contactPhone !== undefined) current.contactPhone = dto.contactPhone;
  if (dto.address !== undefined) current.address = dto.address;
  if (dto.notificationPrefs) {
    current.notificationPrefs = { ...current.notificationPrefs, ...dto.notificationPrefs };
  }

  orgSettingsStore.set(tenantId, current);
  return { success: true, data: current };
}

/**
 * List screening requests with pagination, type and status filter.
 */
export function listScreenings(
  _tenantId: string,
  params: { page?: number; limit?: number; status?: string; type?: string; candidateId?: string }
): ServiceResult<ScreeningListResponse> {
  let filtered = [...MOCK_SCREENINGS];

  if (params.status) {
    filtered = filtered.filter((s) => s.status === params.status);
  }
  if (params.type) {
    filtered = filtered.filter((s) => s.type === params.type);
  }
  if (params.candidateId) {
    filtered = filtered.filter((s) => s.candidateId === params.candidateId);
  }

  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, Math.max(1, params.limit ?? 20));
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  const data = filtered.slice(start, start + limit);

  return {
    success: true,
    data: { data, meta: { page, limit, total, totalPages } },
  };
}

/**
 * Get screening report / analytics for a tenant.
 */
export function getReport(_tenantId: string): ServiceResult<ScreeningReport> {
  const completed = MOCK_SCREENINGS.filter((s) => s.status === 'completed');
  const passed = completed.filter((s) => s.result === 'pass');

  const typeMap = new Map<string, { count: number; passed: number }>();
  for (const s of MOCK_SCREENINGS) {
    const entry = typeMap.get(s.type) ?? { count: 0, passed: 0 };
    entry.count++;
    if (s.result === 'pass') entry.passed++;
    typeMap.set(s.type, entry);
  }

  const byType = Array.from(typeMap.entries()).map(([type, { count, passed: p }]) => ({
    type,
    count,
    passRate: count > 0 ? Math.round((p / count) * 100) : 0,
  }));

  const report: ScreeningReport = {
    summary: {
      totalScreenings: MOCK_SCREENINGS.length,
      completed: completed.length,
      inProgress: MOCK_SCREENINGS.filter((s) => s.status === 'in_progress').length,
      pending: MOCK_SCREENINGS.filter((s) => s.status === 'pending').length,
      failed: MOCK_SCREENINGS.filter((s) => s.status === 'failed').length,
      passRate: completed.length > 0 ? Math.round((passed.length / completed.length) * 100) : 0,
      averageDaysToComplete: 14,
    },
    byType,
    monthlyTrend: [
      { month: '2025-11', completed: 2, submitted: 3 },
      { month: '2025-12', completed: 3, submitted: 4 },
      { month: '2026-01', completed: 2, submitted: 5 },
    ],
  };

  return { success: true, data: report };
}

/** Export for testing — resets the in-memory org settings store. */
export function _resetOrgSettingsStore(): void {
  orgSettingsStore.clear();
}
