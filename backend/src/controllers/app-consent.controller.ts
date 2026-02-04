/**
 * App Consent Controller
 * Task 1.1: Endpoint handlers for consent capture, retrieval, and enforcement
 */

import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { appConsentService } from '../services/app-consent.service.js';
import type {
  ConsentCaptureRequest,
  ConsentWithdrawalRequest,
  DataReuseRequest,
} from '../models/app-consent.model.js';

/**
 * Get client info from request
 */
function getClientInfo(req: AuthenticatedRequest) {
  return {
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
    channel: (req.get('x-channel') || 'api') as 'web' | 'mobile' | 'api',
  };
}

/**
 * Extract tenant ID from request
 */
function getTenantId(req: AuthenticatedRequest): string {
  return req.get('x-tenant-id') || 'default';
}

/**
 * POST /api/v1/consent
 * Capture consent decision from the app
 */
export async function captureConsent(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const { ipAddress, userAgent, channel } = getClientInfo(req);
  const tenantId = getTenantId(req);
  const candidateId = req.user.sub;
  const body = req.body as ConsentCaptureRequest;

  const result = await appConsentService.captureConsent(
    tenantId,
    candidateId,
    body,
    req.user.sub,
    req.user.type,
    channel,
    ipAddress,
    userAgent
  );

  if (!result.success) {
    const statusCode = result.errorCode === 'FORBIDDEN' ? 403 : 500;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(201).json(result.consent);
}

/**
 * GET /api/v1/consent
 * Get current consent status for the authenticated candidate
 */
export async function getConsentStatus(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const { ipAddress, channel } = getClientInfo(req);
  const tenantId = getTenantId(req);
  const candidateId = req.user.sub;

  const result = await appConsentService.getConsentStatus(
    tenantId,
    candidateId,
    req.user.sub,
    req.user.type,
    channel,
    ipAddress
  );

  if (!result.success) {
    const statusCode = result.errorCode === 'FORBIDDEN' ? 403 : 500;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  if (!result.consent) {
    res.status(200).json({ status: 'none', message: 'No consent record found' });
    return;
  }

  res.status(200).json(result.consent);
}

/**
 * GET /api/v1/consent/:candidateId
 * Get consent status for a specific candidate (admin/user access)
 */
export async function getCandidateConsentStatus(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const { ipAddress, channel } = getClientInfo(req);
  const tenantId = getTenantId(req);
  const candidateId = req.params.candidateId;

  const result = await appConsentService.getConsentStatus(
    tenantId,
    candidateId,
    req.user.sub,
    req.user.type,
    channel,
    ipAddress
  );

  if (!result.success) {
    const statusCode = result.errorCode === 'FORBIDDEN' ? 403 : 500;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  if (!result.consent) {
    res.status(200).json({ status: 'none', message: 'No consent record found' });
    return;
  }

  res.status(200).json(result.consent);
}

/**
 * DELETE /api/v1/consent
 * Withdraw consent (candidate only)
 */
export async function withdrawConsent(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const { ipAddress, userAgent, channel } = getClientInfo(req);
  const tenantId = getTenantId(req);
  const candidateId = req.user.sub;
  const body = req.body as ConsentWithdrawalRequest | undefined;

  const result = await appConsentService.withdrawConsent(
    tenantId,
    candidateId,
    body?.reason,
    req.user.sub,
    req.user.type,
    channel,
    ipAddress,
    userAgent
  );

  if (!result.success) {
    const statusCode =
      result.errorCode === 'FORBIDDEN'
        ? 403
        : result.errorCode === 'NOT_FOUND'
        ? 404
        : result.errorCode === 'ALREADY_WITHDRAWN'
        ? 409
        : 500;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json({ message: 'Consent withdrawn successfully' });
}

/**
 * POST /api/v1/consent/check-reuse
 * Check if data reuse is allowed based on consent
 */
export async function checkDataReuse(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const { ipAddress, channel } = getClientInfo(req);
  const tenantId = getTenantId(req);
  const body = req.body as DataReuseRequest;

  const result = await appConsentService.checkDataReuse(
    tenantId,
    body,
    req.user.sub,
    req.user.type,
    channel,
    ipAddress
  );

  if (!result.success) {
    res.status(500).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.response);
}
