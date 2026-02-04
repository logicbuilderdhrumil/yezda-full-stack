/**
 * App Application Intake Controller
 * Task 1.2-1.5: HTTP handlers for app application intake endpoints
 */

import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { appApplicationIntakeService } from '../services/app-application-intake.service.js';

/**
 * Get client info from request
 */
function getClientInfo(req: AuthenticatedRequest) {
  return {
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
    channel: (req.get('x-channel') || 'mobile') as 'web' | 'mobile' | 'api',
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

  const tenantId = req.get('x-tenant-id');
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

  const { responses } = req.body;
  if (!responses || !Array.isArray(responses)) {
    res.status(400).json({ error: 'Responses array required', code: 'INVALID_BODY' });
    return;
  }

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

  const { responses } = req.body;
  if (!responses || !Array.isArray(responses)) {
    res.status(400).json({ error: 'Responses array required', code: 'INVALID_BODY' });
    return;
  }

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
