/**
 * App Consent Controller (Clean Architecture)
 */

import type { Response } from 'express';
import type { AppConsentUseCases } from '../../application/use-cases/app-consent-use-cases.js';

interface AuthenticatedRoleRequest {
  user?: { sub: string; type: string; tenantId?: string; jti?: string };
  ip?: string;
  socket: { remoteAddress?: string };
  get(name: string): string | undefined;
  body: unknown;
  params: Record<string, string>;
}

function getClientInfo(req: AuthenticatedRoleRequest) {
  return {
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
    channel: (req.get('x-channel') || 'api') as 'web' | 'mobile' | 'api',
  };
}

function getTenantId(req: AuthenticatedRoleRequest): string {
  return req.user?.tenantId || 'default';
}

export class AppConsentController {
  constructor(private readonly useCases: AppConsentUseCases) {}

  captureConsent = async (req: AuthenticatedRoleRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
      return;
    }

    const { ipAddress, userAgent, channel } = getClientInfo(req);
    const tenantId = getTenantId(req);
    const result = await this.useCases.captureConsent(tenantId, req.user.sub, req.body, req.user.sub, req.user.type, channel, ipAddress, userAgent);

    if (!result.success) {
      const statusCode = result.errorCode === 'FORBIDDEN' ? 403 : 500;
      res.status(statusCode).json({ error: result.error, code: result.errorCode });
      return;
    }

    res.status(201).json(result.consent);
  };

  getConsentStatus = async (req: AuthenticatedRoleRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
      return;
    }

    const { ipAddress, channel } = getClientInfo(req);
    const tenantId = getTenantId(req);
    const result = await this.useCases.getConsentStatus(tenantId, req.user.sub, req.user.sub, req.user.type, channel, ipAddress);

    if (!result.success) {
      const statusCode = result.errorCode === 'FORBIDDEN' ? 403 : 500;
      res.status(statusCode).json({ error: result.error, code: result.errorCode });
      return;
    }

    if (!result.consent) {
      res.status(200).json({ consents: [] });
      return;
    }

    res.status(200).json({ consents: [result.consent] });
  };

  getCandidateConsentStatus = async (req: AuthenticatedRoleRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
      return;
    }

    const { ipAddress, channel } = getClientInfo(req);
    const tenantId = getTenantId(req);
    const candidateId = req.params.candidateId;
    const result = await this.useCases.getConsentStatus(tenantId, candidateId, req.user.sub, req.user.type, channel, ipAddress);

    if (!result.success) {
      const statusCode = result.errorCode === 'FORBIDDEN' ? 403 : 500;
      res.status(statusCode).json({ error: result.error, code: result.errorCode });
      return;
    }

    if (!result.consent) {
      res.status(200).json({ consents: [] });
      return;
    }

    res.status(200).json({ consents: [result.consent] });
  };

  withdrawConsent = async (req: AuthenticatedRoleRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
      return;
    }

    const { ipAddress, userAgent, channel } = getClientInfo(req);
    const tenantId = getTenantId(req);
    const body = req.body as { reason?: string } | undefined;
    const result = await this.useCases.withdrawConsent(tenantId, req.user.sub, body?.reason, req.user.sub, req.user.type, channel, ipAddress, userAgent);

    if (!result.success) {
      const statusCode = result.errorCode === 'FORBIDDEN' ? 403 : result.errorCode === 'NOT_FOUND' ? 404 : result.errorCode === 'ALREADY_WITHDRAWN' ? 409 : 500;
      res.status(statusCode).json({ error: result.error, code: result.errorCode });
      return;
    }

    res.status(200).json({ message: 'Consent withdrawn successfully' });
  };

  checkDataReuse = async (req: AuthenticatedRoleRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
      return;
    }

    const { ipAddress, channel } = getClientInfo(req);
    const tenantId = getTenantId(req);
    const result = await this.useCases.checkDataReuse(tenantId, req.body, req.user.sub, req.user.type, channel, ipAddress);

    if (!result.success) {
      res.status(500).json({ error: result.error, code: result.errorCode });
      return;
    }

    res.status(200).json(result.response);
  };
}
