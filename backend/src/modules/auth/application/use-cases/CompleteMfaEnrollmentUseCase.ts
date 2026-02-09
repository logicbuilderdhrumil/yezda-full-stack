/**
 * CompleteMfaEnrollment Use Case
 * Verifies the TOTP code, enables MFA, and generates backup codes
 */
import type { IMfaService } from '../../domain/ports/IMfaService.js';
import type { EnableMfaUseCase } from './EnableMfaUseCase.js';

export class CompleteMfaEnrollmentUseCase {
  constructor(
    private readonly mfaService: IMfaService,
    private readonly enableMfaUseCase: EnableMfaUseCase,
  ) {}

  async execute(
    userId: string,
    userType: 'user' | 'candidate',
    enrollmentId: string,
    code: string,
    channel: 'web' | 'mobile' | 'api' = 'api',
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{
    success: boolean;
    backupCodes?: string[];
    error?: string;
    errorCode?: string;
  }> {
    const verifyResult = await this.mfaService.verifyEnrollment(enrollmentId, code);
    if (!verifyResult.success) {
      return { success: false, error: 'Invalid verification code', errorCode: 'INVALID_CODE' };
    }

    const enableResult = await this.enableMfaUseCase.execute(
      userId,
      userType,
      verifyResult.secret!,
      channel,
      ipAddress,
      userAgent,
    );

    if (!enableResult.success) {
      return { success: false, error: 'Failed to enable MFA', errorCode: 'MFA_ENABLE_FAILED' };
    }

    // Generate backup codes
    const backupCodes = this.mfaService.generateBackupCodes();

    return { success: true, backupCodes };
  }
}
