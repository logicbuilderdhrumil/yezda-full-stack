/**
 * Export domain entity.
 */
export const EXPORT_FORMATS = ['csv', 'xlsx', 'pdf', 'json'] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export type ExportStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface ExportEntity {
  id: string;
  tenantId: string;
  userId: string;
  format: ExportFormat;
  status: ExportStatus;
  progress?: { current: number; total: number; percentage: number };
  filters?: Record<string, unknown>;
  columns?: string[];
  downloadUrl?: string;
  filename?: string;
  fileSize?: number;
  expiresAt?: Date;
  createdAt: Date;
  completedAt?: Date;
}
