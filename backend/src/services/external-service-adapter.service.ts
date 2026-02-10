/**
 * External Service Adapter Service
 *
 * Provides an adapter pattern for pipeline stages that call external services
 * (e.g. background-check providers, identity verification APIs).
 *
 * Phase 4.1-4.5: Adapter interface, generic REST adapter, factory, and
 * orchestrating service with webhook support.
 */

import type {
  ExternalServiceModuleConfig,
  FieldMappingEntry,
} from '../shared-types/pipeline-modules.js';
import { auditService } from './audit.service.js';
import { metricsService } from './metrics.service.js';

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

/** Outcome of an external service call or webhook processing */
export interface ExternalServiceResult {
  success: boolean;
  data?: unknown;
  error?: string;
  errorCode?: string;
}

/** Status of an in-flight external service call */
export type ExternalServiceStatus =
  | 'pending'
  | 'completed'
  | 'failed'
  | 'timed_out'
  | 'unknown';

/** Stored state for an active external service call */
interface PendingServiceCall {
  stageId: string;
  provider: string;
  status: ExternalServiceStatus;
  requestedAt: Date;
  completedAt?: Date;
  result?: ExternalServiceResult;
}

// ---------------------------------------------------------------------------
// Adapter interface
// ---------------------------------------------------------------------------

/**
 * Contract every external-service adapter must satisfy.
 * Real adapters (Sterling, Checkr, …) will implement this.
 */
export interface ExternalServiceAdapter {
  /** Send a request to the external service */
  sendRequest(
    config: ExternalServiceModuleConfig,
    candidateData: Record<string, unknown>,
  ): Promise<ExternalServiceResult>;

  /** Parse / normalise a raw response from the external service */
  parseResponse(rawResponse: unknown): ExternalServiceResult;

  /** Validate a webhook callback (signature check, etc.) */
  validateWebhook(
    headers: Record<string, string | string[] | undefined>,
    body: unknown,
  ): boolean;
}

// ---------------------------------------------------------------------------
// Generic REST adapter (stub / reference implementation)
// ---------------------------------------------------------------------------

/**
 * Default REST adapter that works with any JSON-over-HTTP provider.
 *
 * Currently returns a **mock** successful response so the pipeline can be
 * exercised end-to-end without real integrations.  The structure is ready
 * for actual `fetch()` calls — swap in the real implementation when needed.
 */
export class GenericRestAdapter implements ExternalServiceAdapter {
  async sendRequest(
    config: ExternalServiceModuleConfig,
    candidateData: Record<string, unknown>,
  ): Promise<ExternalServiceResult> {
    const mappedPayload = this.applyFieldMapping(
      config.fieldMapping,
      candidateData,
    );

    try {
      // ---- STUB: replace with real fetch when integrating ----
      // const response = await fetch(config.endpoint, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${config.apiKeyRef}`,
      //   },
      //   body: JSON.stringify(mappedPayload),
      //   signal: AbortSignal.timeout(config.timeout),
      // });
      // const data = await response.json();
      // return this.parseResponse(data);

      console.log(
        `[GenericRestAdapter] STUB: Would POST to ${config.endpoint} with ${Object.keys(mappedPayload).length} fields`,
      );

      return {
        success: true,
        data: {
          stubbed: true,
          provider: config.provider,
          fieldsSubmitted: Object.keys(mappedPayload),
          timestamp: new Date().toISOString(),
        },
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unknown error during external call';
      console.error(`[GenericRestAdapter] Request failed: ${message}`);
      return {
        success: false,
        error: message,
        errorCode: 'EXTERNAL_REQUEST_FAILED',
      };
    }
  }

  parseResponse(rawResponse: unknown): ExternalServiceResult {
    // For stubbed mode the raw response is already shaped correctly.
    if (
      rawResponse &&
      typeof rawResponse === 'object' &&
      'success' in (rawResponse as Record<string, unknown>)
    ) {
      return rawResponse as ExternalServiceResult;
    }

    return {
      success: true,
      data: rawResponse,
    };
  }

  validateWebhook(
    _headers: Record<string, string | string[] | undefined>,
    _body: unknown,
  ): boolean {
    // STUB: implement HMAC / signature validation per-provider
    return true;
  }

  // -- helpers --

  private applyFieldMapping(
    mapping: FieldMappingEntry[],
    candidateData: Record<string, unknown>,
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const entry of mapping) {
      if (entry.sourceField in candidateData) {
        result[entry.targetField] = candidateData[entry.sourceField];
      }
    }
    return result;
  }
}

