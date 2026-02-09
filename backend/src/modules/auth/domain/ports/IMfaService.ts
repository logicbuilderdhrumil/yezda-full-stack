/**
 * MFA service port — defines contract for TOTP enrollment, verification, and backup codes
 */
export interface IMfaService {
  startEnrollment(
    userId: string,
    userType: 'user' | 'candidate',
    email: string,
  ): Promise<{
    enrollmentId: string;
    secret: string;
    qrCodeUrl: string;
    otpauthUrl: string;
  }>;

  verifyEnrollment(
    enrollmentId: string,
    code: string,
  ): Promise<{ success: boolean; secret?: string; backupCodes?: string[] }>;

  verifyCode(encryptedSecret: string, code: string): boolean;

  verifyBackupCodeForUser(
    userId: string,
    userType: 'user' | 'candidate',
    code: string,
  ): Promise<boolean>;

  generateBackupCodes(count?: number): string[];

  regenerateBackupCodes(
    userId: string,
    userType: 'user' | 'candidate',
  ): Promise<string[]>;

  getRemainingBackupCodesCount(
    userId: string,
    userType: 'user' | 'candidate',
  ): Promise<number>;

  getPendingEnrollment(
    userId: string,
    userType: 'user' | 'candidate',
  ): Promise<unknown | undefined>;

  cancelEnrollment(enrollmentId: string): Promise<boolean>;
}
