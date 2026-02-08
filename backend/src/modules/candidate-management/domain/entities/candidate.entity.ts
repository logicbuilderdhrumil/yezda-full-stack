/**
 * Candidate Entity
 * Core domain entity for candidate management.
 */

export type CandidateStatus = 'pending' | 'in_review' | 'certified' | 'rejected' | 'archived';

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

export interface CreateCandidateInput {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  status?: CandidateStatus;
  tenantId: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateCandidateInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  status?: CandidateStatus;
  metadata?: Record<string, unknown>;
}

export interface BulkCreateResult {
  created: number;
  failed: number;
  errors: Array<{ index: number; email: string; error: string }>;
  candidates: ManagedCandidate[];
}

export interface CandidateSubmissionInput {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  consentGiven: boolean;
  metadata?: Record<string, unknown>;
}

export interface SubmissionConfirmation {
  submissionId: string;
  message: string;
  receivedAt: Date;
}

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

export interface CandidateListResult {
  candidates: ManagedCandidate[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

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

export interface CandidateManagementResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

export type UserRole = 'admin' | 'manager' | 'agent' | 'viewer' | 'client' | 'client_admin';

export interface CandidateManagementContext {
  actorId: string;
  actorType: 'user' | 'candidate' | 'system';
  actorRoles: UserRole[];
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
  channel: 'web' | 'mobile' | 'api';
}
