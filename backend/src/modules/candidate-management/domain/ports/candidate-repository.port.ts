/**
 * Candidate Repository Port
 * Domain interface for candidate persistence operations.
 */

import type {
  ManagedCandidate,
  CreateCandidateInput,
  UpdateCandidateInput,
  CandidateSearchParams,
  CandidateListResult,
  CandidateStatus,
} from '../entities/candidate.entity.js';

export interface ICandidateRepository {
  create(input: CreateCandidateInput & { id: string; createdBy?: string }): Promise<ManagedCandidate>;
  bulkCreate(candidates: Array<CreateCandidateInput & { id: string; createdBy?: string }>): Promise<ManagedCandidate[]>;
  findById(id: string, tenantId: string): Promise<ManagedCandidate | undefined>;
  findByEmail(email: string, tenantId: string): Promise<ManagedCandidate | undefined>;
  emailExists(email: string, tenantId: string): Promise<boolean>;
  update(id: string, tenantId: string, input: UpdateCandidateInput & { updatedBy?: string }): Promise<ManagedCandidate | undefined>;
  updateStatus(id: string, tenantId: string, status: CandidateStatus, updatedBy?: string): Promise<ManagedCandidate | undefined>;
  search(params: CandidateSearchParams): Promise<CandidateListResult>;
  delete(id: string, tenantId: string): Promise<boolean>;
  tenantExists(tenantId: string): Promise<boolean>;
}
