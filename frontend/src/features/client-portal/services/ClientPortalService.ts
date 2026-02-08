/**
 * Client Portal Service
 * API service for all client-facing portal endpoints.
 */

import { ApiService } from '@/services/ApiService';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/** Dashboard summary returned from the client dashboard endpoint. */
export interface ClientDashboardData {
  totalCandidates: number;
  activeScreenings: number;
  completedScreenings: number;
  pendingActions: number;
  recentActivity: ClientActivityItem[];
}

/** A single activity item for the client dashboard. */
export interface ClientActivityItem {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  candidateId?: string;
  candidateName?: string;
}

/** Parameters for listing client candidates. */
export interface ClientCandidateListParams {
  page?: number;
  limit?: number;
  search?: string | undefined;
  status?: string | undefined;
}

/** Paginated candidate list response. */
export interface ClientCandidateListResponse {
  data: ClientCandidate[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** A candidate record visible to the client portal. */
export interface ClientCandidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  screeningStatus: string;
  submittedAt: string;
  updatedAt: string;
}

/** Screening step in a candidate's pipeline. */
export interface ScreeningStep {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: 'pass' | 'fail' | 'pending';
  completedAt?: string;
}

/** Detailed candidate record with screening pipeline progress. */
export interface ClientCandidateDetail extends ClientCandidate {
  phone?: string;
  position?: string;
  department?: string;
  notes?: string;
  screeningPipeline: ScreeningStep[];
}

/** Organization settings visible to the client portal. */
export interface ClientOrgSettings {
  name: string;
  logo?: string | undefined;
  contactEmail?: string | undefined;
  contactPhone?: string | undefined;
  address?: string | undefined;
  notificationPreferences: {
    emailOnScreeningComplete: boolean;
    emailOnCandidateSubmission: boolean;
    weeklyDigest: boolean;
  };
}

/** Payload for updating org settings (client_admin only). */
export type UpdateOrgSettingsPayload = Partial<ClientOrgSettings>;

/** A screening request record visible to the client portal. */
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

/** Paginated screening list response. */
export interface ScreeningListResponse {
  data: ScreeningRequest[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

/** Parameters for listing screenings. */
export interface ScreeningListParams {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
}

/** Screening report aggregate data. */
export interface ScreeningReportData {
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

// -----------------------------------------------------------------------------
// Service
// -----------------------------------------------------------------------------

/**
 * ClientPortalService provides methods for all client portal API calls.
 */
export const ClientPortalService = {
  /**
   * Fetches the client dashboard summary metrics.
   * @returns Dashboard data with counts and recent activity
   */
  async getDashboard(): Promise<ClientDashboardData> {
    const response = await ApiService.get<ClientDashboardData>('client.dashboard');
    return response.data;
  },

  /**
   * Fetches a paginated list of candidates for the client org.
   * @param params - Optional filter and pagination parameters
   * @returns Paginated candidate list
   */
  async getCandidates(params?: ClientCandidateListParams): Promise<ClientCandidateListResponse> {
    const queryParams: Record<string, string> = {};
    if (params?.page !== undefined) queryParams.page = String(params.page);
    if (params?.limit !== undefined) queryParams.limit = String(params.limit);
    if (params?.search) queryParams.search = params.search;
    if (params?.status) queryParams.status = params.status;

    const response = await ApiService.get<ClientCandidateListResponse>(
      'client.candidates.list',
      { params: queryParams }
    );
    return response.data;
  },

  /**
   * Fetches detailed info for a single candidate.
   * @param id - Candidate ID
   * @returns Candidate detail with screening pipeline
   */
  async getCandidateDetail(id: string): Promise<ClientCandidateDetail> {
    const response = await ApiService.get<ClientCandidateDetail>(
      'client.candidates.get',
      { pathParams: { id } }
    );
    return response.data;
  },

  /**
   * Fetches organization settings for the client portal.
   * @returns Organization settings
   */
  async getOrgSettings(): Promise<ClientOrgSettings> {
    const response = await ApiService.get<ClientOrgSettings>('client.org.settings');
    return response.data;
  },

  /**
   * Updates organization settings (client_admin only).
   * @param data - Partial settings to update
   * @returns Updated organization settings
   */
  async updateOrgSettings(data: UpdateOrgSettingsPayload): Promise<ClientOrgSettings> {
    const response = await ApiService.put<ClientOrgSettings, UpdateOrgSettingsPayload>(
      'client.org.updateSettings',
      data
    );
    return response.data;
  },

  /**
   * Fetches a paginated list of screenings for the client org.
   * @param params - Optional filter and pagination parameters
   * @returns Paginated screening list
   */
  async getScreenings(params?: ScreeningListParams): Promise<ScreeningListResponse> {
    const queryParams: Record<string, string> = {};
    if (params?.page !== undefined) queryParams.page = String(params.page);
    if (params?.limit !== undefined) queryParams.limit = String(params.limit);
    if (params?.status) queryParams.status = params.status;
    if (params?.type) queryParams.type = params.type;

    const response = await ApiService.get<ScreeningListResponse>(
      'client.screenings.list',
      { params: queryParams }
    );
    return response.data;
  },

  /**
   * Fetches screening report / analytics data for the client org.
   * @returns Report data with summary, by-type breakdown, and monthly trend
   */
  async getReport(): Promise<ScreeningReportData> {
    const response = await ApiService.get<ScreeningReportData>('client.reports');
    return response.data;
  },
};
