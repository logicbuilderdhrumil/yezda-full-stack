/**
 * OAuth Integration Repository
 * Task 1.1: Token storage and state persistence for OAuth flows
 */

import { query, getClient } from '../db/postgres.js';
import type {
  OAuthState,
  IntegrationToken,
  OAuthProvider,
} from '../models/oauth.model.js';

type OAuthStateRow = {
  id: string;
  tenant_id: string;
  user_id: string;
  user_type: 'user' | 'candidate';
  provider: string;
  redirect_url: string | null;
  expires_at: Date;
  created_at: Date;
};

type IntegrationTokenRow = {
  id: string;
  tenant_id: string;
  user_id: string;
  user_type: 'user' | 'candidate';
  provider: string;
  access_token_encrypted: string;
  refresh_token_encrypted: string | null;
  scopes: string;
  expires_at: Date;
  provider_account_id: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  last_refreshed_at: Date | null;
  last_refresh_error: string | null;
};

function rowToOAuthState(row: OAuthStateRow): OAuthState {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    userId: row.user_id,
    userType: row.user_type,
    provider: row.provider as OAuthProvider,
    redirectUrl: row.redirect_url ?? undefined,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

function rowToIntegrationToken(row: IntegrationTokenRow): IntegrationToken {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    userId: row.user_id,
    userType: row.user_type,
    provider: row.provider as OAuthProvider,
    accessTokenEncrypted: row.access_token_encrypted,
    refreshTokenEncrypted: row.refresh_token_encrypted ?? undefined,
    scopes: row.scopes ? row.scopes.split(',') : [],
    expiresAt: row.expires_at,
    providerAccountId: row.provider_account_id ?? undefined,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastRefreshedAt: row.last_refreshed_at ?? undefined,
    lastRefreshError: row.last_refresh_error ?? undefined,
  };
}

export class OAuthRepository {
  // ==================== OAUTH STATE (CSRF) ====================

