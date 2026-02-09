/**
 * StartMfaEnrollment Use Case
 * Generates TOTP secret and QR code for MFA setup
 */
import type { IMfaService } from '../../domain/ports/IMfaService.js';

export class StartMfaEnrollmentUseCase {
  constructor(private readonly mfaService: IMfaService) {}

  async execute(
    userId: string,
    userType: 'user' | 'candidate',
    email: string,
  ): Promise<{
    enrollmentId: string;
    secret: string;
    qrCodeUrl: string;
    otpauthUrl: string;
  }> {
    return this.mfaService.startEnrollment(userId, userType, email);
  }
}