// ---------------------------------------------------------------------------
// Adapter factory
// ---------------------------------------------------------------------------

/**
 * Select the correct adapter implementation based on the provider name.
 *
 * When specific provider adapters are added (e.g. SterlingAdapter), register
 * them here.  Falls back to `GenericRestAdapter`.
 */
export class ExternalServiceAdapterFactory {
  private static adapters: Record<string, ExternalServiceAdapter> = {};

  /** Register a named adapter (call at boot time for custom providers) */
  static register(provider: string, adapter: ExternalServiceAdapter): void {
    ExternalServiceAdapterFactory.adapters[provider.toLowerCase()] = adapter;
  }

  /** Resolve the adapter for a given provider */
  static getAdapter(provider: string): ExternalServiceAdapter {
    const key = provider.toLowerCase();
    if (ExternalServiceAdapterFactory.adapters[key]) {
      return ExternalServiceAdapterFactory.adapters[key];
    }
    // Default: generic REST adapter
    return new GenericRestAdapter();
  }
}

// ---------------------------------------------------------------------------
// Metrics constants
// ---------------------------------------------------------------------------

export const EXTERNAL_SERVICE_METRICS = {
  EXECUTE_REQUEST: 'external_service_execute_request_total',
  EXECUTE_SUCCESS: 'external_service_execute_success_total',
  EXECUTE_FAILURE: 'external_service_execute_failure_total',
  EXECUTE_LATENCY: 'external_service_execute_latency_ms',
  WEBHOOK_RECEIVED: 'external_service_webhook_received_total',
  WEBHOOK_VALID: 'external_service_webhook_valid_total',
  WEBHOOK_INVALID: 'external_service_webhook_invalid_total',
} as const;

// ---------------------------------------------------------------------------
// Orchestrating service
// ---------------------------------------------------------------------------

export class ExternalServiceAdapterService {
  /** In-memory store of pending calls (replace with DB in production) */
  private pendingCalls: Map<string, PendingServiceCall> = new Map();

  /**
   * Execute an external service call for a pipeline stage.
   */
  async executeExternalService(
    stageId: string,
    config: ExternalServiceModuleConfig,
    candidateData: Record<string, unknown>,
  ): Promise<ExternalServiceResult> {
    const startMs = Date.now();
    metricsService.incrementCounter(EXTERNAL_SERVICE_METRICS.EXECUTE_REQUEST, {
      provider: config.provider,
    });

    // Mark as pending
    this.pendingCalls.set(stageId, {
      stageId,
      provider: config.provider,
      status: 'pending',
      requestedAt: new Date(),
    });

    const adapter = ExternalServiceAdapterFactory.getAdapter(config.provider);

    try {
      const result = await adapter.sendRequest(config, candidateData);
      const durationMs = Date.now() - startMs;

      // Update pending state
      const call = this.pendingCalls.get(stageId);
      if (call) {
        call.status = result.success ? 'completed' : 'failed';
        call.completedAt = new Date();
        call.result = result;
      }

      // Observability
      metricsService.incrementCounter(
        result.success
          ? EXTERNAL_SERVICE_METRICS.EXECUTE_SUCCESS
          : EXTERNAL_SERVICE_METRICS.EXECUTE_FAILURE,
        { provider: config.provider },
      );
      metricsService.recordLatency(
        EXTERNAL_SERVICE_METRICS.EXECUTE_LATENCY,
        durationMs,
        { provider: config.provider },
      );

      auditService.log({
        eventType: 'EXTERNAL_SERVICE_EXECUTED' as never,
        actorType: 'system',
        channel: 'api',
        targetId: stageId,
        targetType: 'pipeline_stage',
        metadata: {
          provider: config.provider,
          endpoint: config.endpoint,
          success: result.success,
          durationMs,
        },
        success: result.success,
        errorMessage: result.error,
      });

      return result;
    } catch (err) {
      const durationMs = Date.now() - startMs;
      const message =
        err instanceof Error ? err.message : 'Unknown external service error';

      const call = this.pendingCalls.get(stageId);
      if (call) {
        call.status = 'failed';
        call.completedAt = new Date();
        call.result = { success: false, error: message, errorCode: 'UNHANDLED_ERROR' };
      }

      metricsService.incrementCounter(
        EXTERNAL_SERVICE_METRICS.EXECUTE_FAILURE,
        { provider: config.provider },
      );
      metricsService.recordLatency(
        EXTERNAL_SERVICE_METRICS.EXECUTE_LATENCY,
        durationMs,
        { provider: config.provider },
      );

      console.error(
        `[ExternalServiceAdapterService] executeExternalService failed for stage ${stageId}: ${message}`,
      );

      return { success: false, error: message, errorCode: 'UNHANDLED_ERROR' };
    }
  }

