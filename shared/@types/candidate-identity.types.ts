/**
 * Shared types for cross-tenant candidate identity and consent.
 * Used by both backend and frontend.
 */

// ── Status types ───────────────────────────────────────────────────────────────

/** Status of a candidate's org assignment */
export type OrgAssignmentStatus = 'active' | 'inactive' | 'archived';

/** Type of cross-tenant consent */
export type CrossTenantConsentType = 'screening_data' | 'documents' | 'full_profile';

/** Status of cross-tenant consent */
export type CrossTenantConsentStatus = 'pending' | 'granted' | 'denied' | 'revoked' | 'expired';

// ── Entity types ───────────────────────────────────────────────────────────────

/**
 * Global candidate identity that persists across organizations.
 * A single person can have multiple local candidate records in different orgs,
 * all linked to the same GlobalCandidate.
 */
export interface GlobalCandidate {
  id: string;
  email: string;
  normalizedEmail: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date | string;
  phoneNumber?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Links a GlobalCandidate to a local candidate in a specific organization.
 */
export interface CandidateOrgAssignment {
  id: string;
  globalCandidateId: string;
  tenantId: string;
  localCandidateId: string;
  status: OrgAssignmentStatus;
  addedBy: string;
  addedAt: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Cross-tenant consent for sharing candidate data between organizations.
 */
export interface CrossTenantConsent {
  id: string;
  globalCandidateId: string;
  sourceOrgId: string;
  targetOrgId: string;
  consentType: CrossTenantConsentType;
  status: CrossTenantConsentStatus;
  grantedAt?: Date | string;
  expiresAt?: Date | string;
  revokedAt?: Date | string;
  candidateSignature?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ── Global candidate with org assignments ──────────────────────────────────────

/**
 * Global candidate with all linked org assignments.
 */
export interface GlobalCandidateWithOrgs extends GlobalCandidate {
  orgAssignments: CandidateOrgAssignment[];
}

// ── API request/response types ─────────────────────────────────────────────────

/** Request to lookup a candidate by email */
export interface LookupByEmailRequest {
  email: string;
}

/** Request to get organizations for a candidate */
export interface GetOrganizationsRequest {
  globalCandidateId: string;
}

/** Request to create cross-org consent */
export interface CreateCrossOrgConsentRequest {
  globalCandidateId: string;
  sourceOrgId: string;
  targetOrgId: string;
  consentType: CrossTenantConsentType;
}

/** Request to update consent status */
export interface UpdateConsentStatusRequest {
  action: 'grant' | 'deny' | 'revoke';
}

/** Request to check data reuse */
export interface CheckDataReuseRequest {
  globalCandidateId: string;
  sourceOrgId: string;
  targetOrgId: string;
  consentType: CrossTenantConsentType;
}

/** Response for data reuse check */
export interface CheckDataReuseResponse {
  allowed: boolean;
  consent?: CrossTenantConsent;
}

// ── Result envelope ────────────────────────────────────────────────────────────

/** Generic result envelope for API responses */
export interface GlobalCandidateIdentityResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

// ── Error codes ────────────────────────────────────────────────────────────────

export const GlobalCandidateErrorCodes = {
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  CONSENT_EXISTS: 'CONSENT_EXISTS',
  INVALID_STATUS: 'INVALID_STATUS',
  UNAUTHORIZED: 'UNAUTHORIZED',
} as const;

export type GlobalCandidateErrorCode =
  (typeof GlobalCandidateErrorCodes)[keyof typeof GlobalCandidateErrorCodes];
