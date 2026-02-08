import type { ExportEntity, ExportFormat } from '../entities/export.entity.js';

export interface ExportRequestInput {
  tenantId: string;
  userId: string;
  format: ExportFormat;
  filters?: Record<string, unknown>;
  columns?: string[];
}

export interface IExportRepository {
  create(input: ExportRequestInput): Promise<ExportEntity>;
  findById(tenantId: string, exportId: string): Promise<ExportEntity | null>;
  getDownloadUrl(tenantId: string, exportId: string): Promise<string | null>;
}
