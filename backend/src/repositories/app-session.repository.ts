/**
 * App Session Repository
 * Task 1.5: Persist session metadata for device tracking
 * 
 * Uses Postgres for durable storage of app-specific sessions with device metadata.
 */

import { query } from '../db/postgres.js';
import type { AppSession, AppSessionInfo } from '../models/app-auth.model.js';

type AppSessionRow = {
  id: string;
  user_id: string;
  user_type: 'candidate';
  refresh_token_hash: string;
  device_id: string;
  device_name: string | null;
  platform: 'ios' | 'android';
  app_version: string;
  os_version: string | null;
  model: string | null;
  ip_address: string | null;
  expires_at: Date;
  created_at: Date;
  revoked_at: Date | null;
  rotated_from_id: string | null;
  last_active_at: Date;
};

function rowToAppSession(row: AppSessionRow): AppSession {
  return {
    id: row.id,
    userId: row.user_id,
    userType: row.user_type,
    refreshTokenHash: row.refresh_token_hash,
    deviceId: row.device_id,
    deviceName: row.device_name ?? undefined,
    platform: row.platform,
    appVersion: row.app_version,
    osVersion: row.os_version ?? undefined,
    model: row.model ?? undefined,
    ipAddress: row.ip_address ?? undefined,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    revokedAt: row.revoked_at ?? undefined,
    rotatedFromId: row.rotated_from_id ?? undefined,
    lastActiveAt: row.last_active_at,
  };
}

export class AppSessionRepository {
  /**
   * Create a new app session with device metadata
   */
  async create(session: AppSession): Promise<void> {
    await query(
      `INSERT INTO app_sessions (
        id, user_id, user_type, refresh_token_hash,
        device_id, device_name, platform, app_version, os_version, model,
        ip_address, expires_at, created_at, revoked_at, rotated_from_id, last_active_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        session.id,
        session.userId,
        session.userType,
        session.refreshTokenHash,
        session.deviceId,
        session.deviceName ?? null,
        session.platform,
        session.appVersion,
        session.osVersion ?? null,
        session.model ?? null,
        session.ipAddress ?? null,
        session.expiresAt,
        session.createdAt,
        session.revokedAt ?? null,
        session.rotatedFromId ?? null,
        session.lastActiveAt,
      ]
    );
  }

  /**
   * Find session by ID
   */
  async findById(id: string): Promise<AppSession | undefined> {
    const result = await query<AppSessionRow>(
      'SELECT * FROM app_sessions WHERE id = $1',
      [id]
    );
    return result.rows[0] ? rowToAppSession(result.rows[0]) : undefined;
  }

  /**
   * Find session by refresh token hash
   */
  async findByRefreshTokenHash(hash: string): Promise<AppSession | undefined> {
    const result = await query<AppSessionRow>(
      'SELECT * FROM app_sessions WHERE refresh_token_hash = $1',
      [hash]
    );
    return result.rows[0] ? rowToAppSession(result.rows[0]) : undefined;
  }

  /**
   * Find active sessions for a user
   */
  async findActiveByUser(userId: string): Promise<AppSession[]> {
    const result = await query<AppSessionRow>(
      `SELECT * FROM app_sessions 
       WHERE user_id = $1 AND user_type = 'candidate'
       AND revoked_at IS NULL AND expires_at > NOW()
       ORDER BY last_active_at DESC`,
      [userId]
    );
    return result.rows.map(rowToAppSession);
  }

  /**
   * Find active session by device ID for a user
   */
  async findActiveByDeviceId(userId: string, deviceId: string): Promise<AppSession | undefined> {
    const result = await query<AppSessionRow>(
      `SELECT * FROM app_sessions 
       WHERE user_id = $1 AND device_id = $2
       AND revoked_at IS NULL AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId, deviceId]
    );
    return result.rows[0] ? rowToAppSession(result.rows[0]) : undefined;
  }

  /**
   * Update session (revocation, rotation)
   */
  async update(session: AppSession): Promise<void> {
    await query(
      `UPDATE app_sessions SET 
        revoked_at = $2,
        rotated_from_id = $3,
        last_active_at = $4
       WHERE id = $1`,
      [
        session.id,
        session.revokedAt ?? null,
        session.rotatedFromId ?? null,
        session.lastActiveAt,
      ]
    );
  }

  /**
   * Update last active timestamp
   */
  async updateLastActive(id: string): Promise<void> {
    await query(
      'UPDATE app_sessions SET last_active_at = NOW() WHERE id = $1',
      [id]
    );
  }

  /**
   * Revoke session by ID
   */
  async revoke(id: string): Promise<boolean> {
    const result = await query(
      'UPDATE app_sessions SET revoked_at = NOW() WHERE id = $1 AND revoked_at IS NULL',
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Revoke all sessions for a user
   */
  async revokeAllForUser(userId: string): Promise<number> {
    const result = await query(
      `UPDATE app_sessions SET revoked_at = NOW() 
       WHERE user_id = $1 AND user_type = 'candidate' AND revoked_at IS NULL`,
      [userId]
    );
    return result.rowCount ?? 0;
  }

  /**
   * Revoke all sessions for a device
   */
  async revokeAllForDevice(userId: string, deviceId: string): Promise<number> {
    const result = await query(
      `UPDATE app_sessions SET revoked_at = NOW() 
       WHERE user_id = $1 AND device_id = $2 AND revoked_at IS NULL`,
      [userId, deviceId]
    );
    return result.rowCount ?? 0;
  }

  /**
   * Get session info for user (for listing active sessions)
   */
  async getSessionInfoForUser(userId: string, currentSessionId?: string): Promise<AppSessionInfo[]> {
    const sessions = await this.findActiveByUser(userId);
    return sessions.map((session) => ({
      sessionId: session.id,
      deviceId: session.deviceId,
      deviceName: session.deviceName,
      platform: session.platform,
      appVersion: session.appVersion,
      osVersion: session.osVersion,
      model: session.model,
      ipAddress: session.ipAddress,
      createdAt: session.createdAt,
      lastActiveAt: session.lastActiveAt,
      isCurrent: session.id === currentSessionId,
    }));
  }

  /**
   * Count active sessions for a user
   */
  async countActiveForUser(userId: string): Promise<number> {
    const result = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM app_sessions 
       WHERE user_id = $1 AND user_type = 'candidate'
       AND revoked_at IS NULL AND expires_at > NOW()`,
      [userId]
    );
    return parseInt(result.rows[0]?.count ?? '0', 10);
  }

  /**
   * Clean up expired sessions (older than 30 days past expiry)
   */
  async cleanupExpired(): Promise<number> {
    const result = await query(
      `DELETE FROM app_sessions 
       WHERE expires_at < NOW() - INTERVAL '30 days'`
    );
    return result.rowCount ?? 0;
  }
}

export const appSessionRepository = new AppSessionRepository();
