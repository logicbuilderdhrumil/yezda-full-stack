/**
 * MFA Service
 * Task 1.4: TOTP enrollment and verification
 * 
 * Uses Postgres for MFA enrollment persistence.
 */

import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import type { MfaEnrollment } from '../models/auth.model.js';
import { mfaEnrollmentRepository } from '../repositories/mfa-enrollment.repository.js';
import { config } from '../config/index.js';

export class MfaService {
  /**
   * Start MFA enrollment - generate secret and QR code
   */
  async startEnrollment(
    userId: string,
    userType: 'user' | 'candidate',
    email: string
  ): Promise<{ enrollmentId: string; secret: string; qrCodeUrl: string; otpauthUrl: string }> {
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(email, config.security.mfaIssuer, secret);
    const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

    const enrollment: MfaEnrollment = {
      id: uuidv4(),
      userId,
      userType,
      secret,
      verified: false,
      createdAt: new Date(),
    };

    await mfaEnrollmentRepository.create(enrollment);

    return {
      enrollmentId: enrollment.id,
      secret,
      qrCodeUrl,
      otpauthUrl,
    };
  }

  /**
   * Complete MFA enrollment by verifying a TOTP code
   */
  async verifyEnrollment(enrollmentId: string, code: string): Promise<{ success: boolean; secret?: string }> {
    const enrollment = await mfaEnrollmentRepository.findById(enrollmentId);
    if (!enrollment) {
      return { success: false };
    }

    if (enrollment.verified) {
      return { success: false };
    }

    const isValid = authenticator.verify({ token: code, secret: enrollment.secret });
    if (!isValid) {
      return { success: false };
    }

    await mfaEnrollmentRepository.markVerified(enrollmentId);

    return { success: true, secret: enrollment.secret };
  }

  /**
   * Verify a TOTP code against a user's secret
   */
  verifyCode(secret: string, code: string): boolean {
    return authenticator.verify({ token: code, secret });
  }

  /**
   * Generate backup codes for MFA recovery
   */
  generateBackupCodes(count = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric codes
      codes.push(uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase());
    }
    return codes;
  }

  /**
   * Get pending enrollment for user
   */
  async getPendingEnrollment(
    userId: string,
    userType: 'user' | 'candidate'
  ): Promise<MfaEnrollment | undefined> {
    return mfaEnrollmentRepository.findPendingByUser(userId, userType);
  }

  /**
   * Cancel pending enrollment
   */
  async cancelEnrollment(enrollmentId: string): Promise<boolean> {
    return mfaEnrollmentRepository.delete(enrollmentId);
  }
}

export const mfaService = new MfaService();
