/**
 * User Management Repository
 * Task 1.2, 1.3: Persistence layer for user management operations
 * Enforces tenant isolation at the database query level.
 */

import { query } from '../db/postgres.js';
import type {
  ManagedUser,
  CreateUserInput,
  UpdateUserInput,
  UserSearchParams,
  UserListResult,
  UserStatus,
} from '../models/user-management.model.js';
import type { UserRole } from '../middleware/route-guards.middleware.js';

type ManagedUserRow = {
  id: string;
  email: string;
  password_hash: string | null;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  status: UserStatus;
  roles: UserRole[];
  tenant_id: string;
  user_space: string;
  mfa_enabled: boolean;
  locked_until: Date | null;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
  created_by: string | null;
  updated_by: string | null;
};

function rowToManagedUser(row: ManagedUserRow): ManagedUser {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name ?? undefined,
    firstName: row.first_name ?? undefined,
    lastName: row.last_name ?? undefined,
    status: row.status,
    roles: row.roles,
    tenantId: row.tenant_id,
    userSpace: row.user_space as 'platform' | 'organization',
    mfaEnabled: row.mfa_enabled,
    lockedUntil: row.locked_until ?? undefined,
    lastLoginAt: row.last_login_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by ?? undefined,
    updatedBy: row.updated_by ?? undefined,
  };
}

