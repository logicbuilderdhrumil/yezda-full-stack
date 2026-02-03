/**
 * MFA Service
 * Task 1.4: TOTP enrollment and verification
 */

import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import type { MfaEnrollment } from '../models/auth.model.js';
import { config } from '../config/index.js';

// In-memory enrollment store (replace with DB in production)
const enrollments = new Map<string, MfaEnrollment>();

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

    enrollments.set(enrollment.id, enrollment);

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
  verifyEnrollment(enrollmentId: string, code: string): { success: boolean; secret?: string } {
    const enrollment = enrollments.get(enrollmentId);
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

    enrollment.verified = true;
    enrollment.verifiedAt = new Date();

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
  getPendingEnrollment(
    userId: string,
    userType: 'user' | 'candidate'
  ): MfaEnrollment | undefined {
    for (const enrollment of enrollments.values()) {
      if (
        enrollment.userId === userId &&
        enrollment.userType === userType &&
        !enrollment.verified
      ) {
        return enrollment;
      }
    }
    return undefined;
  }

  /**
   * Cancel pending enrollment
   */
  cancelEnrollment(enrollmentId: string): boolean {
    return enrollments.delete(enrollmentId);
  }
}

export const mfaService = new MfaService();
