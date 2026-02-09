/**
 * App Application Intake Controller
 * Task 1.2-1.5: HTTP handlers for app application intake endpoints
 */

import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { appApplicationIntakeService } from '../services/app-application-intake.service.js';

// UUID v4 validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Valid channels
const VALID_CHANNELS = ['web', 'mobile', 'api'] as const;
type Channel = typeof VALID_CHANNELS[number];

/**
 * Validate UUID format
 */
function isValidUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

/**
 * Get client info from request with validated channel
 */
function getClientInfo(req: AuthenticatedRequest) {
  const rawChannel = req.get('x-channel') || 'mobile';
  // Validate channel to prevent spoofing
  const channel: Channel = VALID_CHANNELS.includes(rawChannel as Channel)
    ? (rawChannel as Channel)
    : 'mobile';

  return {
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
    channel,
  };
}

/**
 * GET /api/v1/app/applications
 * List assigned applications for the authenticated candidate
 */
export async function listAssignedApplications(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  if (!req.user || req.user.type !== 'candidate') {
    res.status(403).json({ error: 'Candidate access required', code: 'FORBIDDEN' });
    return;
  }

  const tenantId = req.user?.tenantId || req.get('x-tenant-id');
  if (!tenantId) {
    res.status(400).json({ error: 'Tenant ID required', code: 'TENANT_REQUIRED' });
    return;
  }

  const { ipAddress, channel } = getClientInfo(req);

  const result = await appApplicationIntakeService.listAssignedApplications(
    req.user.sub,
    tenantId,
    channel,
    ipAddress
  );

  if (!result.success) {
    res.status(500).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json({ applications: result.applications });
}

/**
 * GET /api/v1/app/applications/:applicationId
 * Load application form with saved responses
 */
export async function loadApplicationForm(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  if (!req.user || req.user.type !== 'candidate') {
    res.status(403).json({ error: 'Candidate access required', code: 'FORBIDDEN' });
    return;
  }

  const { applicationId } = req.params;
  if (!applicationId) {
    res.status(400).json({ error: 'Application ID required', code: 'MISSING_ID' });
    return;
  }

  if (!isValidUuid(applicationId)) {
    res.status(400).json({ error: 'Invalid application ID format', code: 'INVALID_ID' });
    return;
  }

  const { ipAddress, channel } = getClientInfo(req);

  const result = await appApplicationIntakeService.loadApplicationForm(
    applicationId,
    req.user.sub,
    channel,
    ipAddress
  );

  if (!result.success) {
    const statusCode = result.errorCode === 'NOT_FOUND' ? 404 : 400;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

/**
 * POST /api/v1/app/applications/:applicationId/draft
 * Save draft responses for an application
 */
export async function saveDraft(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  if (!req.user || req.user.type !== 'candidate') {
    res.status(403).json({ error: 'Candidate access required', code: 'FORBIDDEN' });
    return;
  }

  const { applicationId } = req.params;
  if (!applicationId) {
    res.status(400).json({ error: 'Application ID required', code: 'MISSING_ID' });
    return;
  }

  if (!isValidUuid(applicationId)) {
    res.status(400).json({ error: 'Invalid application ID format', code: 'INVALID_ID' });
    return;
  }

  // Body already validated by validateBody middleware
  const { responses } = req.body;

  const { ipAddress, channel } = getClientInfo(req);

  const result = await appApplicationIntakeService.saveDraft(
    applicationId,
    req.user.sub,
    responses,
    channel,
    ipAddress
  );

  if (!result.success) {
    const statusCode = result.errorCode === 'NOT_FOUND' ? 404 : 400;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

/**
 * POST /api/v1/app/applications/:applicationId/submit
 * Submit final application
 */
export async function submitApplication(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  if (!req.user || req.user.type !== 'candidate') {
    res.status(403).json({ error: 'Candidate access required', code: 'FORBIDDEN' });
    return;
  }

  const { applicationId } = req.params;
  if (!applicationId) {
    res.status(400).json({ error: 'Application ID required', code: 'MISSING_ID' });
    return;
  }

  if (!isValidUuid(applicationId)) {
    res.status(400).json({ error: 'Invalid application ID format', code: 'INVALID_ID' });
    return;
  }

  // Body already validated by validateBody middleware
  const { responses } = req.body;

  const { ipAddress, userAgent, channel } = getClientInfo(req);

  const result = await appApplicationIntakeService.submitApplication(
    applicationId,
    req.user.sub,
    responses,
    channel,
    ipAddress,
    userAgent
  );

  if (!result.success) {
    if (result.errorCode === 'VALIDATION_FAILED') {
      res.status(422).json({
        error: result.error,
        code: result.errorCode,
        validationErrors: result.validationErrors,
      });
      return;
    }

    const statusCode = result.errorCode === 'NOT_FOUND' ? 404 : 400;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}
