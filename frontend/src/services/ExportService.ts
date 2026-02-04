/**
 * Export Service
 * Integration layer for data export operations with job tracking.
 */

import { ApiService } from './ApiService';
import { JobService, type PollOptions } from './JobService';
import type {
  ExportRequestDTO,
  ExportStatusDTO,
  ExportFormat,
} from '@/@types/contracts';

/** Export options. */
export interface ExportOptions extends Omit<PollOptions, 'onProgress'> {
  /** Callback for export progress updates. */
  onProgress?: (status: ExportStatusDTO) => void;
  /** Whether to automatically trigger download on completion. */
  autoDownload?: boolean;
  /** Custom filename for download. */
  filename?: string;
}

/**
 * ExportService provides methods for data export with job tracking.
 */
export const ExportService = {
  /**
   * Requests a new export.
   */
  async request(data: ExportRequestDTO): Promise<ExportStatusDTO> {
    const response = await ApiService.post<ExportStatusDTO>('exports.request', data);
    return response.data;
  },

  /**
   * Gets the status of an export.
   */
  async getStatus(exportId: string): Promise<ExportStatusDTO> {
    const response = await ApiService.get<ExportStatusDTO>('exports.status', {
      pathParams: { exportId },
    });
    return response.data;
  },

  /**
   * Downloads a completed export.
   */
  async download(exportId: string, filename?: string): Promise<Blob> {
    const response = await ApiService.get<Blob>('exports.download', {
      pathParams: { exportId },
      responseType: 'blob',
    });

    if (filename) {
      triggerDownload(response.data, filename);
    }

    return response.data;
  },

  /**
   * Requests an export and waits for completion.
   */
  async exportAndWait(
    data: ExportRequestDTO,
    options?: ExportOptions
  ): Promise<ExportStatusDTO> {
    // Request the export
    const initial = await this.request(data);

    // Poll for completion
    const completed = await JobService.pollUntilComplete(initial.exportId, {
      interval: options?.interval,
      timeout: options?.timeout,
      signal: options?.signal,
      onProgress: (job) => {
        if (options?.onProgress) {
          // Map job status to export status
          options.onProgress({
            exportId: initial.exportId,
            status: job.status,
            format: initial.format,
            progress: job.progress,
            createdAt: initial.createdAt,
            completedAt: job.completedAt,
          });
        }
      },
    });

    // Get final status with download URL
    const finalStatus = await this.getStatus(initial.exportId);

    // Auto-download if enabled
    if (options?.autoDownload && finalStatus.downloadUrl) {
      const filename = options.filename ?? generateExportFilename(data.format);
      await this.download(initial.exportId, filename);
    }

    return finalStatus;
  },

  /**
   * Quick export helper for common formats.
   */
  async quickExport(
    format: ExportFormat,
    filters?: Record<string, unknown>,
    options?: ExportOptions
  ): Promise<ExportStatusDTO> {
    return this.exportAndWait({ format, filters }, options);
  },
};

/**
 * Generates a default filename for export.
 */
function generateExportFilename(format: ExportFormat): string {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
  return `export_${timestamp}.${format}`;
}

/**
 * Triggers a browser download for a blob.
 */
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
