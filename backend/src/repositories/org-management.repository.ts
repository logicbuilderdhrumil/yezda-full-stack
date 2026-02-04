/**
 * Organization Repository
 * Task 1.2, 1.3: Postgres persistence for organizations
 */

import { query } from '../db/postgres.js';
import type {
  Organization,
  CreateOrganizationInput,
  UpdateOrganizationInput,
  OrganizationFilters,
  OrganizationPaginationOptions,
  OrganizationSettings,
} from '../models/org-management.model.js';
import { DEFAULT_ORG_SETTINGS, generateSlug } from '../models/org-management.model.js';
import { randomUUID } from 'crypto';

type OrganizationRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: Organization['status'];
  plan: Organization['plan'];
  logo_url: string | null;
  website: string | null;
  primary_contact_email: string;
  primary_contact_name: string | null;
  metadata: Record<string, unknown> | null;
  settings: OrganizationSettings | null;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  updated_by: string | null;
};

function rowToOrganization(row: OrganizationRow): Organization {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? undefined,
    status: row.status,
    plan: row.plan,
    logoUrl: row.logo_url ?? undefined,
    website: row.website ?? undefined,
    primaryContactEmail: row.primary_contact_email,
    primaryContactName: row.primary_contact_name ?? undefined,
    metadata: row.metadata ?? undefined,
    settings: row.settings ?? DEFAULT_ORG_SETTINGS,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by ?? undefined,
  };
}

export class OrganizationRepository {
  /**
   * Create a new organization
   */
  async create(input: CreateOrganizationInput): Promise<Organization> {
    const id = randomUUID();
    const now = new Date();
    const slug = input.slug || generateSlug(input.name);
    const settings = { ...DEFAULT_ORG_SETTINGS, ...input.settings };

    const result = await query<OrganizationRow>(
      `INSERT INTO organizations (
        id, name, slug, description, status, plan, logo_url, website, 
        primary_contact_email, primary_contact_name, metadata, settings, 
        created_at, updated_at, created_by
      )
       VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8, $9, $10, $11, $12, $12, $13)
       RETURNING *`,
      [
        id,
        input.name,
        slug,
        input.description ?? null,
        input.plan ?? 'free',
        input.logoUrl ?? null,
        input.website ?? null,
        input.primaryContactEmail,
        input.primaryContactName ?? null,
        input.metadata ? JSON.stringify(input.metadata) : null,
        JSON.stringify(settings),
        now,
        input.createdBy,
      ]
    );

    return rowToOrganization(result.rows[0]);
  }

  /**
   * Find organization by ID
   */
  async findById(id: string): Promise<Organization | undefined> {
    const result = await query<OrganizationRow>(
      'SELECT * FROM organizations WHERE id = $1',
      [id]
    );
    return result.rows[0] ? rowToOrganization(result.rows[0]) : undefined;
  }

  /**
   * Find organization by slug
   */
  async findBySlug(slug: string): Promise<Organization | undefined> {
    const result = await query<OrganizationRow>(
      'SELECT * FROM organizations WHERE slug = $1',
      [slug]
    );
    return result.rows[0] ? rowToOrganization(result.rows[0]) : undefined;
  }

