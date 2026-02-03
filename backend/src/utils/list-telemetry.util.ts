/**
 * List Telemetry Utilities
 * Operational telemetry hooks for list endpoint performance monitoring.
 */

// ============================================================================
// SLO Targets (published availability and error targets)
// ============================================================================

/**
 * Service Level Objectives for list utilities.
 * Used for monitoring and alerting.
 */
export const ListSLO = {
  /** Target availability percentage (99.9%) */
  AVAILABILITY_TARGET: 99.9,
  /** Target error rate percentage (<0.1%) */
  ERROR_RATE_TARGET: 0.1,
  /** P95 latency target in milliseconds */
  P95_LATENCY_MS: 500,
  /** P99 latency target in milliseconds */
  P99_LATENCY_MS: 1000,
} as const;

// ============================================================================
// Metrics Types
// ============================================================================

/**
 * Telemetry event for list operations.
 */
export interface ListTelemetryEvent {
  /** Operation name (e.g., 'list_users', 'search_orders') */
  operation: string;
  /** Start timestamp */
  startTime: number;
  /** End timestamp (set when complete) */
  endTime?: number;
  /** Duration in milliseconds */
  durationMs?: number;
  /** Number of items returned */
  resultCount?: number;
  /** Total count (for pagination) */
  totalCount?: number;
  /** Whether the operation succeeded */
  success: boolean;
  /** Error code if failed */
  errorCode?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Telemetry collector interface.
 * Allows pluggable telemetry backends (console, metrics service, etc.)
 */
export interface TelemetryCollector {
  emit(event: ListTelemetryEvent): void;
}

// ============================================================================
// Default Console Collector
// ============================================================================

/**
 * Console-based telemetry collector for development.
 * Logs events to console with structured format.
 */
export const consoleTelemetryCollector: TelemetryCollector = {
  emit(event: ListTelemetryEvent): void {
    const level = event.success ? 'info' : 'warn';
    const logData = {
      type: 'list_telemetry',
      operation: event.operation,
      durationMs: event.durationMs,
      resultCount: event.resultCount,
      totalCount: event.totalCount,
      success: event.success,
      errorCode: event.errorCode,
      timestamp: new Date().toISOString(),
      ...event.metadata,
    };

    if (level === 'warn') {
      console.warn('[LIST_TELEMETRY]', JSON.stringify(logData));
    } else {
      console.info('[LIST_TELEMETRY]', JSON.stringify(logData));
    }
  },
};

// ============================================================================
// Telemetry Context
// ============================================================================

/** Current telemetry collector (can be swapped for testing) */
let currentCollector: TelemetryCollector = consoleTelemetryCollector;

/**
 * Set the telemetry collector.
 * Use for testing or to integrate with external metrics services.
 */
export function setTelemetryCollector(collector: TelemetryCollector): void {
  currentCollector = collector;
}

/**
 * Reset telemetry collector to default console collector.
 */
export function resetTelemetryCollector(): void {
  currentCollector = consoleTelemetryCollector;
}

/**
 * Get the current telemetry collector.
 */
export function getTelemetryCollector(): TelemetryCollector {
  return currentCollector;
}

// ============================================================================
// Telemetry Hooks
// ============================================================================

/**
 * Create a telemetry context for a list operation.
 * Call complete() when the operation finishes.
 */
export function startListTelemetry(
  operation: string,
  metadata?: Record<string, unknown>
): ListTelemetryContext {
  return new ListTelemetryContext(operation, metadata);
}

/**
 * Telemetry context for a list operation.
 * Tracks timing and emits metrics on completion.
 */
export class ListTelemetryContext {
  private event: ListTelemetryEvent;

  constructor(operation: string, metadata?: Record<string, unknown>) {
    this.event = {
      operation,
      startTime: performance.now(),
      success: false,
      metadata,
    };
  }

  /**
   * Mark the operation as successful and emit telemetry.
   */
  success(resultCount: number, totalCount?: number): void {
    this.event.endTime = performance.now();
    this.event.durationMs = this.event.endTime - this.event.startTime;
    this.event.success = true;
    this.event.resultCount = resultCount;
    this.event.totalCount = totalCount;

    currentCollector.emit(this.event);
  }

  /**
   * Mark the operation as failed and emit telemetry.
   */
  failure(errorCode: string): void {
    this.event.endTime = performance.now();
    this.event.durationMs = this.event.endTime - this.event.startTime;
    this.event.success = false;
    this.event.errorCode = errorCode;

    currentCollector.emit(this.event);
  }

  /**
   * Get the current duration without completing.
   */
  getCurrentDurationMs(): number {
    return performance.now() - this.event.startTime;
  }
}

/**
 * Higher-order function to wrap a list operation with telemetry.
 */
export function withListTelemetry<T, R extends { items: unknown[]; pagination?: { total?: number } }>(
  operation: string,
  fn: (args: T) => Promise<R>,
  metadata?: Record<string, unknown>
): (args: T) => Promise<R> {
  return async (args: T): Promise<R> => {
    const telemetry = startListTelemetry(operation, metadata);

    try {
      const result = await fn(args);
      telemetry.success(
        result.items.length,
        result.pagination?.total
      );
      return result;
    } catch (error) {
      const errorCode = error instanceof Error && 'code' in error
        ? String((error as { code?: string }).code)
        : 'UNKNOWN_ERROR';
      telemetry.failure(errorCode);
      throw error;
    }
  };
}

// ============================================================================
// SLO Calculation Helpers
// ============================================================================

/**
 * Check if a duration meets the P95 latency SLO.
 */
export function meetsP95LatencySLO(durationMs: number): boolean {
  return durationMs <= ListSLO.P95_LATENCY_MS;
}

/**
 * Check if a duration meets the P99 latency SLO.
 */
export function meetsP99LatencySLO(durationMs: number): boolean {
  return durationMs <= ListSLO.P99_LATENCY_MS;
}

/**
 * Calculate error rate from counts.
 */
export function calculateErrorRate(successCount: number, errorCount: number): number {
  const total = successCount + errorCount;
  if (total === 0) return 0;
  return (errorCount / total) * 100;
}

/**
 * Check if error rate meets SLO target.
 */
export function meetsErrorRateSLO(successCount: number, errorCount: number): boolean {
  return calculateErrorRate(successCount, errorCount) <= ListSLO.ERROR_RATE_TARGET;
}
