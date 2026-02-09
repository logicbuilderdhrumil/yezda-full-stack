import { v4 as uuid } from 'uuid';
import type { IExportRepository, ExportRequestInput } from '../../domain/ports/IExportRepository.js';
import type { ExportEntity } from '../../domain/entities/export.entity.js';

export class InMemoryExportRepository implements IExportRepository {
  private exports: ExportEntity[] = [];

  async create(input: ExportRequestInput): Promise<ExportEntity> {
    const exp: ExportEntity = {
      id: uuid(),
      tenantId: input.tenantId,
      userId: input.userId,
      format: input.format,
      status: 'pending',
      filters: input.filters,
      columns: input.columns,
      createdAt: new Date(),
    };
    this.exports.push(exp);
    return exp;
  }

  async findById(tenantId: string, exportId: string): Promise<ExportEntity | null> {
    return this.exports.find((e) => e.id === exportId && e.tenantId === tenantId) ?? null;
  }

  async getDownloadUrl(tenantId: string, exportId: string): Promise<string | null> {
    const exp = this.exports.find((e) => e.id === exportId && e.tenantId === tenantId);
    return exp?.downloadUrl ?? null;
  }
}