  /**
   * Check if slug already exists
   */
  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    const result = await query<{ exists: boolean }>(
      `SELECT EXISTS(
        SELECT 1 FROM organizations 
        WHERE slug = $1 ${excludeId ? 'AND id != $2' : ''}
      ) as exists`,
      excludeId ? [slug, excludeId] : [slug]
    );
    return result.rows[0]?.exists ?? false;
  }

  /**
   * List organizations with filters and pagination
   */
  async list(
    filters: OrganizationFilters = {},
    pagination: OrganizationPaginationOptions = {}
  ): Promise<{ organizations: Organization[]; total: number }> {
    const limit = Math.min(pagination.limit ?? 20, 100);
    const offset = pagination.offset ?? 0;
    const sortBy = pagination.sortBy ?? 'createdAt';
    const sortOrder = pagination.sortOrder ?? 'desc';

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filters.status) {
      conditions.push(`status = $${paramIndex}`);
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.plan) {
      conditions.push(`plan = $${paramIndex}`);
      params.push(filters.plan);
      paramIndex++;
    }

    if (filters.search) {
      conditions.push(`(name ILIKE $${paramIndex} OR slug ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    if (filters.createdAfter) {
      conditions.push(`created_at >= $${paramIndex}`);
      params.push(filters.createdAfter);
      paramIndex++;
    }

    if (filters.createdBefore) {
      conditions.push(`created_at <= $${paramIndex}`);
      params.push(filters.createdBefore);
      paramIndex++;
    }

    if (pagination.cursor) {
      const cursorOp = sortOrder === 'desc' ? '<' : '>';
      conditions.push(`created_at ${cursorOp} $${paramIndex}`);
      params.push(new Date(pagination.cursor));
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Map sortBy to column names
    const sortColumn = sortBy === 'createdAt' ? 'created_at' : sortBy === 'updatedAt' ? 'updated_at' : 'name';
    const orderClause = `ORDER BY ${sortColumn} ${sortOrder.toUpperCase()}`;

    // Get total count (without cursor filter for accurate pagination)
    const countConditions = conditions.filter((_, i) => !pagination.cursor || i < conditions.length - 1);
    const countParams = pagination.cursor ? params.slice(0, -1) : params;
    const countWhereClause = countConditions.length > 0 ? `WHERE ${countConditions.join(' AND ')}` : '';

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM organizations ${countWhereClause}`,
      countParams
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Get paginated results
    params.push(limit + 1); // Fetch one extra to determine hasMore
    params.push(offset);

    const result = await query<OrganizationRow>(
      `SELECT * FROM organizations ${whereClause} ${orderClause} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    const organizations = result.rows.slice(0, limit).map(rowToOrganization);

    return { organizations, total };
  }

  /**
   * Update an organization
   */
  async update(id: string, input: UpdateOrganizationInput): Promise<Organization | undefined> {
    const updates: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (input.name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      params.push(input.name);
      paramIndex++;
    }

    if (input.description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      params.push(input.description);
      paramIndex++;
    }

    if (input.status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      params.push(input.status);
      paramIndex++;
    }

    if (input.plan !== undefined) {
      updates.push(`plan = $${paramIndex}`);
      params.push(input.plan);
      paramIndex++;
    }

    if (input.logoUrl !== undefined) {
      updates.push(`logo_url = $${paramIndex}`);
      params.push(input.logoUrl);
      paramIndex++;
    }

    if (input.website !== undefined) {
      updates.push(`website = $${paramIndex}`);
      params.push(input.website);
      paramIndex++;
    }

    if (input.primaryContactEmail !== undefined) {
      updates.push(`primary_contact_email = $${paramIndex}`);
      params.push(input.primaryContactEmail);
      paramIndex++;
    }

    if (input.primaryContactName !== undefined) {
      updates.push(`primary_contact_name = $${paramIndex}`);
      params.push(input.primaryContactName);
      paramIndex++;
    }

    if (input.settings !== undefined) {
      // Merge with existing settings
      updates.push(`settings = COALESCE(settings, '{}'::jsonb) || $${paramIndex}::jsonb`);
      params.push(JSON.stringify(input.settings));
      paramIndex++;
    }

    if (input.metadata !== undefined) {
      updates.push(`metadata = $${paramIndex}`);
      params.push(JSON.stringify(input.metadata));
      paramIndex++;
    }

    // Always update updated_at and updated_by
    updates.push(`updated_at = $${paramIndex}`);
    params.push(new Date());
    paramIndex++;

    updates.push(`updated_by = $${paramIndex}`);
    params.push(input.updatedBy);
    paramIndex++;

    params.push(id);

    if (updates.length === 2) {
      // Only updated_at and updated_by - nothing else to update
      return this.findById(id);
    }

    const result = await query<OrganizationRow>(
      `UPDATE organizations SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    return result.rows[0] ? rowToOrganization(result.rows[0]) : undefined;
  }

  /**
   * Soft delete an organization (set status to archived)
   */
  async archive(id: string, updatedBy: string): Promise<Organization | undefined> {
    return this.update(id, { status: 'archived', updatedBy });
  }

  /**
   * Hard delete an organization
   */
  async delete(id: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM organizations WHERE id = $1',
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Count organizations by status
   */
  async countByStatus(status: Organization['status']): Promise<number> {
    const result = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM organizations WHERE status = $1',
      [status]
    );
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Get organizations by IDs
   */
  async findByIds(ids: string[]): Promise<Organization[]> {
    if (ids.length === 0) return [];

    const result = await query<OrganizationRow>(
      'SELECT * FROM organizations WHERE id = ANY($1)',
      [ids]
    );
    return result.rows.map(rowToOrganization);
  }
}

export const organizationRepository = new OrganizationRepository();
