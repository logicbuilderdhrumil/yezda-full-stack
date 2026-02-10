/**
 * PostgresInviteTokenRepository — Persistence for invite tokens
 */
import type { IInviteTokenRepository } from '../../domain/ports/InviteTokenRepository.port.js';
import type { InviteType, InviteTokenData, InviteTokenRecord, InviteTokenStatus } from '../../domain/types/email-types.js';
import { query } from '../../../../shared/infrastructure/database/index.js';

interface InviteTokenRow {
  id: string;
  token_hash: string;
  type: InviteType;
  email: string;
  tenant_id: string;
  invited_by_user_id: string;
  metadata: Record<string, unknown>;
  expires_at: Date;
  created_at: Date;
  consumed_at: Date | null;
  status: InviteTokenStatus;
}

function rowToRecord(row: InviteTokenRow): InviteTokenRecord {
  return {
    id: row.id,
    tokenHash: row.token_hash,
    type: row.type,
    email: row.email,
    tenantId: row.tenant_id,
    invitedByUserId: row.invited_by_user_id,
    metadata: row.metadata as InviteTokenRecord['metadata'],
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    consumedAt: row.consumed_at,
    status: row.status,
  };
}

export class PostgresInviteTokenRepository implements IInviteTokenRepository {
  async create(token: InviteTokenData): Promise<void> {
    await query(
      `INSERT INTO invite_tokens (id, token_hash, type, email, tenant_id, invited_by_user_id, metadata, expires_at, created_at, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')`,
      [
        token.id,
        token.tokenHash,
        token.type,
        token.email,
        token.tenantId,
        token.invitedByUserId,
        JSON.stringify(token.metadata),
        token.expiresAt,
        token.createdAt,
      ],
    );
  }

  async findByHash(tokenHash: string): Promise<InviteTokenRecord | null> {
    const result = await query<InviteTokenRow>(
      'SELECT * FROM invite_tokens WHERE token_hash = $1',
      [tokenHash],
    );
    return result.rows[0] ? rowToRecord(result.rows[0]) : null;
  }

  async markConsumed(id: string, consumedAt: Date): Promise<void> {
    await query(
      `UPDATE invite_tokens SET status = 'consumed', consumed_at = $1 WHERE id = $2`,
      [consumedAt, id],
    );
  }

  async findPendingByEmail(email: string, type: InviteType, tenantId: string): Promise<InviteTokenRecord[]> {
    const result = await query<InviteTokenRow>(
      `SELECT * FROM invite_tokens
       WHERE email = $1 AND type = $2 AND tenant_id = $3 AND status = 'pending' AND expires_at > NOW()
       ORDER BY created_at DESC`,
      [email, type, tenantId],
    );
    return result.rows.map(rowToRecord);
  }

  async countRecentByEmail(email: string, sinceDate: Date): Promise<number> {
    const result = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM invite_tokens WHERE email = $1 AND created_at >= $2',
      [email, sinceDate],
    );
    return parseInt(result.rows[0].count, 10);
  }

  async revokeByEmail(email: string, type: InviteType, tenantId: string): Promise<number> {
    const result = await query(
      `UPDATE invite_tokens SET status = 'revoked'
       WHERE email = $1 AND type = $2 AND tenant_id = $3 AND status = 'pending'`,
      [email, type, tenantId],
    );
    return result.rowCount ?? 0;
  }

  async listByTenantId(tenantId: string): Promise<InviteTokenRecord[]> {
    const result = await query<InviteTokenRow>(
      `SELECT * FROM invite_tokens WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 100`,
      [tenantId],
    );
    return result.rows.map(rowToRecord);
  }
}
