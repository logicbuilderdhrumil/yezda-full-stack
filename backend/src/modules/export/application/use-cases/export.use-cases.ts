import type { IExportRepository, ExportRequestInput, ExportEntity } from '../../domain/index.js';

export class RequestExport {
  constructor(private repo: IExportRepository) {}
  async execute(input: ExportRequestInput): Promise<ExportEntity> {
    return this.repo.create(input);
  }
}

export class GetExportStatus {
  constructor(private repo: IExportRepository) {}
  async execute(tenantId: string, exportId: string): Promise<ExportEntity | null> {
    return this.repo.findById(tenantId, exportId);
  }
}

export class DownloadExport {
  constructor(private repo: IExportRepository) {}
  async execute(tenantId: string, exportId: string): Promise<string | null> {
    return this.repo.getDownloadUrl(tenantId, exportId);
  }
}
