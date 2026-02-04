/**
 * Candidate management types for the frontend.
 */

/** Candidate status values. */
export type CandidateStatus = 'pending' | 'active' | 'certified' | 'archived';

/** Candidate record for management views. */
export interface Candidate {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  status: CandidateStatus;
  organizationId: string;
  organizationName?: string;
  submittedAt?: string;
  certifiedAt?: string;
  archivedAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/** Payload for creating a candidate. */
export interface CreateCandidatePayload {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  organizationId?: string;
  metadata?: Record<string, unknown>;
}

/** Payload for updating a candidate. */
export interface UpdateCandidatePayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  status?: CandidateStatus;
  metadata?: Record<string, unknown>;
}

/** Filter parameters for listing candidates. */
export interface CandidateListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: CandidateStatus;
  organizationId?: string;
  sortBy?: 'email' | 'firstName' | 'lastName' | 'createdAt' | 'updatedAt' | 'certifiedAt';
  sortOrder?: 'asc' | 'desc';
}

/** Paginated list response for candidates. */
export interface CandidateListResponse {
  data: Candidate[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

/** Bulk create payload for multiple candidates. */
export interface BulkCreateCandidatesPayload {
  candidates: CreateCandidatePayload[];
  organizationId?: string;
}

/** Result of a single candidate creation in bulk import. */
export interface BulkCreateResultItem {
  index: number;
  success: boolean;
  candidateId?: string;
  error?: string;
}

/** Bulk create response. */
export interface BulkCreateCandidatesResponse {
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  results: BulkCreateResultItem[];
}

/** Table column definition for candidates. */
export interface CandidateColumn {
  key: keyof Candidate | 'name' | 'actions';
  label: string;
  sortable?: boolean;
  width?: string;
}

/** Default columns for the candidates list. */
export const CANDIDATE_COLUMNS: CandidateColumn[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'organizationName', label: 'Organization', sortable: false },
  { key: 'createdAt', label: 'Created', sortable: true },
  { key: 'actions', label: '', sortable: false, width: '100px' },
];
