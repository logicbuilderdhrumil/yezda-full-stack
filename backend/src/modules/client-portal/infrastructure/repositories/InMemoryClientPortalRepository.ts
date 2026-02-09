/**
 * In-Memory Client Portal Repository
 * Mock implementation of IClientPortalRepository.
 * Will be replaced by a real database-backed implementation.
 */
import type { IClientPortalRepository } from '../../domain/ports/IClientPortalRepository.js';
import type {
  DashboardSummary,
  CandidateListItem,
  CandidateDetail,
  OrgSettings,
  UpdateOrgSettingsDto,
  ScreeningRequest,
  ScreeningReport,
  RecentActivityItem,
  ScreeningStep,
} from '../../domain/entities/client-portal.entity.js';

// ── Mock data ──────────────────────────────────────────────────────

const MOCK_CANDIDATES: CandidateListItem[] = [
  { id: 'cand-1', firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@example.com', status: 'active', screeningStatus: 'completed', submittedAt: '2025-12-01T10:00:00Z', updatedAt: '2026-01-15T14:30:00Z' },
  { id: 'cand-2', firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', status: 'active', screeningStatus: 'in_progress', submittedAt: '2026-01-05T09:00:00Z', updatedAt: '2026-02-01T11:00:00Z' },
  { id: 'cand-3', firstName: 'Alex', lastName: 'Johnson', email: 'alex.j@example.com', status: 'active', screeningStatus: 'pending', submittedAt: '2026-01-20T08:00:00Z', updatedAt: '2026-01-20T08:00:00Z' },
  { id: 'cand-4', firstName: 'Maria', lastName: 'Garcia', email: 'maria.g@example.com', status: 'active', screeningStatus: 'completed', submittedAt: '2025-11-15T12:00:00Z', updatedAt: '2026-01-10T16:00:00Z' },
  { id: 'cand-5', firstName: 'David', lastName: 'Wilson', email: 'david.w@example.com', status: 'inactive', screeningStatus: 'on_hold', submittedAt: '2026-01-12T14:00:00Z', updatedAt: '2026-01-28T09:30:00Z' },
  { id: 'cand-6', firstName: 'Sarah', lastName: 'Brown', email: 'sarah.b@example.com', status: 'active', screeningStatus: 'in_progress', submittedAt: '2026-01-18T10:00:00Z', updatedAt: '2026-02-03T13:00:00Z' },
];

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

const orgSettingsStore = new Map<string, OrgSettings>();

export class InMemoryClientPortalRepository implements IClientPortalRepository {
  getDashboardSummary(tenantId: string): DashboardSummary {
    const activity: RecentActivityItem[] = [
      { id: `${tenantId}-act-1`, type: 'screening_completed', description: 'Background check completed for Jane Smith', timestamp: new Date(Date.now() - 3600_000).toISOString(), candidateId: 'cand-1', candidateName: 'Jane Smith' },
      { id: `${tenantId}-act-2`, type: 'candidate_added', description: 'New candidate John Doe added', timestamp: new Date(Date.now() - 7200_000).toISOString(), candidateId: 'cand-2', candidateName: 'John Doe' },
      { id: `${tenantId}-act-3`, type: 'action_required', description: 'Document verification pending for Alex Johnson', timestamp: new Date(Date.now() - 10800_000).toISOString(), candidateId: 'cand-3', candidateName: 'Alex Johnson' },
      { id: `${tenantId}-act-4`, type: 'report_ready', description: 'Screening report ready for Maria Garcia', timestamp: new Date(Date.now() - 14400_000).toISOString(), candidateId: 'cand-4', candidateName: 'Maria Garcia' },
    ];
    return { totalCandidates: 142, activeScreenings: 38, completedScreenings: 96, pendingActions: 8, recentActivity: activity };
  }

  listCandidates(
    _tenantId: string,
    params: { page?: number; limit?: number; search?: string; status?: string },
  ) {
    let filtered = [...MOCK_CANDIDATES];
    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter((c) => c.firstName.toLowerCase().includes(q) || c.lastName.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
    }
    if (params.status) {
      filtered = filtered.filter((c) => c.screeningStatus === params.status);
    }
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);
    return { data, meta: { page, limit, total, totalPages } };
  }

  getCandidateDetail(_tenantId: string, candidateId: string): CandidateDetail | null {
    const item = MOCK_CANDIDATES.find((c) => c.id === candidateId);
    if (!item) return null;
    const steps: ScreeningStep[] = [
      { id: 'step-1', name: 'Identity Verification', status: 'completed', completedAt: '2026-01-10T10:00:00Z' },
      { id: 'step-2', name: 'Right to Work', status: 'completed', completedAt: '2026-01-12T11:00:00Z' },
      { id: 'step-3', name: 'DBS Check', status: item.screeningStatus === 'completed' ? 'completed' : 'in_progress', completedAt: item.screeningStatus === 'completed' ? '2026-01-15T14:00:00Z' : null },
      { id: 'step-4', name: 'Reference Check', status: item.screeningStatus === 'completed' ? 'completed' : 'pending', completedAt: item.screeningStatus === 'completed' ? '2026-01-15T14:30:00Z' : null },
    ];
    return {
      id: item.id, firstName: item.firstName, lastName: item.lastName, email: item.email,
      phone: '+44 7700 900000', screeningStatus: item.screeningStatus,
      appliedAt: item.submittedAt, lastUpdatedAt: item.updatedAt,
      screeningSteps: steps,
      progressPercentage: item.screeningStatus === 'completed' ? 100 : item.screeningStatus === 'in_progress' ? 50 : 0,
    };
  }

  getOrgSettings(tenantId: string): OrgSettings {
    if (!orgSettingsStore.has(tenantId)) {
      orgSettingsStore.set(tenantId, {
        name: 'Acme Screening Ltd',
        contactEmail: 'admin@acme-screening.co.uk',
        contactPhone: '+44 20 7946 0958',
        address: '123 Screening Lane, London, EC1A 1BB',
        notificationPreferences: { emailOnScreeningComplete: true, emailOnCandidateSubmission: true, weeklyDigest: false },
      });
    }
    return orgSettingsStore.get(tenantId)!;
  }

  updateOrgSettings(tenantId: string, dto: UpdateOrgSettingsDto): OrgSettings {
    const current = this.getOrgSettings(tenantId);
    if (dto.name !== undefined) current.name = dto.name;
    if (dto.contactEmail !== undefined) current.contactEmail = dto.contactEmail;
    if (dto.contactPhone !== undefined) current.contactPhone = dto.contactPhone;
    if (dto.address !== undefined) current.address = dto.address;
    if (dto.notificationPreferences) {
      current.notificationPreferences = { ...current.notificationPreferences, ...dto.notificationPreferences };
    }
    orgSettingsStore.set(tenantId, current);
    return current;
  }

  listScreenings(
    _tenantId: string,
    params: { page?: number; limit?: number; status?: string; type?: string; candidateId?: string },
  ) {
    let filtered = [...MOCK_SCREENINGS];
    if (params.status) filtered = filtered.filter((s) => s.status === params.status);
    if (params.type) filtered = filtered.filter((s) => s.type === params.type);
    if (params.candidateId) filtered = filtered.filter((s) => s.candidateId === params.candidateId);
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);
    return { data, meta: { page, limit, total, totalPages } };
  }

  getReport(_tenantId: string): ScreeningReport {
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
      type, count, passRate: count > 0 ? Math.round((p / count) * 100) : 0,
    }));
    return {
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
  }
}
