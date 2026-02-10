/**
 * Client Portal Domain Port — Data Repository Interface
 * Currently backed by in-memory mock data; will be replaced by DB.
 */
import type {
  DashboardSummary,
  CandidateListItem,
  CandidateDetail,
  OrgSettings,
  UpdateOrgSettingsDto,
  ScreeningRequest,
  ScreeningReport,
} from '../entities/client-portal.entity.js';

export interface IClientPortalRepository {
  getDashboardSummary(tenantId: string): DashboardSummary;
  listCandidates(
    tenantId: string,
    params: { page?: number; limit?: number; search?: string; status?: string },
  ): { candidates: CandidateListItem[]; page: number; limit: number; total: number; totalPages: number };
  getCandidateDetail(tenantId: string, candidateId: string): CandidateDetail | null;
  getOrgSettings(tenantId: string): OrgSettings;
  updateOrgSettings(tenantId: string, dto: UpdateOrgSettingsDto): OrgSettings;
  listScreenings(
    tenantId: string,
    params: { page?: number; limit?: number; status?: string; type?: string; candidateId?: string },
  ): { data: ScreeningRequest[]; meta: { page: number; limit: number; total: number; totalPages: number } };
  getReport(tenantId: string): ScreeningReport;
}
