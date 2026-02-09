/**
 * Postgres Org Management Repository
 *
 * Implements IOrgManagementRepository using PostgreSQL via shared infrastructure.
 */
import type { IOrgManagementRepository } from '../../domain/ports/org-management-repository.port.js';
import type {
  Organization,
  OrganizationStatus,
  OrgFilters,
  OrgPaginationOptions,
  OrgListResult,
} from '../../domain/entities/org-management.entity.js';
import { query } from '../../../../shared/infrastructure/database/index.js';

interface OrgRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: OrganizationStatus;
  plan: string;
  logo_url: string | null;
  website: string | null;
  primary_contact_email: string;
  primary_contact_name: string | null;
  metadata: Record<string, unknown> | null;
  settings: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  updated_by: string | null;
}

function rowToOrg(row: OrgRow): Organization {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? undefined,
    status: row.status,
    plan: row.plan as Organization['plan'],
    logoUrl: row.logo_url ?? undefined,
    website: row.website ?? undefined,
    primaryContactEmail: row.primary_contact_email,
    primaryContactName: row.primary_contact_name ?? undefined,
    metadata: row.metadata ?? undefined,
    settings: row.settings as unknown as Organization['settings'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by ?? undefined,
  };
}

export class PostgresOrgManagementRepository implements IOrgManagementRepository {
  async findAll(filters: OrgFilters, pagination: OrgPaginationOptions): Promise<OrgListResult> {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (filters.status) { conditions.push(`status = $${idx++}`); values.push(filters.status); }
    if (filters.plan) { conditions.push(`plan = $${idx++}`); values.push(filters.plan); }
    if (filters.search) {
      conditions.push(`(LOWER(name) LIKE $${idx} OR LOWER(description) LIKE $${idx})`);
      values.push(`%${filters.search.toLowerCase()}%`);
      idx++;
    }
    if (filters.createdAfter) { conditions.push(`created_at >= $${idx++}`); values.push(filters.createdAfter); }
    if (filters.createdBefore) { conditions.push(`created_at <= $${idx++}`); values.push(filters.createdBefore); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sortCol = pagination.sortBy === 'name' ? 'name' : pagination.sortBy === 'updatedAt' ? 'updated_at' : 'created_at';
    const order = pagination.sortOrder === 'asc' ? 'ASC' : 'DESC';
    const limit = Math.min(pagination.limit ?? 20, 100);
    const offset = pagination.offset ?? 0;

    const countResult = await query<{ count: string }>(`SELECT COUNT(*) as count FROM organizations ${where}`, values);
    const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

    const listValues = [...values, limit + 1, offset];
    const result = await query<OrgRow>(
      `SELECT * FROM organizations ${where} ORDER BY ${sortCol} ${order} LIMIT $${idx++} OFFSET $${idx}`,
      listValues,
    );

    const hasMore = result.rows.length > limit;
    const orgs = hasMore ? result.rows.slice(0, limit).map(rowToOrg) : result.rows.map(rowToOrg);
    const nextCursor = hasMore && orgs.length > 0 ? orgs[orgs.length - 1].createdAt.toISOString() : undefined;

    return { organizations: orgs, total, hasMore, nextCursor };
  }

  async findById(id: string): Promise<Organization | undefined> {
    const result = await query<OrgRow>('SELECT * FROM organizations WHERE id = $1', [id]);
    return result.rows[0] ? rowToOrg(result.rows[0]) : undefined;
  }

  async findBySlug(slug: string): Promise<Organization | undefined> {
    const result = await query<OrgRow>('SELECT * FROM organizations WHERE slug = $1', [slug]);
    return result.rows[0] ? rowToOrg(result.rows[0]) : undefined;
  }

  async slugExists(slug: string): Promise<boolean> {
    const result = await query<{ exists: boolean }>(
      'SELECT EXISTS(SELECT 1 FROM organizations WHERE slug = $1) as exists',
      [slug],
    );
    return result.rows[0]?.exists ?? false;
  }

  async create(org: Organization): Promise<Organization> {
    const result = await query<OrgRow>(
      `INSERT INTO organizations (id, name, slug, description, status, plan, logo_url, website, primary_contact_email, primary_contact_name, metadata, settings, created_at, updated_at, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [org.id, org.name, org.slug, org.description ?? null, org.status, org.plan, org.logoUrl ?? null, org.website ?? null, org.primaryContactEmail, org.primaryContactName ?? null, org.metadata ?? null, org.settings ?? null, org.createdAt, org.updatedAt, org.createdBy],
    );
    return rowToOrg(result.rows[0]);
  }

  async update(id: string, data: Partial<Organization>): Promise<Organization | undefined> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.name !== undefined) { updates.push(`name = $${idx++}`); values.push(data.name); }
    if (data.description !== undefined) { updates.push(`description = $${idx++}`); values.push(data.description); }
    if (data.status !== undefined) { updates.push(`status = $${idx++}`); values.push(data.status); }
    if (data.plan !== undefined) { updates.push(`plan = $${idx++}`); values.push(data.plan); }
    if (data.logoUrl !== undefined) { updates.push(`logo_url = $${idx++}`); values.push(data.logoUrl); }
    if (data.website !== undefined) { updates.push(`website = $${idx++}`); values.push(data.website); }
    if (data.primaryContactEmail !== undefined) { updates.push(`primary_contact_email = $${idx++}`); values.push(data.primaryContactEmail); }
    if (data.primaryContactName !== undefined) { updates.push(`primary_contact_name = $${idx++}`); values.push(data.primaryContactName); }
    if (data.settings !== undefined) { updates.push(`settings = $${idx++}`); values.push(JSON.stringify(data.settings)); }
    if (data.metadata !== undefined) { updates.push(`metadata = $${idx++}`); values.push(JSON.stringify(data.metadata)); }
    if (data.updatedBy !== undefined) { updates.push(`updated_by = $${idx++}`); values.push(data.updatedBy); }

    updates.push(`updated_at = $${idx++}`);
    values.push(data.updatedAt ?? new Date());
    values.push(id);

    if (updates.length === 0) return this.findById(id);

    const result = await query<OrgRow>(
      `UPDATE organizations SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values,
    );
    return result.rows[0] ? rowToOrg(result.rows[0]) : undefined;
  }

  async updateStatus(id: string, status: OrganizationStatus, updatedBy: string): Promise<Organization | undefined> {
    return this.update(id, { status, updatedBy, updatedAt: new Date() } as Partial<Organization>);
  }

  async softDelete(id: string, updatedBy: string): Promise<boolean> {
    const result = await query(
      'UPDATE organizations SET status = $1, updated_at = $2, updated_by = $3 WHERE id = $4',
      ['archived', new Date(), updatedBy, id],
    );
    return (result.rowCount ?? 0) > 0;
  }
}
