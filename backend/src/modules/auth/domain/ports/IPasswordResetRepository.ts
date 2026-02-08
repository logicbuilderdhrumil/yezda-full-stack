/**
 * Password reset repository port — defines persistence contract for reset tokens
 */
import type { PasswordResetToken } from '../entities/PasswordResetToken.js';

export interface IPasswordResetRepository {
  create(token: PasswordResetToken): Promise<void>;
  findByTokenHash(hash: string): Promise<PasswordResetToken | undefined>;
  markUsed(id: string): Promise<void>;
  delete(id: string): Promise<void>;
  deleteByTokenHash(hash: string): Promise<void>;
  cleanupExpired(): Promise<number>;
}
