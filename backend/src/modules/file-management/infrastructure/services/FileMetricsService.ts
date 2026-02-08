/**
 * FileMetricsService
 * In-process metrics collection for file management SLOs — implements IFileMetricsService
 */
import { FILE_SLOS, FILE_METRICS } from '../../domain/entities/index.js';
import type { IFileMetricsService } from '../../domain/ports/IFileMetricsService.js';

interface MetricEntry {
  value: number;
  timestamp: number;
  labels: Record<string, string>;
}

export class FileMetricsService implements IFileMetricsService {
  private metrics: Map<string, MetricEntry[]> = new Map();
  private readonly windowMs = 60000; // 1 minute window for percentiles

  recordUpload(latencyMs: number, tenantId: string, success: boolean): void {
    this.record(FILE_METRICS.uploadCount, 1, { tenantId, success: String(success) });
    this.record(FILE_METRICS.uploadLatency, latencyMs, { tenantId });
    if (!success) {
      this.record(FILE_METRICS.uploadErrors, 1, { tenantId });
    }
  }

  recordDownload(latencyMs: number, tenantId: string, success: boolean): void {
    this.record(FILE_METRICS.downloadCount, 1, { tenantId, success: String(success) });
    this.record(FILE_METRICS.downloadLatency, latencyMs, { tenantId });
    if (!success) {
      this.record(FILE_METRICS.downloadErrors, 1, { tenantId });
    }
  }

  recordScan(latencyMs: number, tenantId: string, result: 'clean' | 'infected' | 'error'): void {
    this.record(FILE_METRICS.scanCount, 1, { tenantId, result });
    this.record(FILE_METRICS.scanLatency, latencyMs, { tenantId });
    if (result === 'infected') {
      this.record(FILE_METRICS.scanInfected, 1, { tenantId });
    }
  }

  recordStorageUsage(bytes: number, tenantId: string): void {
    this.record(FILE_METRICS.storageBytes, bytes, { tenantId });
  }

  recordRateLimitHit(endpoint: string, tenantId?: string): void {
    this.record(FILE_METRICS.rateLimitHits, 1, { endpoint, tenantId: tenantId || 'unknown' });
  }

  getHealthSummary(): {
    uploadLatencyP95Ms: number;
    downloadLatencyP95Ms: number;
    scanLatencyP95Ms: number;
    uploadSloMet: boolean;
    downloadSloMet: boolean;
    scanSloMet: boolean;
    sloTargets: typeof FILE_SLOS;
  } {
    const uploadP95 = this.getPercentile(FILE_METRICS.uploadLatency, 95);
    const downloadP95 = this.getPercentile(FILE_METRICS.downloadLatency, 95);
    const scanP95 = this.getPercentile(FILE_METRICS.scanLatency, 95);

    return {
      uploadLatencyP95Ms: uploadP95,
      downloadLatencyP95Ms: downloadP95,
      scanLatencyP95Ms: scanP95,
      uploadSloMet: uploadP95 <= FILE_SLOS.uploadLatencyP95Ms,
      downloadSloMet: downloadP95 <= FILE_SLOS.downloadLatencyP95Ms,
      scanSloMet: scanP95 <= FILE_SLOS.scanTimeP95Ms,
      sloTargets: FILE_SLOS,
    };
  }

  private record(name: string, value: number, labels: Record<string, string>): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    const entries = this.metrics.get(name)!;
    entries.push({ value, timestamp: Date.now(), labels });

    // Clean up old entries
    this.cleanup(name);
  }

  private cleanup(name: string): void {
    const entries = this.metrics.get(name);
    if (!entries) return;

    const cutoff = Date.now() - this.windowMs * 5; // Keep 5 minutes of data
    const filtered = entries.filter((e) => e.timestamp > cutoff);
    this.metrics.set(name, filtered);
  }

  private getPercentile(name: string, percentile: number): number {
    const entries = this.metrics.get(name) || [];
    const cutoff = Date.now() - this.windowMs;
    const recentValues = entries
      .filter((e) => e.timestamp > cutoff)
      .map((e) => e.value)
      .sort((a, b) => a - b);

    if (recentValues.length === 0) return 0;

    const index = Math.ceil((percentile / 100) * recentValues.length) - 1;
    return recentValues[Math.max(0, index)];
  }
}
