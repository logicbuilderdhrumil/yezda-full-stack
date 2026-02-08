/**
 * User entity for authentication
 */
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  mfaEnabled: boolean;
  mfaSecret?: string;
  lockedUntil?: Date;
  failedAttempts: number;
  createdAt: Date;
  updatedAt: Date;
}
