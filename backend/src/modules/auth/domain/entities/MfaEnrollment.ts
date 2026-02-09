/**
 * MFA enrollment entity (pending TOTP setup)
 */
export interface MfaEnrollment {
  id: string;
  userId: string;
  userType: 'user' | 'candidate';
  secret: string;
  verified: boolean;
  createdAt: Date;
  verifiedAt?: Date;
}