export class UserManagementRepository {
  /**
   * Create a new managed user
   */
  async create(input: CreateUserInput & { id: string; createdBy?: string; passwordHash?: string }): Promise<ManagedUser> {
    const now = new Date();
    const result = await query<ManagedUserRow>(
      `INSERT INTO managed_users 
       (id, email, password_hash, display_name, first_name, last_name, status, roles, tenant_id, user_space, mfa_enabled, created_at, updated_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        input.id,
        input.email.toLowerCase(),
        input.passwordHash ?? null,
        input.displayName ?? null,
        input.firstName ?? null,
        input.lastName ?? null,
        input.status ?? 'pending',
        input.roles,
        input.tenantId,
        input.userSpace,
        false,
        now,
        now,
        input.createdBy ?? null,
      ]
    );

    return rowToManagedUser(result.rows[0]);
  }

  /**
   * Find user by ID with tenant scoping
   */
  async findById(id: string, tenantId: string): Promise<ManagedUser | undefined> {
    const result = await query<ManagedUserRow>(
      'SELECT * FROM managed_users WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    return result.rows[0] ? rowToManagedUser(result.rows[0]) : undefined;
  }

  /**
   * Find user by ID without tenant scoping.
   * Used for authenticated user profile lookup (/me endpoint).
   * Safe because user is already authenticated via JWT.
   */
  async findByIdWithoutTenantScope(id: string): Promise<ManagedUser | undefined> {
    const result = await query<ManagedUserRow>(
      'SELECT * FROM managed_users WHERE id = $1',
      [id]
    );
    return result.rows[0] ? rowToManagedUser(result.rows[0]) : undefined;
  }

  /**
   * Find user by email with tenant scoping
   */
  async findByEmail(email: string, tenantId: string): Promise<ManagedUser | undefined> {
    const result = await query<ManagedUserRow>(
      'SELECT * FROM managed_users WHERE LOWER(email) = LOWER($1) AND tenant_id = $2',
      [email, tenantId]
    );
    return result.rows[0] ? rowToManagedUser(result.rows[0]) : undefined;
  }

  /**
   * Check if email exists within tenant
   */
  async emailExists(email: string, tenantId: string): Promise<boolean> {
    const result = await query<{ exists: boolean }>(
      'SELECT EXISTS(SELECT 1 FROM managed_users WHERE LOWER(email) = LOWER($1) AND tenant_id = $2) as exists',
      [email, tenantId]
    );
    return result.rows[0]?.exists ?? false;
  }

  /**
   * Update user with tenant scoping
   */
  async update(
    id: string,
    tenantId: string,
    input: UpdateUserInput & { updatedBy?: string }
  ): Promise<ManagedUser | undefined> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (input.displayName !== undefined) {
      updates.push(`display_name = $${paramIndex++}`);
      values.push(input.displayName);
    }
    if (input.firstName !== undefined) {
      updates.push(`first_name = $${paramIndex++}`);
      values.push(input.firstName);
    }
    if (input.lastName !== undefined) {
      updates.push(`last_name = $${paramIndex++}`);
      values.push(input.lastName);
    }
    if (input.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(input.status);
    }
    if (input.roles !== undefined) {
      updates.push(`roles = $${paramIndex++}`);
      values.push(input.roles);
    }

    updates.push(`updated_at = $${paramIndex++}`);
    values.push(new Date());

    if (input.updatedBy !== undefined) {
      updates.push(`updated_by = $${paramIndex++}`);
      values.push(input.updatedBy);
    }

    // Add id and tenantId as the last parameters
    values.push(id, tenantId);

    const result = await query<ManagedUserRow>(
      `UPDATE managed_users SET ${updates.join(', ')}
       WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex}
       RETURNING *`,
      values
    );

    return result.rows[0] ? rowToManagedUser(result.rows[0]) : undefined;
  }

  /**
   * List and search users with pagination and tenant scoping
   */
  async search(params: UserSearchParams): Promise<UserListResult> {
    const {
      tenantId,
      query: searchQuery,
      status,
      role,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const conditions: string[] = ['tenant_id = $1'];
    const values: unknown[] = [tenantId];
    let paramIndex = 2;

    if (searchQuery) {
      conditions.push(
        `(LOWER(email) LIKE $${paramIndex} OR LOWER(display_name) LIKE $${paramIndex} OR LOWER(first_name) LIKE $${paramIndex} OR LOWER(last_name) LIKE $${paramIndex})`
      );
      values.push(`%${searchQuery.toLowerCase()}%`);
      paramIndex++;
    }

    if (status) {
      conditions.push(`status = $${paramIndex++}`);
      values.push(status);
    }

    if (role) {
      conditions.push(`$${paramIndex++} = ANY(roles)`);
      values.push(role);
    }

    if (params.userSpace) {
      conditions.push(`user_space = $${paramIndex++}`);
      values.push(params.userSpace);
    }

    const whereClause = conditions.join(' AND ');

    // Map sortBy to database column names
    const sortColumnMap: Record<string, string> = {
      email: 'email',
      displayName: 'display_name',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    };
    const sortColumn = sortColumnMap[sortBy] || 'created_at';
    const order = sortOrder === 'asc' ? 'ASC' : 'DESC';

    // Get total count
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM managed_users WHERE ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

    // Get paginated results
    const offset = (page - 1) * limit;
    values.push(limit, offset);

    const result = await query<ManagedUserRow>(
      `SELECT * FROM managed_users 
       WHERE ${whereClause}
       ORDER BY ${sortColumn} ${order}
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      values
    );

    return {
      users: result.rows.map(rowToManagedUser),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Soft delete user (set status to 'inactive')
   */
  async softDelete(id: string, tenantId: string, deletedBy?: string): Promise<boolean> {
    const result = await query(
      `UPDATE managed_users 
       SET status = 'inactive', updated_at = $1, updated_by = $2
       WHERE id = $3 AND tenant_id = $4`,
      [new Date(), deletedBy ?? null, id, tenantId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Update user status
   */
  async updateStatus(
    id: string,
    tenantId: string,
    status: UserStatus,
    updatedBy?: string
  ): Promise<ManagedUser | undefined> {
    return this.update(id, tenantId, { status, updatedBy });
  }

  /**
   * Update user roles
   */
  async updateRoles(
    id: string,
    tenantId: string,
    roles: UserRole[],
    updatedBy?: string
  ): Promise<ManagedUser | undefined> {
    return this.update(id, tenantId, { roles, updatedBy });
  }
}

export const userManagementRepository = new UserManagementRepository();
