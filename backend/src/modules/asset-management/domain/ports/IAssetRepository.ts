/**
 * Asset Management Domain Port — Repository Interface
 */
import type {
  AssetMetadata,
  TemplateAsset,
  AssetQueryFilters,
  AssetCatalogEntry,
  AssetType,
  TemplateType,
} from '../entities/asset.entity.js';

export interface IAssetRepository {
  findById(tenantId: string, assetId: string): Promise<AssetMetadata | null>;
  findByType(tenantId: string, type: AssetType): Promise<AssetMetadata[]>;
  findByFilters(tenantId: string, filters: AssetQueryFilters): Promise<AssetCatalogEntry[]>;
  findTemplatesByType(tenantId: string, type: TemplateType): Promise<TemplateAsset[]>;
  findTemplateById(tenantId: string, templateId: string): Promise<TemplateAsset | null>;
  countByTenant(tenantId: string): Promise<number>;
}
