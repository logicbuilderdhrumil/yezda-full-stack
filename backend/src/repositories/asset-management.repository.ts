/**
 * Asset Management Repository
 * Task 1.1: Define asset metadata model and storage strategy
 * Uses PostgreSQL for durable persistence
 */

import { randomUUID } from 'crypto';
import { query } from '../db/postgres.js';
import type {
  AssetMetadata,
  TemplateAsset,
  AssetType,
  AssetUsage,
  AssetQueryFilters,
  TemplateType,
} from '../models/asset-management.model.js';

/** Database row type for assets table */
interface AssetRow {
  id: string;
  tenant_id: string;
  type: AssetType;
  usage: AssetUsage;
  name: string;
  description: string | null;
  path: string;
  mime_type: string;
  size: number;
  tags: string[];
  created_at: Date;
  updated_at: Date;
  created_by: string | null;
  version: string | null;
  // Template-specific fields
  template_type: TemplateType | null;
  template_variables: string[] | null;
  locale: string | null;
}

/**
 * Convert database row to AssetMetadata model
 */
function rowToAssetMetadata(row: AssetRow): AssetMetadata {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    type: row.type,
    usage: row.usage,
    name: row.name,
    description: row.description ?? undefined,
    path: row.path,
    mimeType: row.mime_type,
    size: row.size,
    tags: row.tags ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by ?? undefined,
    version: row.version ?? undefined,
  };
}

/**
 * Convert database row to TemplateAsset model
 */
function rowToTemplateAsset(row: AssetRow): TemplateAsset {
  return {
    ...rowToAssetMetadata(row),
    type: 'template',
    templateType: row.template_type ?? 'document',
    variables: row.template_variables ?? [],
    locale: row.locale ?? undefined,
  };
}

export class AssetManagementRepository {
  /**
   * Find an asset by ID and tenant
   */
  async findById(tenantId: string, assetId: string): Promise<AssetMetadata | null> {
    const result = await query<AssetRow>(
      `SELECT * FROM assets 
       WHERE tenant_id = $1 AND id = $2`,
      [tenantId, assetId]
    );
    if (!result.rows[0]) return null;

    const row = result.rows[0];
    return row.type === 'template' ? rowToTemplateAsset(row) : rowToAssetMetadata(row);
  }

