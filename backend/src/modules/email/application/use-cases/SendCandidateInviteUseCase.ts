/**
 * SendCandidateInviteUseCase
 *
 * Generates an invite token and sends a candidate invite email.
 * Supports invites from both tenant org users and YEZDA admins.
 */
import { InviteToken } from '../../domain/entities/InviteToken.js';
import type { EmailPort } from '../../domain/ports/EmailPort.js';
import type { IInviteTokenRepository } from '../../domain/ports/InviteTokenRepository.port.js';
import type { InviteContext, SendInviteResult, InviteTokenMetadata } from '../../domain/types/email-types.js';

/** Rate limit: max invites per email per hour */
const MAX_INVITES_PER_HOUR = 3;

export class SendCandidateInviteUseCase {
  constructor(
    private readonly emailPort: EmailPort,
    private readonly tokenRepo: IInviteTokenRepository,
    private readonly baseInviteUrl: string,
  ) {}

  async execute(
    ctx: InviteContext,
    params: {
      email: string;
      orgName: string;
      inviterName: string;
      candidateInfo?: { firstName?: string; lastName?: string; applicationId?: string };
    },
  ): Promise<SendInviteResult> {
    try {
      const email = params.email.toLowerCase().trim();

      // ── Rate limit check ─────────────────────────────────────────────────
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentCount = await this.tokenRepo.countRecentByEmail(email, oneHourAgo);
      if (recentCount >= MAX_INVITES_PER_HOUR) {
        return {
          success: false,
          error: `Rate limit exceeded: max ${MAX_INVITES_PER_HOUR} invites per hour`,
          errorCode: 'INVITE_RATE_LIMITED',
        };
      }

      // ── Revoke prior pending invites for same email/type/tenant ────────
      await this.tokenRepo.revokeByEmail(email, 'candidate_invite', ctx.tenantId);

      // ── Create token ─────────────────────────────────────────────────────
      const metadata: InviteTokenMetadata = {
        orgName: params.orgName,
        orgId: ctx.tenantId,
        inviterName: params.inviterName,
        candidateInfo: params.candidateInfo,
      };

      const { entity, plaintextToken } = InviteToken.create({
        type: 'candidate_invite',
        email,
        tenantId: ctx.tenantId,
        invitedByUserId: ctx.actorId,
        metadata,
      });

      await this.tokenRepo.create(entity.toData());

      // ── Send email ───────────────────────────────────────────────────────
      const inviteLink = `${this.baseInviteUrl}?token=${plaintextToken}`;
      const candidateName = params.candidateInfo?.firstName
        ? `${params.candidateInfo.firstName}${params.candidateInfo.lastName ? ' ' + params.candidateInfo.lastName : ''}`
        : undefined;

      const emailResult = await this.emailPort.sendEmailWithTemplate(
        email,
        'candidate-invite',
        {
          candidateName: candidateName ?? 'Candidate',
          orgName: params.orgName,
          inviterName: params.inviterName,
          inviteLink,
          expiryDays: 14,
        },
        { tag: 'candidate-invite', metadata: { tenantId: ctx.tenantId, inviteId: entity.id } },
      );

      if (!emailResult.success) {
        return {
          success: false,
          error: `Failed to send candidate invite email: ${emailResult.error}`,
          errorCode: 'EMAIL_SEND_FAILED',
        };
      }

      return { success: true, tokenPlaintext: plaintextToken, expiresAt: entity.expiresAt };
    } catch (err) {
      return {
        success: false,
        error: `Failed to send candidate invite: ${err instanceof Error ? err.message : String(err)}`,
        errorCode: 'INVITE_SEND_ERROR',
      };
    }
  }
}
