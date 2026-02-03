/**
 * Session Repository
 * Postgres persistence for user sessions
 */

import { query } from '../db/postgres.js';
import type { Session } from '../models/auth.model.js';

type SessionRow = {
  id: string;
  user_id: string;
  user_type: 'user' | 'candidate';
  refresh_token_hash: string;
  device_info: string | null;
  ip_address: string | null;
  expires_at: Date;
  created_at: Date;
  revoked_at: Date | null;
  rotated_from_id: string | null;
};

function rowToSession(row: SessionRow): Session {
  return {
    id: row.id,
    userId: row.user_id,
    userType: row.user_type,
    refreshToken: '', // Not stored, only hash
    refreshTokenHash: row.refresh_token_hash,
    deviceInfo: row.device_info ?? undefined,
    ipAddress: row.ip_address ?? undefined,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    revokedAt: row.revoked_at ?? undefined,
    rotatedFromId: row.rotated_from_id ?? undefined,
  };
}

export class SessionRepository {
  async create(session: Session): Promise<void> {
    await query(
      `INSERT INTO sessions (id, user_id, user_type, refresh_token_hash, device_info, ip_address, expires_at, created_at, revoked_at, rotated_from_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        session.id,
        session.userId,
        session.userType,
        session.refreshTokenHash,
        session.deviceInfo ?? null,
        session.ipAddress ?? null,
        session.expiresAt,
        session.createdAt,
        session.revokedAt ?? null,
        session.rotatedFromId ?? null,
      ]
    );
  }

  async findById(id: string): Promise<Session | undefined> {
    const result = await query<SessionRow>(
      'SELECT * FROM sessions WHERE id = $1',
      [id]
    );
    return result.rows[0] ? rowToSession(result.rows[0]) : undefined;
  }

  async findByRefreshTokenHash(hash: string): Promise<Session | undefined> {
    const result = await query<SessionRow>(
      'SELECT * FROM sessions WHERE refresh_token_hash = $1',
      [hash]
    );
    return result.rows[0] ? rowToSession(result.rows[0]) : undefined;
  }

  async findActiveByUser(
    userId: string,
    userType: 'user' | 'candidate'
  ): Promise<Session[]> {
    const result = await query<SessionRow>(
      `SELECT * FROM sessions 
       WHERE user_id = $1 AND user_type = $2 
       AND revoked_at IS NULL AND expires_at > NOW()
       ORDER BY created_at DESC`,
      [userId, userType]
    );
    return result.rows.map(rowToSession);
  }

  async revoke(id: string): Promise<boolean> {
    const result = await query(
      'UPDATE sessions SET revoked_at = NOW() WHERE id = $1 AND revoked_at IS NULL',
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async revokeAllForUser(
    userId: string,
    userType: 'user' | 'candidate'
  ): Promise<number> {
    const result = await query(
      `UPDATE sessions SET revoked_at = NOW() 
       WHERE user_id = $1 AND user_type = $2 AND revoked_at IS NULL`,
      [userId, userType]
    );
    return result.rowCount ?? 0;
  }

  async update(session: Session): Promise<void> {
    await query(
      `UPDATE sessions SET 
        revoked_at = $2,
        rotated_from_id = $3
       WHERE id = $1`,
      [
        session.id,
        session.revokedAt ?? null,
        session.rotatedFromId ?? null,
      ]
    );
  }

  async cleanupExpired(): Promise<number> {
    const result = await query(
      `DELETE FROM sessions 
       WHERE expires_at < NOW() - INTERVAL '30 days'`
    );
    return result.rowCount ?? 0;
  }
}

export const sessionRepository = new SessionRepository();
