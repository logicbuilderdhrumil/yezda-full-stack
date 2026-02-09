/**
 * Password reset token entity
 */
export interface PasswordResetToken {
  id: string;
  userId: string;
  userType: 'user' | 'candidate';
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
}