  async createState(state: OAuthState): Promise<void> {
    await query(
      `INSERT INTO oauth_states (id, tenant_id, user_id, user_type, provider, redirect_url, expires_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        state.id,
        state.tenantId,
        state.userId,
        state.userType,
        state.provider,
        state.redirectUrl ?? null,
        state.expiresAt,
        state.createdAt,
      ]
    );
  }

  async findStateById(id: string): Promise<OAuthState | undefined> {
    const result = await query<OAuthStateRow>(
      'SELECT * FROM oauth_states WHERE id = $1',
      [id]
    );
    return result.rows[0] ? rowToOAuthState(result.rows[0]) : undefined;
  }

  async deleteState(id: string): Promise<void> {
    await query('DELETE FROM oauth_states WHERE id = $1', [id]);
  }

  async deleteExpiredStates(): Promise<number> {
    const result = await query(
      'DELETE FROM oauth_states WHERE expires_at < NOW()',
      []
    );
    return result.rowCount ?? 0;
  }

  /**
   * Consume state: find and delete atomically (one-time use)
   */
  async consumeState(id: string): Promise<OAuthState | undefined> {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      const result = await client.query<OAuthStateRow>(
        'SELECT * FROM oauth_states WHERE id = $1 FOR UPDATE',
        [id]
      );
      const row = result.rows[0];
      if (row) {
        await client.query('DELETE FROM oauth_states WHERE id = $1', [id]);
      }
      await client.query('COMMIT');
      return row ? rowToOAuthState(row) : undefined;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // ==================== INTEGRATION TOKENS ====================

  async upsertToken(token: IntegrationToken): Promise<void> {
    await query(
      `INSERT INTO integration_tokens 
        (id, tenant_id, user_id, user_type, provider, access_token_encrypted, refresh_token_encrypted, 
         scopes, expires_at, provider_account_id, is_active, created_at, updated_at, last_refreshed_at, last_refresh_error)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       ON CONFLICT (tenant_id, user_id, user_type, provider) 
       DO UPDATE SET
         access_token_encrypted = EXCLUDED.access_token_encrypted,
         refresh_token_encrypted = EXCLUDED.refresh_token_encrypted,
         scopes = EXCLUDED.scopes,
         expires_at = EXCLUDED.expires_at,
         provider_account_id = EXCLUDED.provider_account_id,
         is_active = EXCLUDED.is_active,
         updated_at = EXCLUDED.updated_at,
         last_refreshed_at = EXCLUDED.last_refreshed_at,
         last_refresh_error = EXCLUDED.last_refresh_error`,
      [
        token.id,
        token.tenantId,
        token.userId,
        token.userType,
        token.provider,
        token.accessTokenEncrypted,
        token.refreshTokenEncrypted ?? null,
        token.scopes.join(','),
        token.expiresAt,
        token.providerAccountId ?? null,
        token.isActive,
        token.createdAt,
        token.updatedAt,
        token.lastRefreshedAt ?? null,
        token.lastRefreshError ?? null,
      ]
    );
  }

  async findTokenById(id: string): Promise<IntegrationToken | undefined> {
    const result = await query<IntegrationTokenRow>(
      'SELECT * FROM integration_tokens WHERE id = $1',
      [id]
    );
    return result.rows[0] ? rowToIntegrationToken(result.rows[0]) : undefined;
  }

  async findToken(
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate',
    provider: OAuthProvider
  ): Promise<IntegrationToken | undefined> {
    const result = await query<IntegrationTokenRow>(
      `SELECT * FROM integration_tokens 
       WHERE tenant_id = $1 AND user_id = $2 AND user_type = $3 AND provider = $4`,
      [tenantId, userId, userType, provider]
    );
    return result.rows[0] ? rowToIntegrationToken(result.rows[0]) : undefined;
  }

  async findTokensByUser(
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate'
  ): Promise<IntegrationToken[]> {
    const result = await query<IntegrationTokenRow>(
      `SELECT * FROM integration_tokens 
       WHERE tenant_id = $1 AND user_id = $2 AND user_type = $3
       ORDER BY provider`,
      [tenantId, userId, userType]
    );
    return result.rows.map(rowToIntegrationToken);
  }

  async findActiveTokensByProvider(provider: OAuthProvider): Promise<IntegrationToken[]> {
    const result = await query<IntegrationTokenRow>(
      `SELECT * FROM integration_tokens 
       WHERE provider = $1 AND is_active = true
       ORDER BY expires_at ASC`,
      [provider]
    );
    return result.rows.map(rowToIntegrationToken);
  }

  async findExpiringTokens(thresholdMinutes: number): Promise<IntegrationToken[]> {
    const result = await query<IntegrationTokenRow>(
      `SELECT * FROM integration_tokens 
       WHERE is_active = true 
         AND refresh_token_encrypted IS NOT NULL
         AND expires_at < NOW() + ($1 || ' minutes')::interval
       ORDER BY expires_at ASC`,
      [thresholdMinutes.toString()]
    );
    return result.rows.map(rowToIntegrationToken);
  }

  async updateTokenRefresh(
    id: string,
    accessTokenEncrypted: string,
    expiresAt: Date,
    refreshTokenEncrypted?: string
  ): Promise<void> {
    const now = new Date();
    if (refreshTokenEncrypted !== undefined) {
      await query(
        `UPDATE integration_tokens SET
           access_token_encrypted = $2,
           refresh_token_encrypted = $3,
           expires_at = $4,
           updated_at = $5,
           last_refreshed_at = $5,
           last_refresh_error = NULL
         WHERE id = $1`,
        [id, accessTokenEncrypted, refreshTokenEncrypted, expiresAt, now]
      );
    } else {
      await query(
        `UPDATE integration_tokens SET
           access_token_encrypted = $2,
           expires_at = $3,
           updated_at = $4,
           last_refreshed_at = $4,
           last_refresh_error = NULL
         WHERE id = $1`,
        [id, accessTokenEncrypted, expiresAt, now]
      );
    }
  }

  async markTokenError(id: string, error: string): Promise<void> {
    const now = new Date();
    await query(
      `UPDATE integration_tokens SET
         last_refresh_error = $2,
         updated_at = $3
       WHERE id = $1`,
      [id, error, now]
    );
  }

  async deactivateToken(
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate',
    provider: OAuthProvider
  ): Promise<void> {
    const now = new Date();
    await query(
      `UPDATE integration_tokens SET
         is_active = false,
         updated_at = $5
       WHERE tenant_id = $1 AND user_id = $2 AND user_type = $3 AND provider = $4`,
      [tenantId, userId, userType, provider, now]
    );
  }

  async deleteToken(
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate',
    provider: OAuthProvider
  ): Promise<void> {
    await query(
      `DELETE FROM integration_tokens 
       WHERE tenant_id = $1 AND user_id = $2 AND user_type = $3 AND provider = $4`,
      [tenantId, userId, userType, provider]
    );
  }
}

export const oauthRepository = new OAuthRepository();
