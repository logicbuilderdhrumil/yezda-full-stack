/**
 * MFA Service
 * Task 1.4: TOTP enrollment and verification
 * 
 * Uses Postgres for MFA enrollment persistence.
 * Encrypts MFA secrets at rest using AES-256-GCM.
 */

import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import type { MfaEnrollment } from '../models/auth.model.js';
import { mfaEnrollmentRepository } from '../repositories/mfa-enrollment.repository.js';
import { backupCodeRepository, type BackupCode } from '../repositories/backup-code.repository.js';
import { encrypt, decrypt, hashBackupCode } from './crypto.service.js';
import { config } from '../config/index.js';

export class MfaService {
  /**
   * Start MFA enrollment - generate secret and QR code
   * Secret is encrypted before storage
   */
  async startEnrollment(
    userId: string,
    userType: 'user' | 'candidate',
    email: string
  ): Promise<{ enrollmentId: string; secret: string; qrCodeUrl: string; otpauthUrl: string }> {
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(email, config.security.mfaIssuer, secret);
    const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

    // Encrypt secret before storing
    const encryptedSecret = encrypt(secret);

    const enrollment: MfaEnrollment = {
      id: uuidv4(),
      userId,
      userType,
      secret: encryptedSecret,
      verified: false,
      createdAt: new Date(),
    };

    await mfaEnrollmentRepository.create(enrollment);

    return {
      enrollmentId: enrollment.id,
      secret, // Return plaintext to user (for manual entry if QR fails)
      qrCodeUrl,
      otpauthUrl,
    };
  }

  /**
   * Complete MFA enrollment by verifying a TOTP code
   * Also generates and persists backup codes
   */
  async verifyEnrollment(
    enrollmentId: string,
    code: string
  ): Promise<{ success: boolean; secret?: string; backupCodes?: string[] }> {
    const enrollment = await mfaEnrollmentRepository.findById(enrollmentId);
    if (!enrollment) {
      return { success: false };
    }

    if (enrollment.verified) {
      return { success: false };
    }

    // Decrypt secret for verification
    const decryptedSecret = decrypt(enrollment.secret);

    const isValid = authenticator.verify({ token: code, secret: decryptedSecret });
    if (!isValid) {
      return { success: false };
    }

    await mfaEnrollmentRepository.markVerified(enrollmentId);

    // Generate and persist backup codes
    const backupCodes = this.generateBackupCodes(10);
    await this.saveBackupCodes(enrollment.userId, enrollment.userType, backupCodes);

    // Return encrypted secret (for storage in user record)
    return { success: true, secret: enrollment.secret, backupCodes };
  }

  /**
   * Verify a TOTP code against a user's encrypted secret
   */
  verifyCode(encryptedSecret: string, code: string): boolean {
    const secret = decrypt(encryptedSecret);
    return authenticator.verify({ token: code, secret });
  }

  /**
   * Verify a backup code and mark it as used if valid
   */
  async verifyBackupCodeForUser(
    userId: string,
    userType: 'user' | 'candidate',
    code: string
  ): Promise<boolean> {
    const codeHash = hashBackupCode(code.toUpperCase().replace(/[-\s]/g, ''));
    const backupCode = await backupCodeRepository.findUnusedByHash(userId, userType, codeHash);
    
    if (!backupCode) {
      return false;
    }
    
    await backupCodeRepository.markUsed(backupCode.id);
    return true;
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
   * Save backup codes to database (hashed)
   */
  private async saveBackupCodes(
    userId: string,
    userType: 'user' | 'candidate',
    codes: string[]
  ): Promise<void> {
    // Delete any existing codes first
    await backupCodeRepository.deleteAllForUser(userId, userType);

    const now = new Date();
    const backupCodes: BackupCode[] = codes.map((code) => ({
      id: uuidv4(),
      userId,
      userType,
      codeHash: hashBackupCode(code),
      createdAt: now,
    }));

    await backupCodeRepository.createBatch(backupCodes);
  }

  /**
   * Regenerate backup codes (replaces existing)
   */
  async regenerateBackupCodes(
    userId: string,
    userType: 'user' | 'candidate'
  ): Promise<string[]> {
    const codes = this.generateBackupCodes(10);
    await this.saveBackupCodes(userId, userType, codes);
    return codes;
  }

  /**
   * Get count of remaining unused backup codes
   */
  async getRemainingBackupCodesCount(
    userId: string,
    userType: 'user' | 'candidate'
  ): Promise<number> {
    return backupCodeRepository.countUnused(userId, userType);
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
