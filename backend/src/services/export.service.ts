/**
 * Export Service
 * Business logic for data export operations.
 */

import { randomUUID } from 'crypto';
import type {
  Export,
  ExportFormat,
  ExportRequestInput,
  ExportResult,
} from '../models/export.model.js';
import { generateExportFilename } from '../models/export.model.js';
import { jobService } from './job.service.js';

/**
 * In-memory export store for development.
 * In production, this would be backed by a database.
 */
const exportStore = new Map<string, Export>();

/**
 * Download result.
 */
interface DownloadResult {
  success: boolean;
  file?: Buffer;
  filename?: string;
  format?: ExportFormat;
  error?: string;
  errorCode?: string;
}

/**
 * Export service provides methods for export operations.
 */
export const exportService = {
  /**
   * Requests a new export.
   */
  async requestExport(input: ExportRequestInput): Promise<ExportResult> {
    const exportId = randomUUID();
    const filename = generateExportFilename(input.format);

    // Create a job for the export
    const job = jobService.createJob({
      tenantId: input.tenantId,
      userId: input.userId,
      type: 'export',
      metadata: { exportId, format: input.format },
    });

    const exportRecord: Export = {
      id: exportId,
      tenantId: input.tenantId,
      userId: input.userId,
      format: input.format,
      status: 'pending',
      filters: input.filters,
      columns: input.columns,
      filename,
      createdAt: new Date(),
    };

    exportStore.set(exportId, exportRecord);

    // Simulate async export processing
    setImmediate(() => this.processExport(exportId, job.id));

    return { success: true, export: exportRecord };
  },

  /**
   * Gets an export by ID.
   */
  async getExport(
    exportId: string,
    tenantId: string,
    userId: string
  ): Promise<Export | null> {
    const exportRecord = exportStore.get(exportId);
    if (!exportRecord) return null;
    if (exportRecord.tenantId !== tenantId) return null;
    if (exportRecord.userId !== userId) return null;
    return exportRecord;
  },

  /**
   * Downloads an export file.
   */
  async downloadExport(
    exportId: string,
    tenantId: string,
    userId: string
  ): Promise<DownloadResult> {
    const exportRecord = await this.getExport(exportId, tenantId, userId);

    if (!exportRecord) {
      return { success: false, error: 'Export not found', errorCode: 'EXPORT_NOT_FOUND' };
    }

    if (exportRecord.status !== 'completed') {
      return { success: false, error: 'Export not ready', errorCode: 'EXPORT_NOT_READY' };
    }

    if (exportRecord.expiresAt && exportRecord.expiresAt < new Date()) {
      return { success: false, error: 'Export expired', errorCode: 'EXPORT_EXPIRED' };
    }

    // In production, this would fetch from storage
    const file = generateMockExportFile(exportRecord);

    return {
      success: true,
      file,
      filename: exportRecord.filename,
      format: exportRecord.format,
    };
  },

  /**
   * Processes an export (simulated).
   */
  async processExport(exportId: string, jobId: string): Promise<void> {
    const exportRecord = exportStore.get(exportId);
    if (!exportRecord) return;

    // Update to running
    exportRecord.status = 'running';
    exportStore.set(exportId, exportRecord);
    jobService.updateJobStatus(jobId, 'running');

    // Simulate progress
    const totalSteps = 5;
    for (let i = 1; i <= totalSteps; i++) {
      await sleep(500);
      exportRecord.progress = {
        current: i,
        total: totalSteps,
        percentage: Math.round((i / totalSteps) * 100),
        message: `Processing step ${i} of ${totalSteps}`,
      };
      exportStore.set(exportId, exportRecord);
      jobService.updateJobStatus(jobId, 'running', { progress: exportRecord.progress });
    }

    // Complete
    exportRecord.status = 'completed';
    exportRecord.completedAt = new Date();
    exportRecord.fileSize = 1024; // Mock size
    exportRecord.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    exportRecord.downloadUrl = `/api/v1/exports/${exportId}/download`;
    exportStore.set(exportId, exportRecord);

    jobService.updateJobStatus(jobId, 'completed', {
      result: { exportId, downloadUrl: exportRecord.downloadUrl },
    });
  },
};

/**
 * Sleep helper.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate mock export file content.
 */
function generateMockExportFile(exportRecord: Export): Buffer {
  const content = exportRecord.format === 'json'
    ? JSON.stringify({ exportId: exportRecord.id, createdAt: exportRecord.createdAt }, null, 2)
    : exportRecord.format === 'csv'
    ? 'id,name,value\n1,test,100\n2,example,200'
    : 'Mock export content';

  return Buffer.from(content, 'utf-8');
}
