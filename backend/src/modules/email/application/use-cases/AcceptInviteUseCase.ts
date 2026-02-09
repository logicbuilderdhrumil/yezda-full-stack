/**
 * AcceptInviteUseCase
 *
 * Verifies and consumes an invite token, then signals the result
 * for downstream user provisioning.
 *
 * Note: Actual user creation / candidate linking is handled by the
 * calling layer (org-management or candidate-management integration).
 * This use case only validates + consumes the token.
 */
import { createHash } from 'node:crypto';
import { InviteToken } from '../../domain/entities/InviteToken.js';
import type { IInviteTokenRepository } from '../../domain/ports/InviteTokenRepository.port.js';
import type { InviteTokenMetadata, InviteType } from '../../domain/types/email-types.js';

export interface AcceptedInviteInfo {
  id: string;
  type: InviteType;
  email: string;
  tenantId: string;
  invitedByUserId: string;
  metadata: InviteTokenMetadata;
}

export class AcceptInviteUseCase {
  constructor(private readonly tokenRepo: IInviteTokenRepository) {}

  /**
   * Verify and consume the invite token.
   * Returns the invite info for the calling layer to provision the user.
   */
  async execute(plaintextToken: string): Promise<
    | { success: true; invite: AcceptedInviteInfo }
    | { success: false; error: string; errorCode: string }
  > {
    try {
      const hash = createHash('sha256').update(plaintextToken).digest('hex');
      const record = await this.tokenRepo.findByHash(hash);

      if (!record) {
        return { success: false, error: 'Invalid invite token', errorCode: 'INVALID_TOKEN' };
      }

      const entity = InviteToken.fromRecord(record);

      if (entity.isConsumed()) {
        return { success: false, error: 'Invite token has already been used', errorCode: 'TOKEN_CONSUMED' };
      }

      if (entity.isExpired()) {
        return { success: false, error: 'Invite token has expired', errorCode: 'TOKEN_EXPIRED' };
      }

      if (!entity.isValid()) {
        return { success: false, error: 'Invite token is no longer valid', errorCode: 'TOKEN_INVALID' };
      }

      // Consume the token (single-use)
      entity.consume();
      await this.tokenRepo.markConsumed(entity.id, entity.consumedAt!);

      return {
        success: true,
        invite: {
          id: entity.id,
          type: entity.type,
          email: entity.email,
          tenantId: entity.tenantId,
          invitedByUserId: entity.invitedByUserId,
          metadata: entity.metadata,
        },
      };
    } catch (err) {
      return {
        success: false,
        error: `Failed to accept invite: ${err instanceof Error ? err.message : String(err)}`,
        errorCode: 'INVITE_ACCEPT_ERROR',
      };
    }
  }
}
