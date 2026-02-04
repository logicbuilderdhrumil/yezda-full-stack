/**
 * Export Model
 * Shared types for data export operations.
 */

import { z } from 'zod';
import type { JobStatus, JobProgress } from './job.model.js';

/**
 * Export format enum.
 */
export const EXPORT_FORMATS = ['csv', 'xlsx', 'pdf', 'json'] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

/**
 * Export entity.
 */
export interface Export {
  id: string;
  tenantId: string;
  userId: string;
  format: ExportFormat;
  status: JobStatus;
  progress?: JobProgress;
  filters?: Record<string, unknown>;
  columns?: string[];
  downloadUrl?: string;
  filename?: string;
  fileSize?: number;
  expiresAt?: Date;
  createdAt: Date;
  completedAt?: Date;
}

/**
 * Export request input.
 */
export interface ExportRequestInput {
  tenantId: string;
  userId: string;
  format: ExportFormat;
  filters?: Record<string, unknown>;
  columns?: string[];
}

/**
 * Export result.
 */
export interface ExportResult {
  success: boolean;
  export?: Export;
  error?: string;
  errorCode?: string;
}

/**
 * Export validation schemas.
 */
export const exportRequestSchema = z.object({
  format: z.enum(EXPORT_FORMATS),
  filters: z.record(z.unknown()).optional(),
  columns: z.array(z.string()).optional(),
});

/**
 * Export event types for audit.
 */
export type ExportAuditEventType =
  | 'EXPORT_REQUESTED'
  | 'EXPORT_STARTED'
  | 'EXPORT_COMPLETED'
  | 'EXPORT_FAILED'
  | 'EXPORT_DOWNLOADED';

/**
 * Export SLO targets.
 */
export const EXPORT_SLOS = {
  smallExportTimeMs: 30000, // < 1000 rows
  mediumExportTimeMs: 120000, // < 10000 rows
  largeExportTimeMs: 600000, // > 10000 rows
  downloadAvailabilityMs: 86400000, // 24 hours
} as const;

/**
 * Export metrics names.
 */
export const EXPORT_METRICS = {
  requested: 'export_requested_total',
  completed: 'export_completed_total',
  failed: 'export_failed_total',
  downloaded: 'export_downloaded_total',
  duration: 'export_duration_ms',
  fileSize: 'export_file_size_bytes',
} as const;

/**
 * Default export filename generator.
 */
export function generateExportFilename(format: ExportFormat, prefix = 'export'): string {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
  return `${prefix}_${timestamp}.${format}`;
}
