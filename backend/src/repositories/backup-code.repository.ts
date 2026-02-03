/**
 * Backup Codes Repository
 * Postgres persistence for MFA backup codes
 */

import { query } from '../db/postgres.js';
import type pg from 'pg';

export interface BackupCode {
  id: string;
  userId: string;
  userType: 'user' | 'candidate';
  codeHash: string;
  usedAt?: Date;
  createdAt: Date;
}

type BackupCodeRow = {
  id: string;
  user_id: string;
  user_type: 'user' | 'candidate';
  code_hash: string;
  used_at: Date | null;
  created_at: Date;
};

function rowToBackupCode(row: BackupCodeRow): BackupCode {
  return {
    id: row.id,
    userId: row.user_id,
    userType: row.user_type,
    codeHash: row.code_hash,
    usedAt: row.used_at ?? undefined,
    createdAt: row.created_at,
  };
}

export class BackupCodeRepository {
  /**
   * Create multiple backup codes in a transaction
   */
  async createBatch(codes: BackupCode[], client?: pg.PoolClient): Promise<void> {
    const executeQuery = client ? client.query.bind(client) : query;
    
    if (codes.length === 0) return;
    
    // Build bulk insert
    const placeholders: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;
    
    for (const code of codes) {
      placeholders.push(
        `($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`
      );
      values.push(
        code.id,
        code.userId,
        code.userType,
        code.codeHash,
        code.usedAt ?? null,
        code.createdAt
      );
    }
    
    await executeQuery(
      `INSERT INTO backup_codes (id, user_id, user_type, code_hash, used_at, created_at)
       VALUES ${placeholders.join(', ')}`,
      values
    );
  }

  /**
   * Get all unused backup codes for a user
   */
  async findUnusedByUser(
    userId: string,
    userType: 'user' | 'candidate'
  ): Promise<BackupCode[]> {
    const result = await query<BackupCodeRow>(
      `SELECT * FROM backup_codes 
       WHERE user_id = $1 AND user_type = $2 AND used_at IS NULL
       ORDER BY created_at`,
      [userId, userType]
    );
    return result.rows.map(rowToBackupCode);
  }

  /**
   * Find an unused backup code by its hash
   */
  async findUnusedByHash(
    userId: string,
    userType: 'user' | 'candidate',
    codeHash: string
  ): Promise<BackupCode | undefined> {
    const result = await query<BackupCodeRow>(
      `SELECT * FROM backup_codes 
       WHERE user_id = $1 AND user_type = $2 AND code_hash = $3 AND used_at IS NULL`,
      [userId, userType, codeHash]
    );
    return result.rows[0] ? rowToBackupCode(result.rows[0]) : undefined;
  }

  /**
   * Mark a backup code as used
   */
  async markUsed(id: string): Promise<void> {
    await query(
      'UPDATE backup_codes SET used_at = NOW() WHERE id = $1',
      [id]
    );
  }

  /**
   * Delete all backup codes for a user (used when regenerating)
   */
  async deleteAllForUser(
    userId: string,
    userType: 'user' | 'candidate',
    client?: pg.PoolClient
  ): Promise<number> {
    const executeQuery = client
      ? (text: string, params: unknown[]) => client.query(text, params)
      : query;
    
    const result = await executeQuery(
      'DELETE FROM backup_codes WHERE user_id = $1 AND user_type = $2',
      [userId, userType]
    );
    return result.rowCount ?? 0;
  }

  /**
   * Count remaining unused codes
   */
  async countUnused(userId: string, userType: 'user' | 'candidate'): Promise<number> {
    const result = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM backup_codes 
       WHERE user_id = $1 AND user_type = $2 AND used_at IS NULL`,
      [userId, userType]
    );
    return parseInt(result.rows[0]?.count ?? '0', 10);
  }
}

export const backupCodeRepository = new BackupCodeRepository();
