/**
 * File metrics service port — defines contract for recording file operation metrics
 */
export interface IFileMetricsService {
  recordUpload(latencyMs: number, tenantId: string, success: boolean): void;
  recordDownload(latencyMs: number, tenantId: string, success: boolean): void;
  recordScan(latencyMs: number, tenantId: string, result: 'clean' | 'infected' | 'error'): void;
  recordStorageUsage(bytes: number, tenantId: string): void;
  recordRateLimitHit(endpoint: string, tenantId?: string): void;
  getHealthSummary(): {
    uploadLatencyP95Ms: number;
    downloadLatencyP95Ms: number;
    scanLatencyP95Ms: number;
    uploadSloMet: boolean;
    downloadSloMet: boolean;
    scanSloMet: boolean;
    sloTargets: {
      uploadLatencyP95Ms: number;
      downloadLatencyP95Ms: number;
      metadataLatencyP95Ms: number;
      availabilityPercent: number;
      scanTimeP95Ms: number;
    };
  };
}
