/**
 * Session entity for tracking active sessions
 */
export interface Session {
  id: string;
  userId: string;
  userType: 'user' | 'candidate';
  refreshToken: string;
  refreshTokenHash: string;
  deviceInfo?: string;
  ipAddress?: string;
  expiresAt: Date;
  createdAt: Date;
  revokedAt?: Date;
  rotatedFromId?: string;
}
