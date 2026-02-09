/**
 * Session repository port — defines persistence contract for sessions
 */
import type { Session } from '../entities/Session.js';

export interface ISessionRepository {
  create(session: Session): Promise<void>;
  findById(id: string): Promise<Session | undefined>;
  findByRefreshTokenHash(hash: string): Promise<Session | undefined>;
  findActiveByUser(userId: string, userType: 'user' | 'candidate'): Promise<Session[]>;
  revoke(id: string): Promise<boolean>;
  revokeAllForUser(userId: string, userType: 'user' | 'candidate'): Promise<number>;
  update(session: Session): Promise<void>;
  cleanupExpired(): Promise<number>;
}
