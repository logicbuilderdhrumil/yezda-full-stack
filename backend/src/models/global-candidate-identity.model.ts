/**
 * Global Candidate Identity Models
 * Defines cross-tenant candidate identity, org assignments, and consent schemas.
 */

import { z } from 'zod';

// ── Status enums ───────────────────────────────────────────────────────────────

export const OrgAssignmentStatusValues = ['active', 'inactive', 'archived'] as const;
export type OrgAssignmentStatus = (typeof OrgAssignmentStatusValues)[number];

export const CrossTenantConsentTypeValues = ['screening_data', 'documents', 'full_profile'] as const;
export type CrossTenantConsentType = (typeof CrossTenantConsentTypeValues)[number];

export const CrossTenantConsentStatusValues = ['pending', 'granted', 'denied', 'revoked', 'expired'] as const;
export type CrossTenantConsentStatus = (typeof CrossTenantConsentStatusValues)[number];

// ── Zod Schemas ────────────────────────────────────────────────────────────────

export const GlobalCandidateSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  normalizedEmail: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  dateOfBirth: z.coerce.date().optional(),
  phoneNumber: z.string().max(20).optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const CandidateOrgAssignmentSchema = z.object({
  id: z.string().uuid(),
  globalCandidateId: z.string().uuid(),
  tenantId: z.string().uuid(),
  localCandidateId: z.string().uuid(),
  status: z.enum(OrgAssignmentStatusValues),
  addedBy: z.string().uuid(),
  addedAt: z.coerce.date(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const CrossTenantConsentSchema = z.object({
  id: z.string().uuid(),
  globalCandidateId: z.string().uuid(),
  sourceOrgId: z.string().uuid(),
  targetOrgId: z.string().uuid(),
  consentType: z.enum(CrossTenantConsentTypeValues),
  status: z.enum(CrossTenantConsentStatusValues),
  grantedAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional(),
  revokedAt: z.coerce.date().optional(),
  candidateSignature: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// ── Derived TypeScript types ───────────────────────────────────────────────────

export type GlobalCandidate = z.infer<typeof GlobalCandidateSchema>;
export type CandidateOrgAssignment = z.infer<typeof CandidateOrgAssignmentSchema>;
export type CrossTenantConsent = z.infer<typeof CrossTenantConsentSchema>;

// ── Input types ────────────────────────────────────────────────────────────────

export interface CreateGlobalCandidateInput {
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  phoneNumber?: string;
}

export interface UpdateGlobalCandidateInput {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  phoneNumber?: string;
}

export interface CreateOrgAssignmentInput {
  globalCandidateId: string;
  tenantId: string;
  localCandidateId: string;
  addedBy: string;
}

export interface CreateCrossTenantConsentInput {
  globalCandidateId: string;
  sourceOrgId: string;
  targetOrgId: string;
  consentType: CrossTenantConsentType;
}

export interface UpdateCrossTenantConsentInput {
  status?: CrossTenantConsentStatus;
  grantedAt?: Date;
  expiresAt?: Date;
  revokedAt?: Date;
  candidateSignature?: string;
}

// ── Result envelope ────────────────────────────────────────────────────────────

export interface GlobalCandidateIdentityResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

// ── Global identity with org assignments ───────────────────────────────────────

export interface GlobalCandidateWithOrgs extends GlobalCandidate {
  orgAssignments: CandidateOrgAssignment[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Normalize an email address for consistent lookups.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Determine if a cross-tenant consent is currently active (granted + not expired).
 */
export function isConsentActive(consent: CrossTenantConsent): boolean {
  if (consent.status !== 'granted') return false;
  if (consent.expiresAt && new Date() > new Date(consent.expiresAt)) return false;
  return true;
}
