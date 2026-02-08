/**
 * RequestPasswordReset Use Case
 * Generates a reset token and stores only the hash
 */
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import type { IUserRepository } from '../../domain/ports/IUserRepository.js';
import type { IPasswordResetRepository } from '../../domain/ports/IPasswordResetRepository.js';
import type { IAuditService } from '../../domain/ports/IAuditService.js';
import type { PasswordResetToken } from '../../domain/entities/PasswordResetToken.js';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export class RequestPasswordResetUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly passwordResetRepo: IPasswordResetRepository,
    private readonly auditService: IAuditService,
    private readonly passwordResetTtlMinutes: number,
  ) {}

  async execute(
    email: string,
    userType: 'user' | 'candidate',
    channel: 'web' | 'mobile' | 'api' = 'api',
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ success: boolean; token?: string }> {
    const normalizedEmail = email.toLowerCase().trim();
    const entity = await this.userRepo.findEntityByEmail(normalizedEmail, userType);

    // Always return success to prevent email enumeration
    if (!entity) {
      return { success: true };
    }

    // Generate reset token and store only the hash (security best practice)
    const resetToken = uuidv4();
    const tokenHash = hashToken(resetToken);

    const passwordResetToken: PasswordResetToken = {
      id: uuidv4(),
      userId: entity.id,
      userType,
      tokenHash,
      expiresAt: new Date(Date.now() + this.passwordResetTtlMinutes * 60 * 1000),
      createdAt: new Date(),
    };

    await this.passwordResetRepo.create(passwordResetToken);

    this.auditService.logPasswordResetRequest({
      userId: entity.id,
      userType,
      channel,
      ipAddress,
      userAgent,
    });

    // In production, send email with reset link
    // For now, return token directly (remove in production)
    return { success: true, token: resetToken };
  }
}
