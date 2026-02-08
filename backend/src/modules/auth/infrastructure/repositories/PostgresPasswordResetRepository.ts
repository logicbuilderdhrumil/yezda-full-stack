/**
 * PostgresPasswordResetRepository
 * Postgres persistence for password reset tokens — implements IPasswordResetRepository
 */
import { query } from '../../../db/postgres.js';
import type { PasswordResetToken } from '../../domain/entities/PasswordResetToken.js';
import type { IPasswordResetRepository } from '../../domain/ports/IPasswordResetRepository.js';

type PasswordResetRow = {
  id: string;
  user_id: string;
  user_type: 'user' | 'candidate';
  token_hash: string;
  expires_at: Date;
  used_at: Date | null;
  created_at: Date;
};

function rowToToken(row: PasswordResetRow): PasswordResetToken {
  return {
    id: row.id,
    userId: row.user_id,
    userType: row.user_type,
    tokenHash: row.token_hash,
    expiresAt: row.expires_at,
    usedAt: row.used_at ?? undefined,
    createdAt: row.created_at,
  };
}

export class PostgresPasswordResetRepository implements IPasswordResetRepository {
  async create(token: PasswordResetToken): Promise<void> {
    await query(
      `INSERT INTO password_reset_tokens (id, user_id, user_type, token_hash, expires_at, used_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        token.id,
        token.userId,
        token.userType,
        token.tokenHash,
        token.expiresAt,
        token.usedAt ?? null,
        token.createdAt,
      ],
    );
  }

  async findByTokenHash(hash: string): Promise<PasswordResetToken | undefined> {
    const result = await query<PasswordResetRow>(
      'SELECT * FROM password_reset_tokens WHERE token_hash = $1',
      [hash],
    );
    return result.rows[0] ? rowToToken(result.rows[0]) : undefined;
  }

  async markUsed(id: string): Promise<void> {
    await query(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1',
      [id],
    );
  }

  async delete(id: string): Promise<void> {
    await query('DELETE FROM password_reset_tokens WHERE id = $1', [id]);
  }

  async deleteByTokenHash(hash: string): Promise<void> {
    await query('DELETE FROM password_reset_tokens WHERE token_hash = $1', [hash]);
  }

  async cleanupExpired(): Promise<number> {
    const result = await query(
      `DELETE FROM password_reset_tokens
       WHERE expires_at < NOW() OR used_at IS NOT NULL`,
    );
    return result.rowCount ?? 0;
  }
}
