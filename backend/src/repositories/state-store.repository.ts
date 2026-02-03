/**
 * State Store Repository
 * Task 1.1: Postgres persistence for state entries
 */

import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/postgres.js';
import type { StateEntry } from '../models/state-store.model.js';

interface StateStoreRow {
  id: string;
  tenant_id: string;
  user_id: string;
  user_type: 'user' | 'candidate';
  key: string;
  value: string;
  expires_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

function rowToStateEntry(row: StateStoreRow): StateEntry {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    userId: row.user_id,
    userType: row.user_type,
    key: row.key,
    value: row.value,
    expiresAt: row.expires_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class StateStoreRepository {
  /**
   * Create or update a state entry (upsert)
   */
  async upsert(entry: Omit<StateEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<StateEntry> {
    const id = uuidv4();
    const result = await query<StateStoreRow>(
      `INSERT INTO state_store (id, tenant_id, user_id, user_type, key, value, expires_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       ON CONFLICT (tenant_id, user_id, user_type, key) 
       DO UPDATE SET 
         value = EXCLUDED.value,
         expires_at = EXCLUDED.expires_at,
         updated_at = NOW()
       RETURNING *`,
      [
        id,
        entry.tenantId,
        entry.userId,
        entry.userType,
        entry.key,
        entry.value,
        entry.expiresAt ?? null,
      ]
    );
    return rowToStateEntry(result.rows[0]);
  }

  /**
   * Find a state entry by tenant, user, and key
   */
  async findByKey(
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate',
    key: string
  ): Promise<StateEntry | undefined> {
    const result = await query<StateStoreRow>(
      `SELECT * FROM state_store 
       WHERE tenant_id = $1 AND user_id = $2 AND user_type = $3 AND key = $4
       AND (expires_at IS NULL OR expires_at > NOW())`,
      [tenantId, userId, userType, key]
    );
    return result.rows[0] ? rowToStateEntry(result.rows[0]) : undefined;
  }

  /**
   * Find all state entries for a user within a tenant
   */
  async findAllByUser(
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate'
  ): Promise<StateEntry[]> {
    const result = await query<StateStoreRow>(
      `SELECT * FROM state_store 
       WHERE tenant_id = $1 AND user_id = $2 AND user_type = $3
       AND (expires_at IS NULL OR expires_at > NOW())
       ORDER BY key`,
      [tenantId, userId, userType]
    );
    return result.rows.map(rowToStateEntry);
  }

  /**
   * Delete a state entry
   */
  async delete(
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate',
    key: string
  ): Promise<boolean> {
    const result = await query(
      `DELETE FROM state_store 
       WHERE tenant_id = $1 AND user_id = $2 AND user_type = $3 AND key = $4`,
      [tenantId, userId, userType, key]
    );
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Delete all state entries for a user
   */
  async deleteAllByUser(
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate'
  ): Promise<number> {
    const result = await query(
      `DELETE FROM state_store 
       WHERE tenant_id = $1 AND user_id = $2 AND user_type = $3`,
      [tenantId, userId, userType]
    );
    return result.rowCount ?? 0;
  }

  /**
   * Cleanup expired entries
   */
  async cleanupExpired(): Promise<number> {
    const result = await query(
      `DELETE FROM state_store WHERE expires_at IS NOT NULL AND expires_at < NOW()`
    );
    return result.rowCount ?? 0;
  }

  /**
   * Check if entry belongs to tenant (for access control verification)
   */
  async verifyTenantOwnership(
    entryId: string,
    tenantId: string
  ): Promise<boolean> {
    const result = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM state_store WHERE id = $1 AND tenant_id = $2`,
      [entryId, tenantId]
    );
    return parseInt(result.rows[0]?.count ?? '0', 10) > 0;
  }
}

export const stateStoreRepository = new StateStoreRepository();
