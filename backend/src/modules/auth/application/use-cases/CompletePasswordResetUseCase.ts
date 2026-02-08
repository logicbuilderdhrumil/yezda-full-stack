/**
 * CompletePasswordReset Use Case
 * Validates the reset token, updates the password, and revokes all sessions.
 * Uses a transaction for atomicity.
 */
import crypto from 'crypto';
import type { IUserRepository } from '../../domain/ports/IUserRepository.js';
import type { IPasswordResetRepository } from '../../domain/ports/IPasswordResetRepository.js';
import type { IPasswordService } from '../../domain/ports/IPasswordService.js';
import type { ITokenService } from '../../domain/ports/ITokenService.js';
import type { IAuditService } from '../../domain/ports/IAuditService.js';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    crypto.timingSafeEqual(Buffer.from(a), Buffer.from(a));
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Postgres client interface — thin contract so domain doesn't depend on pg.
 */
export interface ITransactionClient {
  query(text: string, values?: unknown[]): Promise<unknown>;
}

export interface ITransactionManager {
  getClient(): Promise<{
    client: ITransactionClient;
    begin(): Promise<void>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
    release(): void;
  }>;
}

export class CompletePasswordResetUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly passwordResetRepo: IPasswordResetRepository,
    private readonly passwordService: IPasswordService,
    private readonly tokenService: ITokenService,
    private readonly auditService: IAuditService,
    private readonly transactionManager: ITransactionManager,
  ) {}

  async execute(
    token: string,
    newPassword: string,
    channel: 'web' | 'mobile' | 'api' = 'api',
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ success: boolean; error?: string }> {
    // Hash the incoming token and use constant-time comparison
    const tokenHash = hashToken(token);
    const resetTokenData = await this.passwordResetRepo.findByTokenHash(tokenHash);

    if (!resetTokenData) {
      return { success: false, error: 'Invalid or expired reset token' };
    }

    // Use constant-time comparison to prevent timing attacks
    if (!secureCompare(tokenHash, resetTokenData.tokenHash)) {
      return { success: false, error: 'Invalid or expired reset token' };
    }

    if (resetTokenData.expiresAt < new Date() || resetTokenData.usedAt) {
      // Clean up expired/used token
      await this.passwordResetRepo.delete(resetTokenData.id);
      return { success: false, error: 'Invalid or expired reset token' };
    }

    // Validate new password strength
    const strengthResult = this.passwordService.validateStrength(newPassword);
    if (!strengthResult.valid) {
      return { success: false, error: strengthResult.errors.join('; ') };
    }

    // Find user
    const entity = await this.userRepo.findEntityById(resetTokenData.userId, resetTokenData.userType);
    if (!entity) {
      return { success: false, error: 'User not found' };
    }

    // Hash new password
    const newPasswordHash = await this.passwordService.hash(newPassword);

    // Use transaction for atomicity
    const { client, begin, commit, rollback, release } =
      await this.transactionManager.getClient();
    try {
      await begin();

      // Update user password
      const table = resetTokenData.userType === 'user' ? 'users' : 'candidates';
      await client.query(
        `UPDATE ${table}
         SET password_hash = $1, updated_at = NOW(), failed_attempts = 0, locked_until = NULL
         WHERE id = $2`,
        [newPasswordHash, entity.id],
      );

      // Delete reset token
      await client.query('DELETE FROM password_reset_tokens WHERE id = $1', [resetTokenData.id]);

      await commit();
    } catch (error) {
      await rollback();
      console.error('[CompletePasswordResetUseCase] Transaction failed:', error);
      throw error;
    } finally {
      release();
    }

    // Revoke all existing sessions for security (outside transaction — can fail independently)
    await this.tokenService.revokeAllUserSessions(entity.id, resetTokenData.userType);

    this.auditService.logPasswordResetSuccess({
      userId: entity.id,
      userType: resetTokenData.userType,
      channel,
      ipAddress,
      userAgent,
    });

    return { success: true };
  }
}