  /**
   * Find assets by type and optionally usage
   */
  async findByType(
    tenantId: string,
    type: AssetType,
    usage?: AssetUsage,
    limit = 50,
    offset = 0
  ): Promise<AssetMetadata[]> {
    let sql = `SELECT * FROM assets WHERE tenant_id = $1 AND type = $2`;
    const params: unknown[] = [tenantId, type];

    if (usage) {
      sql += ` AND usage = $3`;
      params.push(usage);
    }

    sql += ` ORDER BY name ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query<AssetRow>(sql, params);
    return result.rows.map((row: AssetRow) =>
      row.type === 'template' ? rowToTemplateAsset(row) : rowToAssetMetadata(row)
    );
  }

  /**
   * Find assets matching query filters
   */
  async findByFilters(tenantId: string, filters: AssetQueryFilters): Promise<AssetMetadata[]> {
    const conditions: string[] = ['tenant_id = $1'];
    const params: unknown[] = [tenantId];
    let paramIndex = 2;

    if (filters.type) {
      conditions.push(`type = $${paramIndex++}`);
      params.push(filters.type);
    }

    if (filters.usage) {
      conditions.push(`usage = $${paramIndex++}`);
      params.push(filters.usage);
    }

    if (filters.tags && filters.tags.length > 0) {
      conditions.push(`tags && $${paramIndex++}`);
      params.push(filters.tags);
    }

    if (filters.search) {
      conditions.push(`(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    const limit = filters.limit ?? 50;
    const offset = filters.offset ?? 0;

    const sql = `
      SELECT * FROM assets 
      WHERE ${conditions.join(' AND ')}
      ORDER BY name ASC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `;
    params.push(limit, offset);

    const result = await query<AssetRow>(sql, params);
    return result.rows.map((row: AssetRow) =>
      row.type === 'template' ? rowToTemplateAsset(row) : rowToAssetMetadata(row)
    );
  }

  /**
   * Find template assets by template type
   */
  async findTemplatesByType(
    tenantId: string,
    templateType: TemplateType,
    locale?: string
  ): Promise<TemplateAsset[]> {
    let sql = `SELECT * FROM assets WHERE tenant_id = $1 AND type = 'template' AND template_type = $2`;
    const params: unknown[] = [tenantId, templateType];

    if (locale) {
      sql += ` AND (locale = $3 OR locale IS NULL)`;
      params.push(locale);
    }

    sql += ` ORDER BY locale NULLS LAST, name ASC`;

    const result = await query<AssetRow>(sql, params);
    return result.rows.map((row: AssetRow) => rowToTemplateAsset(row));
  }

  /**
   * Find a specific template asset by ID
   */
  async findTemplateById(tenantId: string, assetId: string): Promise<TemplateAsset | null> {
    const result = await query<AssetRow>(
      `SELECT * FROM assets 
       WHERE tenant_id = $1 AND id = $2 AND type = 'template'`,
      [tenantId, assetId]
    );
    return result.rows[0] ? rowToTemplateAsset(result.rows[0]) : null;
  }

  /**
   * Create a new asset
   */
  async create(params: {
    tenantId: string;
    type: AssetType;
    usage: AssetUsage;
    name: string;
    description?: string;
    path: string;
    mimeType: string;
    size: number;
    tags?: string[];
    createdBy?: string;
    version?: string;
    templateType?: TemplateType;
    variables?: string[];
    locale?: string;
  }): Promise<AssetMetadata> {
    const id = randomUUID();
    const result = await query<AssetRow>(
      `INSERT INTO assets (
        id, tenant_id, type, usage, name, description, path, mime_type, size, 
        tags, created_at, updated_at, created_by, version, 
        template_type, template_variables, locale
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, 
        $10, NOW(), NOW(), $11, $12, 
        $13, $14, $15
      ) RETURNING *`,
      [
        id,
        params.tenantId,
        params.type,
        params.usage,
        params.name,
        params.description ?? null,
        params.path,
        params.mimeType,
        params.size,
        params.tags ?? [],
        params.createdBy ?? null,
        params.version ?? null,
        params.templateType ?? null,
        params.variables ?? null,
        params.locale ?? null,
      ]
    );

    const row = result.rows[0];
    return row.type === 'template' ? rowToTemplateAsset(row) : rowToAssetMetadata(row);
  }

  /**
   * Update an asset
   */
  async update(
    tenantId: string,
    assetId: string,
    updates: Partial<{
      name: string;
      description: string;
      path: string;
      mimeType: string;
      size: number;
      tags: string[];
      version: string;
      variables: string[];
      locale: string;
    }>
  ): Promise<AssetMetadata | null> {
    const setClause: string[] = ['updated_at = NOW()'];
    const params: unknown[] = [tenantId, assetId];
    let paramIndex = 3;

    if (updates.name !== undefined) {
      setClause.push(`name = $${paramIndex++}`);
      params.push(updates.name);
    }
    if (updates.description !== undefined) {
      setClause.push(`description = $${paramIndex++}`);
      params.push(updates.description);
    }
    if (updates.path !== undefined) {
      setClause.push(`path = $${paramIndex++}`);
      params.push(updates.path);
    }
    if (updates.mimeType !== undefined) {
      setClause.push(`mime_type = $${paramIndex++}`);
      params.push(updates.mimeType);
    }
    if (updates.size !== undefined) {
      setClause.push(`size = $${paramIndex++}`);
      params.push(updates.size);
    }
    if (updates.tags !== undefined) {
      setClause.push(`tags = $${paramIndex++}`);
      params.push(updates.tags);
    }
    if (updates.version !== undefined) {
      setClause.push(`version = $${paramIndex++}`);
      params.push(updates.version);
    }
    if (updates.variables !== undefined) {
      setClause.push(`template_variables = $${paramIndex++}`);
      params.push(updates.variables);
    }
    if (updates.locale !== undefined) {
      setClause.push(`locale = $${paramIndex++}`);
      params.push(updates.locale);
    }

    const result = await query<AssetRow>(
      `UPDATE assets SET ${setClause.join(', ')} 
       WHERE tenant_id = $1 AND id = $2
       RETURNING *`,
      params
    );

    if (!result.rows[0]) return null;
    const row = result.rows[0];
    return row.type === 'template' ? rowToTemplateAsset(row) : rowToAssetMetadata(row);
  }

  /**
   * Delete an asset
   */
  async delete(tenantId: string, assetId: string): Promise<boolean> {
    const result = await query(
      `DELETE FROM assets WHERE tenant_id = $1 AND id = $2`,
      [tenantId, assetId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Count assets by tenant
   */
  async countByTenant(tenantId: string, filters?: AssetQueryFilters): Promise<number> {
    const conditions: string[] = ['tenant_id = $1'];
    const params: unknown[] = [tenantId];
    let paramIndex = 2;

    if (filters?.type) {
      conditions.push(`type = $${paramIndex++}`);
      params.push(filters.type);
    }

    if (filters?.usage) {
      conditions.push(`usage = $${paramIndex++}`);
      params.push(filters.usage);
    }

    const result = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM assets WHERE ${conditions.join(' AND ')}`,
      params
    );

    return parseInt(result.rows[0]?.count ?? '0', 10);
  }

  /**
   * Clear all assets (test use only - truncates table)
   */
  async clear(): Promise<void> {
    await query('TRUNCATE TABLE assets');
  }
}

export const assetManagementRepository = new AssetManagementRepository();
