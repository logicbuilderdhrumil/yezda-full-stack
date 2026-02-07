/**
 * Global Candidate Identity Controller
 * HTTP handlers for global candidate identity endpoints.
 */

import type { Response } from 'express';
import { globalCandidateIdentityService } from '../services/global-candidate-identity.service.js';
import type { AuthenticatedRoleRequest } from '../middleware/route-guards.middleware.js';
import type { CrossTenantConsentType } from '../models/global-candidate-identity.model.js';

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
  const { sourceOrgId, targetOrgId, consentType } = req.body as {
    sourceOrgId: string;
    targetOrgId: string;
    consentType: CrossTenantConsentType;
  };

  if (!sourceOrgId || !targetOrgId || !consentType) {
    res.status(400).json({
      error: 'sourceOrgId, targetOrgId, and consentType are required',
      code: 'VALIDATION_ERROR',
    });
    return;
  }

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
