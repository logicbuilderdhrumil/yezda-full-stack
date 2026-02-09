/**
 * PostgreSQL Asset Repository
 * Infrastructure implementation of IAssetRepository.
 */
import { query } from '../../../../shared/infrastructure/database/index.js';
import type { IAssetRepository } from '../../domain/ports/IAssetRepository.js';
import type {
  AssetMetadata,
  TemplateAsset,
  AssetQueryFilters,
  AssetCatalogEntry,
  AssetType,
  TemplateType,
} from '../../domain/entities/asset.entity.js';

export class PostgresAssetRepository implements IAssetRepository {
  async findById(tenantId: string, assetId: string): Promise<AssetMetadata | null> {
    const result = await query(
      `SELECT * FROM assets WHERE tenant_id = $1 AND id = $2`,
      [tenantId, assetId],
    );
    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  async findByType(tenantId: string, type: AssetType): Promise<AssetMetadata[]> {
    const result = await query(
      `SELECT * FROM assets WHERE tenant_id = $1 AND type = $2 ORDER BY created_at DESC`,
      [tenantId, type],
    );
    return result.rows.map(this.mapRow);
  }

  async findByFilters(tenantId: string, filters: AssetQueryFilters): Promise<AssetCatalogEntry[]> {
    const conditions: string[] = ['tenant_id = $1'];
    const params: unknown[] = [tenantId];
    let paramIdx = 2;

    if (filters.type) {
      conditions.push(`type = $${paramIdx++}`);
      params.push(filters.type);
    }
    if (filters.usage) {
      conditions.push(`usage = $${paramIdx++}`);
      params.push(filters.usage);
    }
    if (filters.search) {
      conditions.push(`(name ILIKE $${paramIdx} OR description ILIKE $${paramIdx})`);
      params.push(`%${filters.search}%`);
      paramIdx++;
    }
    if (filters.tags && filters.tags.length > 0) {
      conditions.push(`tags && $${paramIdx++}`);
      params.push(filters.tags);
    }

    const limit = filters.limit ?? 50;
    const offset = filters.offset ?? 0;

    const result = await query(
      `SELECT id, type, usage, name, path, mime_type, size, tags, created_at
       FROM assets WHERE ${conditions.join(' AND ')}
       ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
      params,
    );
    return result.rows.map(this.mapCatalogRow);
  }

  async findTemplatesByType(tenantId: string, type: TemplateType): Promise<TemplateAsset[]> {
    const result = await query(
      `SELECT * FROM assets WHERE tenant_id = $1 AND type = 'template' AND template_type = $2 ORDER BY created_at DESC`,
      [tenantId, type],
    );
    return result.rows.map(this.mapTemplateRow);
  }

  async findTemplateById(tenantId: string, templateId: string): Promise<TemplateAsset | null> {
    const result = await query(
      `SELECT * FROM assets WHERE tenant_id = $1 AND id = $2 AND type = 'template'`,
      [tenantId, templateId],
    );
    return result.rows[0] ? this.mapTemplateRow(result.rows[0]) : null;
  }

  async countByTenant(tenantId: string): Promise<number> {
    const result = await query(
      `SELECT COUNT(*)::int AS count FROM assets WHERE tenant_id = $1`,
      [tenantId],
    );
    return result.rows[0]?.count ?? 0;
  }

  private mapRow(row: Record<string, unknown>): AssetMetadata {
    return {
      id: row.id as string,
      tenantId: row.tenant_id as string,
      type: row.type as AssetType,
      usage: row.usage as string as AssetMetadata['usage'],
      name: row.name as string,
      description: row.description as string | undefined,
      path: row.path as string,
      mimeType: row.mime_type as string,
      size: row.size as number,
      tags: (row.tags as string[]) ?? [],
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
      createdBy: row.created_by as string | undefined,
      version: row.version as string | undefined,
    };
  }

  private mapCatalogRow(row: Record<string, unknown>): AssetCatalogEntry {
    return {
      id: row.id as string,
      type: row.type as AssetType,
      usage: row.usage as string as AssetCatalogEntry['usage'],
      name: row.name as string,
      path: row.path as string,
      mimeType: row.mime_type as string,
      size: row.size as number,
      tags: (row.tags as string[]) ?? [],
      createdAt: new Date(row.created_at as string),
    };
  }

  private mapTemplateRow(row: Record<string, unknown>): TemplateAsset {
    return {
      ...this.mapRow(row),
      type: 'template',
      templateType: row.template_type as TemplateType,
      variables: (row.variables as string[]) ?? [],
      locale: row.locale as string | undefined,
    };
  }
}
