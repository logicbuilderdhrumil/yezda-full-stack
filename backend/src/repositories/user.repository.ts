/**
 * User Repository
 * Postgres persistence for users and candidates
 */

import { query } from '../db/postgres.js';
import type { User, Candidate } from '../models/auth.model.js';

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  mfa_enabled: boolean;
  mfa_secret: string | null;
  locked_until: Date | null;
  failed_attempts: number;
  tenant_id?: string | null;
  created_at: Date;
  updated_at: Date;
};

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    mfaEnabled: row.mfa_enabled,
    mfaSecret: row.mfa_secret ?? undefined,
    lockedUntil: row.locked_until ?? undefined,
    failedAttempts: row.failed_attempts,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToCandidate(row: UserRow): Candidate {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    mfaEnabled: row.mfa_enabled,
    mfaSecret: row.mfa_secret ?? undefined,
    lockedUntil: row.locked_until ?? undefined,
    failedAttempts: row.failed_attempts,
    tenantId: row.tenant_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class UserRepository {
  // ==================== USERS ====================

  async createUser(user: User): Promise<void> {
    await query(
      `INSERT INTO users (id, email, password_hash, mfa_enabled, mfa_secret, locked_until, failed_attempts, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        user.id,
        user.email,
        user.passwordHash,
        user.mfaEnabled,
        user.mfaSecret ?? null,
        user.lockedUntil ?? null,
        user.failedAttempts,
        user.createdAt,
        user.updatedAt,
      ]
    );
  }

  async findUserById(id: string): Promise<User | undefined> {
    const result = await query<UserRow>(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] ? rowToUser(result.rows[0]) : undefined;
  }

  async findUserByEmail(email: string): Promise<User | undefined> {
    const result = await query<UserRow>(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );
    return result.rows[0] ? rowToUser(result.rows[0]) : undefined;
  }

  async updateUser(user: User): Promise<void> {
    await query(
      `UPDATE users SET 
        email = $2,
        password_hash = $3,
        mfa_enabled = $4,
        mfa_secret = $5,
        locked_until = $6,
        failed_attempts = $7,
        updated_at = $8
       WHERE id = $1`,
      [
        user.id,
        user.email,
        user.passwordHash,
        user.mfaEnabled,
        user.mfaSecret ?? null,
        user.lockedUntil ?? null,
        user.failedAttempts,
        user.updatedAt,
      ]
    );
  }

  async emailExistsForUser(email: string): Promise<boolean> {
    const result = await query<{ exists: boolean }>(
      'SELECT EXISTS(SELECT 1 FROM users WHERE LOWER(email) = LOWER($1)) as exists',
      [email]
    );
    return result.rows[0]?.exists ?? false;
  }

  // ==================== CANDIDATES ====================

  async createCandidate(candidate: Candidate): Promise<void> {
    await query(
      `INSERT INTO candidates (id, email, password_hash, mfa_enabled, mfa_secret, locked_until, failed_attempts, tenant_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        candidate.id,
        candidate.email,
        candidate.passwordHash,
        candidate.mfaEnabled,
        candidate.mfaSecret ?? null,
        candidate.lockedUntil ?? null,
        candidate.failedAttempts,
        candidate.tenantId ?? null,
        candidate.createdAt,
        candidate.updatedAt,
      ]
    );
  }

  async findCandidateById(id: string): Promise<Candidate | undefined> {
    const result = await query<UserRow>(
      'SELECT * FROM candidates WHERE id = $1',
      [id]
    );
    return result.rows[0] ? rowToCandidate(result.rows[0]) : undefined;
  }

  async findCandidateByEmail(email: string): Promise<Candidate | undefined> {
    const result = await query<UserRow>(
      'SELECT * FROM candidates WHERE LOWER(email) = LOWER($1)',
      [email]
    );
    return result.rows[0] ? rowToCandidate(result.rows[0]) : undefined;
  }

  async updateCandidate(candidate: Candidate): Promise<void> {
    await query(
      `UPDATE candidates SET 
        email = $2,
        password_hash = $3,
        mfa_enabled = $4,
        mfa_secret = $5,
        locked_until = $6,
        failed_attempts = $7,
        updated_at = $8
       WHERE id = $1`,
      [
        candidate.id,
        candidate.email,
        candidate.passwordHash,
        candidate.mfaEnabled,
        candidate.mfaSecret ?? null,
        candidate.lockedUntil ?? null,
        candidate.failedAttempts,
        candidate.updatedAt,
      ]
    );
  }

  async emailExistsForCandidate(email: string): Promise<boolean> {
    const result = await query<{ exists: boolean }>(
      'SELECT EXISTS(SELECT 1 FROM candidates WHERE LOWER(email) = LOWER($1)) as exists',
      [email]
    );
    return result.rows[0]?.exists ?? false;
  }

  // ==================== GENERIC ====================

  async findEntityByEmail(
    email: string,
    userType: 'user' | 'candidate'
  ): Promise<User | Candidate | undefined> {
    return userType === 'user'
      ? this.findUserByEmail(email)
      : this.findCandidateByEmail(email);
  }

  async findEntityById(
    id: string,
    userType: 'user' | 'candidate'
  ): Promise<User | Candidate | undefined> {
    return userType === 'user'
      ? this.findUserById(id)
      : this.findCandidateById(id);
  }

  async updateEntity(
    entity: User | Candidate,
    userType: 'user' | 'candidate'
  ): Promise<void> {
    return userType === 'user'
      ? this.updateUser(entity as User)
      : this.updateCandidate(entity as Candidate);
  }

  async emailExists(email: string, userType: 'user' | 'candidate'): Promise<boolean> {
    return userType === 'user'
      ? this.emailExistsForUser(email)
      : this.emailExistsForCandidate(email);
  }
}

export const userRepository = new UserRepository();
