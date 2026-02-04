/**
 * Candidate Management Models
 * Task 1.1: Define candidate data model and validation rules
 */

import type { UserRole } from '../middleware/route-guards.middleware.js';

/**
 * Candidate status for lifecycle management
 */
export type CandidateStatus = 'pending' | 'in_review' | 'certified' | 'rejected' | 'archived';

/**
 * Managed candidate entity for management operations
 * Named ManagedCandidate to distinguish from auth.model.Candidate
 */
export interface ManagedCandidate {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  status: CandidateStatus;
  tenantId: string;
  applicationDate: Date;
  certifiedAt?: Date;
  certifiedBy?: string;
  archivedAt?: Date;
  archivedBy?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

/**
 * Input for creating a candidate
 */
export interface CreateCandidateInput {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  status?: CandidateStatus;
  tenantId: string;
  metadata?: Record<string, unknown>;
}

/**
 * Input for updating a candidate
 */
export interface UpdateCandidateInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  status?: CandidateStatus;
  metadata?: Record<string, unknown>;
}

/**
 * Input for bulk creating candidates
 */
export interface BulkCreateCandidateInput {
  candidates: Omit<CreateCandidateInput, 'tenantId'>[];
}

/**
 * Bulk create result
 */
export interface BulkCreateResult {
  created: number;
  failed: number;
  errors: Array<{ index: number; email: string; error: string }>;
  candidates: ManagedCandidate[];
}

/**
 * Public submission form input
 */
export interface CandidateSubmissionInput {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  consentGiven: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Submission confirmation response
 */
export interface SubmissionConfirmation {
  submissionId: string;
  message: string;
  receivedAt: Date;
}

/**
 * Candidate search/filter parameters
 */
export interface CandidateSearchParams {
  tenantId: string;
  query?: string;
  status?: CandidateStatus;
  certified?: boolean;
  archived?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'email' | 'firstName' | 'lastName' | 'applicationDate' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated candidate list result
 */
export interface CandidateListResult {
  candidates: ManagedCandidate[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Candidate management audit event types
 */
export type CandidateManagementAuditEventType =
  | 'CANDIDATE_CREATED'
  | 'CANDIDATE_UPDATED'
  | 'CANDIDATE_STATUS_CHANGED'
  | 'CANDIDATE_CERTIFIED'
  | 'CANDIDATE_ARCHIVED'
  | 'CANDIDATE_BULK_CREATED'
  | 'CANDIDATE_SUBMISSION_RECEIVED'
  | 'CANDIDATE_LIST_ACCESSED'
  | 'CANDIDATE_DETAILS_ACCESSED'
  | 'CANDIDATE_ACCESS_DENIED';

/**
 * Candidate management operation result
 */
export interface CandidateManagementResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

/**
 * Candidate management context
 */
export interface CandidateManagementContext {
  actorId: string;
  actorType: 'user' | 'candidate' | 'system';
  actorRoles: UserRole[];
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
  channel: 'web' | 'mobile' | 'api';
}
