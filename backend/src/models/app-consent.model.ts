/**
 * App Consent Models
 * Task 1.1: Define consent capture and retrieval types
 */

import { z } from 'zod';

/**
 * Consent scope types representing what data the candidate agrees to share
 */
export type ConsentScope =
  | 'identity' // Name, email, phone
  | 'employment_history' // Previous jobs
  | 'education_history' // Schools and degrees
  | 'background_check' // Criminal/credit checks
  | 'drug_screening' // Drug test results
  | 'references' // Reference contact info
  | 'documents' // Uploaded documents
  | 'all'; // All data categories

/**
 * Consent status representing the current state
 */
export type ConsentStatus = 'granted' | 'withdrawn' | 'expired';

/**
 * Consent decision record stored in the database
 */
export interface ConsentDecision {
  id: string;
  tenantId: string;
  candidateId: string;
  screeningId?: string; // Optional: specific screening this applies to
  scopes: ConsentScope[];
  status: ConsentStatus;
  version: number;
  consentedAt: Date;
  expiresAt?: Date;
  withdrawnAt?: Date;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Consent status response for API
 */
export interface ConsentStatusResponse {
  candidateId: string;
  scopes: ConsentScope[];
  status: ConsentStatus;
  version: number;
  consentedAt: string;
  expiresAt?: string;
  withdrawnAt?: string;
}

/**
 * Consent capture request from the app
 */
export interface ConsentCaptureRequest {
  screeningId?: string;
  scopes: ConsentScope[];
  expiresInDays?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Consent withdrawal request from the app
 */
export interface ConsentWithdrawalRequest {
  reason?: string;
}

/**
 * Data reuse request for checking consent
 */
export interface DataReuseRequest {
  candidateId: string;
  targetScreeningId: string;
  requestedScopes: ConsentScope[];
}

/**
 * Data reuse response
 */
export interface DataReuseResponse {
  allowed: boolean;
  grantedScopes: ConsentScope[];
  deniedScopes: ConsentScope[];
  reason?: string;
}

/**
 * Consent audit event types
 */
export type ConsentAuditEventType =
  | 'CONSENT_GRANTED'
  | 'CONSENT_UPDATED'
  | 'CONSENT_WITHDRAWN'
  | 'CONSENT_EXPIRED'
  | 'CONSENT_REUSE_ALLOWED'
  | 'CONSENT_REUSE_DENIED'
  | 'CONSENT_ACCESS_DENIED';

// Validation schemas
export const consentScopeSchema = z.enum([
  'identity',
  'employment_history',
  'education_history',
  'background_check',
  'drug_screening',
  'references',
  'documents',
  'all',
]);

export const consentCaptureSchema = z.object({
  screeningId: z.string().uuid().optional(),
  scopes: z.array(consentScopeSchema).min(1, 'At least one scope is required'),
  expiresInDays: z.number().int().min(1).max(365).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const consentWithdrawalSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const dataReuseCheckSchema = z.object({
  candidateId: z.string().uuid(),
  targetScreeningId: z.string().uuid(),
  requestedScopes: z.array(consentScopeSchema).min(1),
});

/**
 * Default consent expiry in days
 */
export const DEFAULT_CONSENT_EXPIRY_DAYS = 180;

/**
 * Check if consent has expired
 */
export function isConsentExpired(consent: ConsentDecision): boolean {
  if (!consent.expiresAt) return false;
  return new Date() > new Date(consent.expiresAt);
}

/**
 * Check if consent covers the requested scopes
 */
export function hasRequiredScopes(
  grantedScopes: ConsentScope[],
  requestedScopes: ConsentScope[]
): boolean {
  // 'all' scope covers everything
  if (grantedScopes.includes('all')) return true;

  // Check if all requested scopes are covered
  return requestedScopes.every((scope) => grantedScopes.includes(scope));
}
