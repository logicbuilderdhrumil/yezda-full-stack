/**
 * Candidate entity for authentication (separate from admin users)
 */
export interface Candidate {
  id: string;
  email: string;
  passwordHash: string;
  mfaEnabled: boolean;
  mfaSecret?: string;
  lockedUntil?: Date;
  failedAttempts: number;
  tenantId?: string;
  createdAt: Date;
  updatedAt: Date;
}
