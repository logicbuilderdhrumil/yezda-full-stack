import { InMemoryExportRepository } from './infrastructure/index.js';
import { RequestExport, GetExportStatus, DownloadExport } from './application/index.js';
import { ExportController, createExportRoutes } from './interface/index.js';

export function createExportModule() {
  const repo = new InMemoryExportRepository();
  const requestExportUC = new RequestExport(repo);
  const getExportStatusUC = new GetExportStatus(repo);
  const downloadExportUC = new DownloadExport(repo);
  const controller = new ExportController(requestExportUC, getExportStatusUC, downloadExportUC);
  return { router: createExportRoutes(controller) };
}
