/**
 * File Management Metrics Service
 * Task 1.9: Define file endpoint SLOs and add metrics/alerts
 */

import { FILE_SLOS, FILE_METRICS } from '../models/file-management.model.js';

interface MetricEntry {
  value: number;
  timestamp: number;
  labels: Record<string, string>;
}

/**
 * File management metrics service for observability
 */
export class FileMetricsService {
  private metrics: Map<string, MetricEntry[]> = new Map();
  private readonly windowMs = 60000; // 1 minute window for percentiles

  /**
   * Record file upload metric
   */
  recordUpload(latencyMs: number, tenantId: string, success: boolean): void {
    this.record(FILE_METRICS.uploadCount, 1, { tenantId, success: String(success) });
    this.record(FILE_METRICS.uploadLatency, latencyMs, { tenantId });
    if (!success) {
      this.record(FILE_METRICS.uploadErrors, 1, { tenantId });
    }
  }

  /**
   * Record file download metric
   */
  recordDownload(latencyMs: number, tenantId: string, success: boolean): void {
    this.record(FILE_METRICS.downloadCount, 1, { tenantId, success: String(success) });
    this.record(FILE_METRICS.downloadLatency, latencyMs, { tenantId });
    if (!success) {
      this.record(FILE_METRICS.downloadErrors, 1, { tenantId });
    }
  }

  /**
   * Record malware scan metric
   */
  recordScan(latencyMs: number, tenantId: string, result: 'clean' | 'infected' | 'error'): void {
    this.record(FILE_METRICS.scanCount, 1, { tenantId, result });
    this.record(FILE_METRICS.scanLatency, latencyMs, { tenantId });
    if (result === 'infected') {
      this.record(FILE_METRICS.scanInfected, 1, { tenantId });
    }
  }

  /**
   * Record storage usage metric
   */
  recordStorageUsage(bytes: number, tenantId: string): void {
    this.record(FILE_METRICS.storageBytes, bytes, { tenantId });
  }

  /**
   * Record rate limit hit
   */
  recordRateLimitHit(endpoint: string, tenantId?: string): void {
    this.record(FILE_METRICS.rateLimitHits, 1, { endpoint, tenantId: tenantId || 'unknown' });
  }

  /**
   * Get upload latency P95
   */
  getUploadLatencyP95(): number {
    return this.getPercentile(FILE_METRICS.uploadLatency, 95);
  }

  /**
   * Get download latency P95
   */
  getDownloadLatencyP95(): number {
    return this.getPercentile(FILE_METRICS.downloadLatency, 95);
  }

  /**
   * Get scan latency P95
   */
  getScanLatencyP95(): number {
    return this.getPercentile(FILE_METRICS.scanLatency, 95);
  }

  /**
   * Check if upload SLO is met
   */
  isUploadSloMet(): boolean {
    return this.getUploadLatencyP95() <= FILE_SLOS.uploadLatencyP95Ms;
  }

  /**
   * Check if download SLO is met
   */
  isDownloadSloMet(): boolean {
    return this.getDownloadLatencyP95() <= FILE_SLOS.downloadLatencyP95Ms;
  }

  /**
   * Get health summary for file management
   */
  getHealthSummary(): {
    uploadLatencyP95Ms: number;
    downloadLatencyP95Ms: number;
    scanLatencyP95Ms: number;
    uploadSloMet: boolean;
    downloadSloMet: boolean;
    scanSloMet: boolean;
    sloTargets: typeof FILE_SLOS;
  } {
    return {
      uploadLatencyP95Ms: this.getUploadLatencyP95(),
      downloadLatencyP95Ms: this.getDownloadLatencyP95(),
      scanLatencyP95Ms: this.getScanLatencyP95(),
      uploadSloMet: this.isUploadSloMet(),
      downloadSloMet: this.isDownloadSloMet(),
      scanSloMet: this.getScanLatencyP95() <= FILE_SLOS.scanTimeP95Ms,
      sloTargets: FILE_SLOS,
    };
  }

  /**
   * Get counter value
   */
  getCounter(name: string): number {
    const entries = this.metrics.get(name) || [];
    return entries.reduce((sum, e) => sum + e.value, 0);
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

export const fileMetricsService = new FileMetricsService();
