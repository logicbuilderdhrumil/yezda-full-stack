/**
 * Account Settings Repository
 * Task 1.1: Profile and integration status persistence
 */

import { query, getClient } from '../db/postgres.js';
import type {
  UserProfile,
  IntegrationRecord,
  IntegrationProvider,
  ProfileUpdateRequest,
} from '../models/account-settings.model.js';

type UserProfileRow = {
  id: string;
  tenant_id: string;
  user_id: string;
  user_type: 'user' | 'candidate';
  display_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  timezone: string | null;
  locale: string | null;
  bio: string | null;
  notifications_enabled: boolean;
  email_notifications_enabled: boolean;
  created_at: Date;
  updated_at: Date;
};

type IntegrationRecordRow = {
  id: string;
  tenant_id: string;
  user_id: string;
  user_type: 'user' | 'candidate';
  provider: string;
  provider_account_id: string | null;
  provider_email: string | null;
  is_connected: boolean;
  is_verified: boolean;
  scopes: string;
  connected_at: Date | null;
  verified_at: Date | null;
  last_verification_error: string | null;
  created_at: Date;
  updated_at: Date;
};

function rowToUserProfile(row: UserProfileRow): UserProfile {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    userId: row.user_id,
    userType: row.user_type,
    displayName: row.display_name ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    phone: row.phone ?? undefined,
    timezone: row.timezone ?? undefined,
    locale: row.locale ?? undefined,
    bio: row.bio ?? undefined,
    notificationsEnabled: row.notifications_enabled,
    emailNotificationsEnabled: row.email_notifications_enabled,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToIntegrationRecord(row: IntegrationRecordRow): IntegrationRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    userId: row.user_id,
    userType: row.user_type,
    provider: row.provider as IntegrationProvider,
    providerAccountId: row.provider_account_id ?? undefined,
    providerEmail: row.provider_email ?? undefined,
    isConnected: row.is_connected,
    isVerified: row.is_verified,
    scopes: row.scopes ? row.scopes.split(',') : [],
    connectedAt: row.connected_at ?? undefined,
    verifiedAt: row.verified_at ?? undefined,
    lastVerificationError: row.last_verification_error ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class AccountSettingsRepository {
  // ==================== USER PROFILES ====================

  async createProfile(profile: UserProfile): Promise<void> {
    await query(
      `INSERT INTO user_profiles 
        (id, tenant_id, user_id, user_type, display_name, avatar_url, phone, timezone, locale, bio, 
         notifications_enabled, email_notifications_enabled, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        profile.id,
        profile.tenantId,
        profile.userId,
        profile.userType,
        profile.displayName ?? null,
        profile.avatarUrl ?? null,
        profile.phone ?? null,
        profile.timezone ?? null,
        profile.locale ?? null,
        profile.bio ?? null,
        profile.notificationsEnabled,
        profile.emailNotificationsEnabled,
        profile.createdAt,
        profile.updatedAt,
      ]
    );
  }

  async findProfileByUserId(
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate'
  ): Promise<UserProfile | undefined> {
    const result = await query<UserProfileRow>(
      `SELECT * FROM user_profiles 
       WHERE tenant_id = $1 AND user_id = $2 AND user_type = $3`,
      [tenantId, userId, userType]
    );
    return result.rows[0] ? rowToUserProfile(result.rows[0]) : undefined;
  }

  async findProfileById(id: string): Promise<UserProfile | undefined> {
    const result = await query<UserProfileRow>(
      'SELECT * FROM user_profiles WHERE id = $1',
      [id]
    );
    return result.rows[0] ? rowToUserProfile(result.rows[0]) : undefined;
  }

  async updateProfile(
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate',
    updates: ProfileUpdateRequest
  ): Promise<UserProfile | undefined> {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Build dynamic update query
      const setClauses: string[] = [];
      const values: unknown[] = [];
      let paramIndex = 4;

      if (updates.displayName !== undefined) {
        setClauses.push(`display_name = $${paramIndex++}`);
        values.push(updates.displayName);
      }
      if (updates.avatarUrl !== undefined) {
        setClauses.push(`avatar_url = $${paramIndex++}`);
        values.push(updates.avatarUrl);
      }
      if (updates.phone !== undefined) {
        setClauses.push(`phone = $${paramIndex++}`);
        values.push(updates.phone);
      }
      if (updates.timezone !== undefined) {
        setClauses.push(`timezone = $${paramIndex++}`);
        values.push(updates.timezone);
      }
      if (updates.locale !== undefined) {
        setClauses.push(`locale = $${paramIndex++}`);
        values.push(updates.locale);
      }
      if (updates.bio !== undefined) {
        setClauses.push(`bio = $${paramIndex++}`);
        values.push(updates.bio);
      }
      if (updates.notificationsEnabled !== undefined) {
        setClauses.push(`notifications_enabled = $${paramIndex++}`);
        values.push(updates.notificationsEnabled);
      }
      if (updates.emailNotificationsEnabled !== undefined) {
        setClauses.push(`email_notifications_enabled = $${paramIndex++}`);
        values.push(updates.emailNotificationsEnabled);
      }

      if (setClauses.length === 0) {
        await client.query('ROLLBACK');
        return this.findProfileByUserId(tenantId, userId, userType);
      }

      setClauses.push(`updated_at = $${paramIndex++}`);
      values.push(new Date());

      const result = await client.query<UserProfileRow>(
        `UPDATE user_profiles SET ${setClauses.join(', ')}
         WHERE tenant_id = $1 AND user_id = $2 AND user_type = $3
         RETURNING *`,
        [tenantId, userId, userType, ...values]
      );

      await client.query('COMMIT');
      return result.rows[0] ? rowToUserProfile(result.rows[0]) : undefined;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async upsertProfile(profile: UserProfile): Promise<UserProfile> {
    const result = await query<UserProfileRow>(
      `INSERT INTO user_profiles 
        (id, tenant_id, user_id, user_type, display_name, avatar_url, phone, timezone, locale, bio, 
         notifications_enabled, email_notifications_enabled, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       ON CONFLICT (tenant_id, user_id, user_type)
       DO UPDATE SET
         display_name = EXCLUDED.display_name,
         avatar_url = EXCLUDED.avatar_url,
         phone = EXCLUDED.phone,
         timezone = EXCLUDED.timezone,
         locale = EXCLUDED.locale,
         bio = EXCLUDED.bio,
         notifications_enabled = EXCLUDED.notifications_enabled,
         email_notifications_enabled = EXCLUDED.email_notifications_enabled,
         updated_at = EXCLUDED.updated_at
       RETURNING *`,
      [
        profile.id,
        profile.tenantId,
        profile.userId,
        profile.userType,
        profile.displayName ?? null,
        profile.avatarUrl ?? null,
        profile.phone ?? null,
        profile.timezone ?? null,
        profile.locale ?? null,
        profile.bio ?? null,
        profile.notificationsEnabled,
        profile.emailNotificationsEnabled,
        profile.createdAt,
        profile.updatedAt,
      ]
    );
    return rowToUserProfile(result.rows[0]);
  }

  // ==================== INTEGRATION RECORDS ====================

  async createIntegration(record: IntegrationRecord): Promise<void> {
    await query(
      `INSERT INTO integration_records 
        (id, tenant_id, user_id, user_type, provider, provider_account_id, provider_email,
         is_connected, is_verified, scopes, connected_at, verified_at, last_verification_error,
         created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        record.id,
        record.tenantId,
        record.userId,
        record.userType,
        record.provider,
        record.providerAccountId ?? null,
        record.providerEmail ?? null,
        record.isConnected,
        record.isVerified,
        record.scopes.join(','),
        record.connectedAt ?? null,
        record.verifiedAt ?? null,
        record.lastVerificationError ?? null,
        record.createdAt,
        record.updatedAt,
      ]
    );
  }

  async findIntegration(
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate',
    provider: IntegrationProvider
  ): Promise<IntegrationRecord | undefined> {
    const result = await query<IntegrationRecordRow>(
      `SELECT * FROM integration_records 
       WHERE tenant_id = $1 AND user_id = $2 AND user_type = $3 AND provider = $4`,
      [tenantId, userId, userType, provider]
    );
    return result.rows[0] ? rowToIntegrationRecord(result.rows[0]) : undefined;
  }

  async findIntegrationsByUser(
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate'
  ): Promise<IntegrationRecord[]> {
    const result = await query<IntegrationRecordRow>(
      `SELECT * FROM integration_records 
       WHERE tenant_id = $1 AND user_id = $2 AND user_type = $3
       ORDER BY provider`,
      [tenantId, userId, userType]
    );
    return result.rows.map(rowToIntegrationRecord);
  }

  async upsertIntegration(record: IntegrationRecord): Promise<IntegrationRecord> {
    const result = await query<IntegrationRecordRow>(
      `INSERT INTO integration_records 
        (id, tenant_id, user_id, user_type, provider, provider_account_id, provider_email,
         is_connected, is_verified, scopes, connected_at, verified_at, last_verification_error,
         created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       ON CONFLICT (tenant_id, user_id, user_type, provider)
       DO UPDATE SET
         provider_account_id = EXCLUDED.provider_account_id,
         provider_email = EXCLUDED.provider_email,
         is_connected = EXCLUDED.is_connected,
         is_verified = EXCLUDED.is_verified,
         scopes = EXCLUDED.scopes,
         connected_at = EXCLUDED.connected_at,
         verified_at = EXCLUDED.verified_at,
         last_verification_error = EXCLUDED.last_verification_error,
         updated_at = EXCLUDED.updated_at
       RETURNING *`,
      [
        record.id,
        record.tenantId,
        record.userId,
        record.userType,
        record.provider,
        record.providerAccountId ?? null,
        record.providerEmail ?? null,
        record.isConnected,
        record.isVerified,
        record.scopes.join(','),
        record.connectedAt ?? null,
        record.verifiedAt ?? null,
        record.lastVerificationError ?? null,
        record.createdAt,
        record.updatedAt,
      ]
    );
    return rowToIntegrationRecord(result.rows[0]);
  }

  async updateIntegrationStatus(
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate',
    provider: IntegrationProvider,
    updates: Partial<Pick<IntegrationRecord, 'isConnected' | 'isVerified' | 'providerAccountId' | 'providerEmail' | 'scopes' | 'connectedAt' | 'verifiedAt' | 'lastVerificationError'>>
  ): Promise<IntegrationRecord | undefined> {
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 5;

    if (updates.isConnected !== undefined) {
      setClauses.push(`is_connected = $${paramIndex++}`);
      values.push(updates.isConnected);
    }
    if (updates.isVerified !== undefined) {
      setClauses.push(`is_verified = $${paramIndex++}`);
      values.push(updates.isVerified);
    }
    if (updates.providerAccountId !== undefined) {
      setClauses.push(`provider_account_id = $${paramIndex++}`);
      values.push(updates.providerAccountId);
    }
    if (updates.providerEmail !== undefined) {
      setClauses.push(`provider_email = $${paramIndex++}`);
      values.push(updates.providerEmail);
    }
    if (updates.scopes !== undefined) {
      setClauses.push(`scopes = $${paramIndex++}`);
      values.push(updates.scopes.join(','));
    }
    if (updates.connectedAt !== undefined) {
      setClauses.push(`connected_at = $${paramIndex++}`);
      values.push(updates.connectedAt);
    }
    if (updates.verifiedAt !== undefined) {
      setClauses.push(`verified_at = $${paramIndex++}`);
      values.push(updates.verifiedAt);
    }
    if (updates.lastVerificationError !== undefined) {
      setClauses.push(`last_verification_error = $${paramIndex++}`);
      values.push(updates.lastVerificationError);
    }

    if (setClauses.length === 0) {
      return this.findIntegration(tenantId, userId, userType, provider);
    }

    setClauses.push(`updated_at = $${paramIndex++}`);
    values.push(new Date());

    const result = await query<IntegrationRecordRow>(
      `UPDATE integration_records SET ${setClauses.join(', ')}
       WHERE tenant_id = $1 AND user_id = $2 AND user_type = $3 AND provider = $4
       RETURNING *`,
      [tenantId, userId, userType, provider, ...values]
    );
    return result.rows[0] ? rowToIntegrationRecord(result.rows[0]) : undefined;
  }

  async disconnectIntegration(
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate',
    provider: IntegrationProvider
  ): Promise<void> {
    await query(
      `UPDATE integration_records SET
         is_connected = false,
         is_verified = false,
         updated_at = $5
       WHERE tenant_id = $1 AND user_id = $2 AND user_type = $3 AND provider = $4`,
      [tenantId, userId, userType, provider, new Date()]
    );
  }

  async deleteIntegration(
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate',
    provider: IntegrationProvider
  ): Promise<void> {
    await query(
      `DELETE FROM integration_records 
       WHERE tenant_id = $1 AND user_id = $2 AND user_type = $3 AND provider = $4`,
      [tenantId, userId, userType, provider]
    );
  }
}

export const accountSettingsRepository = new AccountSettingsRepository();
