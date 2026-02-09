/**
 * Client Portal Feature Module
 *
 * Encapsulates client-facing portal pages and services.
 */

// Pages
export { ClientDashboardView } from './pages/ClientDashboardView';
export { ClientCandidatesListView } from './pages/ClientCandidatesListView';
export { ClientCandidateDetailView } from './pages/ClientCandidateDetailView';
export { ClientOrgSettingsView } from './pages/ClientOrgSettingsView';
export { ClientProfileView } from './pages/ClientProfileView';

// Services
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
} from './services/ClientPortalService';
