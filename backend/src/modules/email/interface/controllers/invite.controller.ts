/**
 * Invite Controller — HTTP handlers for invite endpoints
 */
import type { Request, Response } from 'express';
import type { SendOrgMemberInviteUseCase } from '../../application/use-cases/SendOrgMemberInviteUseCase.js';
import type { SendCandidateInviteUseCase } from '../../application/use-cases/SendCandidateInviteUseCase.js';
import type { VerifyInviteTokenUseCase } from '../../application/use-cases/VerifyInviteTokenUseCase.js';
import type { AcceptInviteUseCase } from '../../application/use-cases/AcceptInviteUseCase.js';
import type { InviteContext } from '../../domain/types/email-types.js';
import { auditService } from '../../../../services/audit.service.js';

interface AuthenticatedRequest extends Request {
  user?: { sub: string; type: 'user' | 'candidate'; tenantId?: string; roles?: string[] };
}

function buildInviteContext(req: AuthenticatedRequest): InviteContext {
  // Prefer explicit x-tenant-id header (set by frontend for org-scoped invites) over user's default tenant
  const tenantId = req.get('x-tenant-id') ?? req.user?.tenantId;
  if (!tenantId) {
    throw new Error('MISSING_TENANT');
  }
  return {
    actorId: req.user!.sub,
    actorType: req.user!.type === 'candidate' ? 'user' : req.user!.type as 'user' | 'admin',
    tenantId,
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
  };
}

export class InviteController {
  constructor(
    private readonly sendOrgMemberInviteUC: SendOrgMemberInviteUseCase,
    private readonly sendCandidateInviteUC: SendCandidateInviteUseCase,
    private readonly verifyInviteTokenUC: VerifyInviteTokenUseCase,
    private readonly acceptInviteUC: AcceptInviteUseCase,
  ) {}

  sendOrgMemberInvite = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
      return;
    }

    let ctx: InviteContext;
    try {
      ctx = buildInviteContext(req);
    } catch {
      res.status(400).json({ error: 'Tenant ID is required', code: 'MISSING_TENANT' });
      return;
    }

    const result = await this.sendOrgMemberInviteUC.execute(ctx, {
      email: req.body.email,
      role: req.body.role,
      orgName: req.body.orgName,
      inviterName: req.body.inviterName,
    });

    if (!result.success) {
      auditService.log({
        eventType: 'INVITE_SEND_FAILED',
        actorId: ctx.actorId,
        actorType: 'user',
        targetType: 'invite',
        channel: 'api',
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: { inviteType: 'org_member_invite', email: req.body.email, errorCode: result.errorCode },
        success: false,
        errorMessage: result.error,
      });
      const status = result.errorCode === 'INVITE_RATE_LIMITED' ? 429 : 500;
      res.status(status).json({ error: result.error, code: result.errorCode });
      return;
    }

    auditService.log({
      eventType: 'INVITE_SENT',
      actorId: ctx.actorId,
      actorType: 'user',
      targetType: 'invite',
      channel: 'api',
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { inviteType: 'org_member_invite', email: req.body.email, role: req.body.role, orgName: req.body.orgName },
      success: true,
    });

    res.status(201).json({ success: true, expiresAt: result.expiresAt });
  };

  sendCandidateInvite = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
      return;
    }

    let ctx: InviteContext;
    try {
      ctx = buildInviteContext(req);
    } catch {
      res.status(400).json({ error: 'Tenant ID is required', code: 'MISSING_TENANT' });
      return;
    }

    const result = await this.sendCandidateInviteUC.execute(ctx, {
      email: req.body.email,
      orgName: req.body.orgName,
      inviterName: req.body.inviterName,
      candidateInfo: req.body.candidateInfo,
    });

    if (!result.success) {
      auditService.log({
        eventType: 'INVITE_SEND_FAILED',
        actorId: ctx.actorId,
        actorType: 'user',
        targetType: 'invite',
        channel: 'api',
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: { inviteType: 'candidate_invite', email: req.body.email, errorCode: result.errorCode },
        success: false,
        errorMessage: result.error,
      });
      const status = result.errorCode === 'INVITE_RATE_LIMITED' ? 429 : 500;
      res.status(status).json({ error: result.error, code: result.errorCode });
      return;
    }

    auditService.log({
      eventType: 'INVITE_SENT',
      actorId: ctx.actorId,
      actorType: 'user',
      targetType: 'invite',
      channel: 'api',
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { inviteType: 'candidate_invite', email: req.body.email, orgName: req.body.orgName },
      success: true,
    });

    res.status(201).json({ success: true, expiresAt: result.expiresAt });
  };

  verifyInviteToken = async (req: Request, res: Response): Promise<void> => {
    const result = await this.verifyInviteTokenUC.execute(req.params.token);

    if (!result.valid) {
      res.status(400).json({ valid: false, reason: result.reason });
      return;
    }

    res.status(200).json({
      valid: true,
      invite: {
        type: result.invite.type,
        email: result.invite.email,
        orgName: result.invite.metadata.orgName,
        expiresAt: result.invite.expiresAt,
      },
    });
  };

  acceptInvite = async (req: Request, res: Response): Promise<void> => {
    const result = await this.acceptInviteUC.execute(req.params.token);

    if (!result.success) {
      auditService.log({
        eventType: 'INVITE_ACCEPT_FAILED',
        targetType: 'invite',
        channel: 'api',
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent'),
        metadata: { errorCode: result.errorCode },
        success: false,
        errorMessage: result.error,
      });
      const statusMap: Record<string, number> = {
        INVALID_TOKEN: 400,
        TOKEN_CONSUMED: 409,
        TOKEN_EXPIRED: 410,
        TOKEN_INVALID: 400,
      };
      const status = statusMap[result.errorCode] ?? 500;
      res.status(status).json({ error: result.error, code: result.errorCode });
      return;
    }

    auditService.log({
      eventType: 'INVITE_ACCEPTED',
      targetType: 'invite',
      channel: 'api',
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
      metadata: { inviteType: result.invite.type, tenantId: result.invite.tenantId },
      success: true,
    });

    res.status(200).json({
      success: true,
      invite: result.invite,
    });
  };
}
