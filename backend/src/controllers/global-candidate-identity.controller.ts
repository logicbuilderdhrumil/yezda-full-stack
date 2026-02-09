/**
 * Global Candidate Identity Controller
 * HTTP handlers for global candidate identity endpoints.
 */

import { z } from 'zod';
import type { Response } from 'express';
import { globalCandidateIdentityService } from '../services/global-candidate-identity.service.js';
import { globalCandidateRepository } from '../repositories/global-candidate.repository.js';
import type { AuthenticatedRoleRequest } from '../middleware/route-guards.middleware.js';
import { CrossTenantConsentTypeValues, type CrossTenantConsentType } from '../models/global-candidate-identity.model.js';

// ── Request validation schemas ─────────────────────────────────────────────────

const RequestConsentBodySchema = z.object({
  sourceOrgId: z.string().uuid(),
  targetOrgId: z.string().uuid(),
  consentType: z.enum(CrossTenantConsentTypeValues),
});

/**
 * Check if user is authorized to perform consent actions.
 * User must be:
 * - Admin role, OR
 * - Associated with either the sourceOrgId or targetOrgId of the consent
 */
async function isAuthorizedForConsent(
  req: AuthenticatedRoleRequest,
  consentId: string
): Promise<{ authorized: boolean; consent?: Awaited<ReturnType<typeof globalCandidateRepository.findConsentById>> }> {
  const consent = await globalCandidateRepository.findConsentById(consentId);
  if (!consent) {
    return { authorized: false, consent: undefined };
  }

  const userTenantId = req.user?.tenantId;
  const userRole = req.user?.role;

  // Admin users can perform any consent action
  if (userRole === 'admin') {
    return { authorized: true, consent };
  }

  // User must belong to either source or target org
  if (userTenantId && (userTenantId === consent.sourceOrgId || userTenantId === consent.targetOrgId)) {
    return { authorized: true, consent };
  }

  return { authorized: false, consent };
}

/**
 * Map errorCode → HTTP status.
 */
function errorStatus(code?: string): number {
  switch (code) {
    case 'FORBIDDEN':
      return 403;
    case 'NOT_FOUND':
      return 404;
    case 'INVALID_INPUT':
    case 'INVALID_STATUS':
      return 400;
    case 'CONSENT_EXISTS':
      return 409;
    default:
      return 500;
  }
}

// ── GET /api/v1/global-candidates/lookup?email= ─────────────────────────────

export async function lookupByEmail(req: AuthenticatedRoleRequest, res: Response): Promise<void> {
  const email = req.query.email as string | undefined;
  if (!email) {
    res.status(400).json({ error: 'email query parameter is required', code: 'VALIDATION_ERROR' });
    return;
  }

  const result = await globalCandidateIdentityService.lookupByEmail(email);
  if (!result.success) {
    res.status(errorStatus(result.errorCode)).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

// ── GET /api/v1/global-candidates/:id ────────────────────────────────────────

export async function getGlobalIdentity(req: AuthenticatedRoleRequest, res: Response): Promise<void> {
  const { id } = req.params;

  const result = await globalCandidateIdentityService.getGlobalIdentity(id);
  if (!result.success) {
    res.status(errorStatus(result.errorCode)).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

// ── GET /api/v1/global-candidates/:id/orgs ───────────────────────────────────

export async function getOrganizations(req: AuthenticatedRoleRequest, res: Response): Promise<void> {
  const { id } = req.params;

  const result = await globalCandidateIdentityService.getOrganizationsForCandidate(id);
  if (!result.success) {
    res.status(errorStatus(result.errorCode)).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

// ── POST /api/v1/global-candidates/:id/consent ──────────────────────────────

export async function requestConsent(req: AuthenticatedRoleRequest, res: Response): Promise<void> {
  const { id } = req.params;

  const parseResult = RequestConsentBodySchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      error: 'Invalid request body',
      code: 'VALIDATION_ERROR',
      details: parseResult.error.flatten().fieldErrors,
    });
    return;
  }

  const { sourceOrgId, targetOrgId, consentType } = parseResult.data;

  const result = await globalCandidateIdentityService.requestCrossOrgConsent(
    id,
    sourceOrgId,
    targetOrgId,
    consentType
  );

  if (!result.success) {
    res.status(errorStatus(result.errorCode)).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(201).json(result.data);
}

// ── PATCH /api/v1/global-candidates/consent/:id/grant ───────────────────────

export async function grantConsent(req: AuthenticatedRoleRequest, res: Response): Promise<void> {
  const { id } = req.params;

  // Authorization check
  const authCheck = await isAuthorizedForConsent(req, id);
  if (!authCheck.consent) {
    res.status(404).json({ error: 'Consent not found', code: 'NOT_FOUND' });
    return;
  }
  if (!authCheck.authorized) {
    res.status(403).json({ error: 'Not authorized to grant this consent', code: 'FORBIDDEN' });
    return;
  }

  const result = await globalCandidateIdentityService.grantConsent(id);
  if (!result.success) {
    res.status(errorStatus(result.errorCode)).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

// ── PATCH /api/v1/global-candidates/consent/:id/deny ────────────────────────

export async function denyConsent(req: AuthenticatedRoleRequest, res: Response): Promise<void> {
  const { id } = req.params;

  // Authorization check
  const authCheck = await isAuthorizedForConsent(req, id);
  if (!authCheck.consent) {
    res.status(404).json({ error: 'Consent not found', code: 'NOT_FOUND' });
    return;
  }
  if (!authCheck.authorized) {
    res.status(403).json({ error: 'Not authorized to deny this consent', code: 'FORBIDDEN' });
    return;
  }

  const result = await globalCandidateIdentityService.denyConsent(id);
  if (!result.success) {
    res.status(errorStatus(result.errorCode)).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

// ── PATCH /api/v1/global-candidates/consent/:id/revoke ──────────────────────

export async function revokeConsent(req: AuthenticatedRoleRequest, res: Response): Promise<void> {
  const { id } = req.params;

  // Authorization check
  const authCheck = await isAuthorizedForConsent(req, id);
  if (!authCheck.consent) {
    res.status(404).json({ error: 'Consent not found', code: 'NOT_FOUND' });
    return;
  }
  if (!authCheck.authorized) {
    res.status(403).json({ error: 'Not authorized to revoke this consent', code: 'FORBIDDEN' });
    return;
  }

  const result = await globalCandidateIdentityService.revokeConsent(id);
  if (!result.success) {
    res.status(errorStatus(result.errorCode)).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

// ── GET /api/v1/global-candidates/:id/data-reuse/:sourceOrgId ───────────────

export async function checkDataReuse(req: AuthenticatedRoleRequest, res: Response): Promise<void> {
  const { id, sourceOrgId } = req.params;
  const consentType = (req.query.consentType as CrossTenantConsentType) || 'screening_data';

  // targetOrgId comes from the authenticated user's tenant
  const targetOrgId = req.user?.tenantId;
  if (!targetOrgId) {
    res.status(400).json({ error: 'Tenant context required', code: 'MISSING_TENANT' });
    return;
  }

  const result = await globalCandidateIdentityService.checkDataReuse(
    id,
    sourceOrgId,
    targetOrgId,
    consentType
  );

  if (!result.success) {
    res.status(errorStatus(result.errorCode)).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}
