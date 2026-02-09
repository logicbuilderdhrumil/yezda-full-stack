/**
 * Services Index
 *
 * @deprecated Import feature-specific services from '@/features/<name>' instead.
 * Infrastructure services (ApiService, SocketService, axios) remain here.
 */

// ─── Feature services (re-exported for backward compatibility) ──────────────
export { AccountService } from '@/features/account';
export { AuthService } from '@/features/auth';
export { CandidatesService } from '@/features/candidates';
export { DashboardService } from '@/features/dashboard';
export { FormsService } from '@/features/forms';
export { OrganizationsService } from '@/features/organizations';
export { UsersService } from '@/features/users';
export { NotificationsService } from '@/features/notifications';
export { FileService } from '@/features/files';
export { FormService, type CreateFormRequest, type UpdateFormRequest } from '@/features/forms';
export { BillingService, type LedgerFilterOptions } from '@/features/billing';
export { ChartService } from '@/features/reports';
export { LedgerService } from '@/features/billing';
export { ChatService, type MessageListOptions } from '@/features/chat';
export { PipelineService } from '@/features/pipelines';
export { ReviewService, type ReviewTask, type ReviewDecisionDto } from '@/features/reviews';
export {
  ClientPortalService,
  type ClientDashboardData,
  type ClientActivityItem,
  type ClientCandidateListParams,
  type ClientCandidateListResponse,
  type ClientCandidate,
  type ClientCandidateDetail,
  type ScreeningStep,
  type ClientOrgSettings,
  type UpdateOrgSettingsPayload,
} from '@/features/client-portal';

// ─── Infrastructure services (remain in services/) ─────────────────────────
export {
  ApiService,
  initializeApiService,
  createAbortController,
  createCancelToken,
  isRequestCancelled,
  type RequestOptions,
  type ApiResponse,
  type TokenGetter,
  type TokenRefresher,
} from './ApiService';
export {
  apiClient,
  createAxiosInstance,
  setupInterceptors,
  setupRequestInterceptors,
  setupResponseInterceptors,
  type InterceptorConfig,
} from './axios';
export { SocketService } from './SocketService';

// ─── Cross-cutting services (shared across features) ───────────────────────
export { OAuthService } from './OAuthService';
export { JobService, type PollOptions } from './JobService';
export { ExportService, type ExportOptions } from './ExportService';
export { AssetService, type AssetUploadOptions, type AssetListOptions } from './AssetService';
