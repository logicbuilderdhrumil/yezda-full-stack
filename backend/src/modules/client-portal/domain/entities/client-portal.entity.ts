/**
 * Client Portal Domain Entities
 * Migrated from legacy client-portal.service.ts
 */

// ── Dashboard ────────────────────────────────────────────────────

export interface RecentActivityItem {
  id: string;
  type: 'screening_completed' | 'candidate_added' | 'action_required' | 'report_ready';
  description: string;
  timestamp: string;
  candidateId?: string;
  candidateName?: string;
}

export interface DashboardSummary {
  totalCandidates: number;
  activeScreenings: number;
  completedScreenings: number;
  pendingActions: number;
  recentActivity: RecentActivityItem[];
}

// ── Candidates ───────────────────────────────────────────────────

export type CandidateScreeningStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'on_hold'
  | 'cancelled';

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

export interface PaginatedCandidateList {
  data: CandidateListItem[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface ScreeningStep {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  completedAt: string | null;
}

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

// ── Org Settings ─────────────────────────────────────────────────

export interface OrgSettings {
  name: string;
  contactEmail: string;
  logo?: string;
  contactPhone?: string;
  address?: string;
  notificationPreferences: {
    emailOnScreeningComplete: boolean;
    emailOnCandidateSubmission: boolean;
    weeklyDigest: boolean;
  };
}

export interface UpdateOrgSettingsDto {
  name?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  notificationPreferences?: Partial<OrgSettings['notificationPreferences']>;
}

// ── Screenings ───────────────────────────────────────────────────

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

export interface ScreeningListResponse {
  data: ScreeningRequest[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

// ── Reports ──────────────────────────────────────────────────────

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

// ── Shared ───────────────────────────────────────────────────────

export interface RequestContext {
  userId: string;
  userType: 'user' | 'candidate';
  tenantId: string;
  ipAddress?: string;
  channel?: 'web' | 'mobile' | 'api';
}

export type OperationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string };
