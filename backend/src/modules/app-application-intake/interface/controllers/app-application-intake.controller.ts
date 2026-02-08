/**
 * App Application Intake Controller (Clean Architecture)
 */

import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../../../middleware/auth.middleware.js';
import type { AppApplicationIntakeUseCases } from '../../application/use-cases/app-application-intake-use-cases.js';
import type { Channel } from '../../domain/entities/app-application-intake.entity.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VALID_CHANNELS = ['web', 'mobile', 'api'] as const;

function getClientInfo(req: AuthenticatedRequest) {
  const rawChannel = req.get('x-channel') || 'mobile';
  const channel: Channel = (VALID_CHANNELS as readonly string[]).includes(rawChannel) ? (rawChannel as Channel) : 'mobile';
  return { ipAddress: req.ip || req.socket.remoteAddress, userAgent: req.get('user-agent'), channel };
}

export class AppApplicationIntakeController {
  constructor(private readonly useCases: AppApplicationIntakeUseCases) {}

  listAssignedApplications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
    const result = await this.useCases.listAssigned(req.user.sub, tenantId, channel, ipAddress);

    if (!result.success) {
      res.status(500).json({ error: result.error, code: result.errorCode });
      return;
    }

    res.status(200).json({ applications: result.applications });
  };

  loadApplicationForm = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user || req.user.type !== 'candidate') {
      res.status(403).json({ error: 'Candidate access required', code: 'FORBIDDEN' });
      return;
    }

    const { applicationId } = req.params;
    if (!applicationId || !UUID_REGEX.test(applicationId)) {
      res.status(400).json({ error: 'Invalid application ID format', code: 'INVALID_ID' });
      return;
    }

    const { ipAddress, channel } = getClientInfo(req);
    const result = await this.useCases.loadForm(applicationId, req.user.sub, channel, ipAddress);

    if (!result.success) {
      const statusCode = result.errorCode === 'NOT_FOUND' ? 404 : 400;
      res.status(statusCode).json({ error: result.error, code: result.errorCode });
      return;
    }

    res.status(200).json(result.data);
  };

  saveDraft = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user || req.user.type !== 'candidate') {
      res.status(403).json({ error: 'Candidate access required', code: 'FORBIDDEN' });
      return;
    }

    const { applicationId } = req.params;
    if (!applicationId || !UUID_REGEX.test(applicationId)) {
      res.status(400).json({ error: 'Invalid application ID format', code: 'INVALID_ID' });
      return;
    }

    const { responses } = req.body;
    const { ipAddress, channel } = getClientInfo(req);
    const result = await this.useCases.saveDraft(applicationId, req.user.sub, responses, channel, ipAddress);

    if (!result.success) {
      const statusCode = result.errorCode === 'NOT_FOUND' ? 404 : 400;
      res.status(statusCode).json({ error: result.error, code: result.errorCode });
      return;
    }

    res.status(200).json(result.data);
  };

  submitApplication = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user || req.user.type !== 'candidate') {
      res.status(403).json({ error: 'Candidate access required', code: 'FORBIDDEN' });
      return;
    }

    const { applicationId } = req.params;
    if (!applicationId || !UUID_REGEX.test(applicationId)) {
      res.status(400).json({ error: 'Invalid application ID format', code: 'INVALID_ID' });
      return;
    }

    const { responses } = req.body;
    const { ipAddress, userAgent, channel } = getClientInfo(req);
    const result = await this.useCases.submit(applicationId, req.user.sub, responses, channel, ipAddress, userAgent);

    if (!result.success) {
      if (result.errorCode === 'VALIDATION_FAILED') {
        res.status(422).json({ error: result.error, code: result.errorCode, validationErrors: result.validationErrors });
        return;
      }
      const statusCode = result.errorCode === 'NOT_FOUND' ? 404 : 400;
      res.status(statusCode).json({ error: result.error, code: result.errorCode });
      return;
    }

    res.status(200).json(result.data);
  };
}
