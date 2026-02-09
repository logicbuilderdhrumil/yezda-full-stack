/**
 * SendOrgMemberInviteUseCase
 *
 * Generates an invite token, revokes prior pending invites for the same
 * email/tenant, and sends an org-member invite email via the EmailPort.
 */
import { createHash } from 'node:crypto';
import { InviteToken } from '../../domain/entities/InviteToken.js';
import type { EmailPort } from '../../domain/ports/EmailPort.js';
import type { IInviteTokenRepository } from '../../domain/ports/InviteTokenRepository.port.js';
import type { InviteContext, SendInviteResult, InviteTokenMetadata } from '../../domain/types/email-types.js';

/** Rate limit: max invites per email per hour */
const MAX_INVITES_PER_HOUR = 3;

export class SendOrgMemberInviteUseCase {
  constructor(
    private readonly emailPort: EmailPort,
    private readonly tokenRepo: IInviteTokenRepository,
    private readonly baseInviteUrl: string,
  ) {}

  async execute(
    ctx: InviteContext,
    params: { email: string; role: string; orgName: string; inviterName: string },
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
      await this.tokenRepo.revokeByEmail(email, 'org_member_invite', ctx.tenantId);

      // ── Create token ─────────────────────────────────────────────────────
      const metadata: InviteTokenMetadata = {
        role: params.role,
        orgName: params.orgName,
        inviterName: params.inviterName,
        orgId: ctx.tenantId,
      };

      const { entity, plaintextToken } = InviteToken.create({
        type: 'org_member_invite',
        email,
        tenantId: ctx.tenantId,
        invitedByUserId: ctx.actorId,
        metadata,
      });

      await this.tokenRepo.create(entity.toData());

      // ── Send email ───────────────────────────────────────────────────────
      const inviteLink = `${this.baseInviteUrl}?token=${plaintextToken}`;
      const emailResult = await this.emailPort.sendEmailWithTemplate(
        email,
        'org-member-invite',
        {
          inviterName: params.inviterName,
          orgName: params.orgName,
          role: params.role,
          inviteLink,
          expiryDays: 7,
        },
        { tag: 'org-member-invite', metadata: { tenantId: ctx.tenantId, inviteId: entity.id } },
      );

      if (!emailResult.success) {
        return {
          success: false,
          error: `Failed to send invite email: ${emailResult.error}`,
          errorCode: 'EMAIL_SEND_FAILED',
        };
      }

      return { success: true, tokenPlaintext: plaintextToken, expiresAt: entity.expiresAt };
    } catch (err) {
      return {
        success: false,
        error: `Failed to send org member invite: ${err instanceof Error ? err.message : String(err)}`,
        errorCode: 'INVITE_SEND_ERROR',
      };
    }
  }

  /** Hash a plaintext token (utility for verification). */
  static hashToken(plaintext: string): string {
    return createHash('sha256').update(plaintext).digest('hex');
  }
}