  /**
   * Handle an incoming webhook callback for a pipeline stage.
   */
  async handleWebhookResponse(
    stageId: string,
    headers: Record<string, string | string[] | undefined>,
    body: unknown,
  ): Promise<ExternalServiceResult> {
    metricsService.incrementCounter(EXTERNAL_SERVICE_METRICS.WEBHOOK_RECEIVED, {
      stageId,
    });

    const call = this.pendingCalls.get(stageId);
    if (!call) {
      console.error(
        `[ExternalServiceAdapterService] Webhook received for unknown stage: ${stageId}`,
      );
      metricsService.incrementCounter(
        EXTERNAL_SERVICE_METRICS.WEBHOOK_INVALID,
        { reason: 'unknown_stage' },
      );
      return {
        success: false,
        error: `No pending call for stage ${stageId}`,
        errorCode: 'UNKNOWN_STAGE',
      };
    }

    const adapter = ExternalServiceAdapterFactory.getAdapter(call.provider);

    // Validate signature
    if (!adapter.validateWebhook(headers, body)) {
      metricsService.incrementCounter(
        EXTERNAL_SERVICE_METRICS.WEBHOOK_INVALID,
        { reason: 'signature_invalid' },
      );
      console.error(
        `[ExternalServiceAdapterService] Webhook signature invalid for stage ${stageId}`,
      );
      return {
        success: false,
        error: 'Webhook signature validation failed',
        errorCode: 'INVALID_SIGNATURE',
      };
    }

    metricsService.incrementCounter(EXTERNAL_SERVICE_METRICS.WEBHOOK_VALID, {
      provider: call.provider,
    });

    // Parse the response
    const result = adapter.parseResponse(body);

    call.status = result.success ? 'completed' : 'failed';
    call.completedAt = new Date();
    call.result = result;

    auditService.log({
      eventType: 'EXTERNAL_SERVICE_WEBHOOK_RECEIVED' as never,
      actorType: 'system',
      channel: 'api',
      targetId: stageId,
      targetType: 'pipeline_stage',
      metadata: {
        provider: call.provider,
        success: result.success,
      },
      success: result.success,
      errorMessage: result.error,
    });

    return result;
  }

  /**
   * Return current status of an external service call.
   */
  getServiceStatus(
    stageId: string,
  ): { status: ExternalServiceStatus; result?: ExternalServiceResult } {
    const call = this.pendingCalls.get(stageId);
    if (!call) {
      return { status: 'unknown' };
    }
    return { status: call.status, result: call.result };
  }
}

export const externalServiceAdapterService = new ExternalServiceAdapterService();
