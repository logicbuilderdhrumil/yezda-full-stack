/**
 * VerifyInviteTokenUseCase
 *
 * Validates a plaintext invite token: looks up by hash, checks expiry/status.
 */
import { createHash } from 'node:crypto';
import { InviteToken } from '../../domain/entities/InviteToken.js';
import type { IInviteTokenRepository } from '../../domain/ports/InviteTokenRepository.port.js';
import type { VerifyInviteResult } from '../../domain/types/email-types.js';

export class VerifyInviteTokenUseCase {
  constructor(private readonly tokenRepo: IInviteTokenRepository) {}

  async execute(plaintextToken: string): Promise<VerifyInviteResult> {
    try {
      const hash = createHash('sha256').update(plaintextToken).digest('hex');
      const record = await this.tokenRepo.findByHash(hash);

      if (!record) {
        return { valid: false, reason: 'Invalid invite token' };
      }

      const entity = InviteToken.fromRecord(record);

      if (entity.isConsumed()) {
        return { valid: false, reason: 'Invite token has already been used' };
      }

      if (entity.isExpired()) {
        return { valid: false, reason: 'Invite token has expired' };
      }

      if (!entity.isValid()) {
        return { valid: false, reason: 'Invite token is no longer valid' };
      }

      return {
        valid: true,
        invite: {
          id: entity.id,
          type: entity.type,
          email: entity.email,
          tenantId: entity.tenantId,
          invitedByUserId: entity.invitedByUserId,
          metadata: entity.metadata,
          expiresAt: entity.expiresAt,
        },
      };
    } catch (err) {
      return {
        valid: false,
        reason: `Token verification failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }
}
