/**
 * Chat Metrics Service
 * Task 1.8: Define chat delivery SLOs and add metrics/alerts
 */

import { metricsService } from './metrics.service.js';

/** Metric names for chat operations */
export const CHAT_METRICS = {
  CONVERSATION_CREATE_SUCCESS: 'chat_conversation_create_success_total',
  CONVERSATION_CREATE_FAILURE: 'chat_conversation_create_failure_total',
  CONVERSATION_CREATE_LATENCY: 'chat_conversation_create_latency_ms',
  CONVERSATION_LIST_SUCCESS: 'chat_conversation_list_success_total',
  CONVERSATION_LIST_FAILURE: 'chat_conversation_list_failure_total',
  CONVERSATION_LIST_LATENCY: 'chat_conversation_list_latency_ms',
  MESSAGE_SEND_SUCCESS: 'chat_message_send_success_total',
  MESSAGE_SEND_FAILURE: 'chat_message_send_failure_total',
  MESSAGE_SEND_LATENCY: 'chat_message_send_latency_ms',
  MESSAGE_DELIVERY_SUCCESS: 'chat_message_delivery_success_total',
  MESSAGE_DELIVERY_FAILURE: 'chat_message_delivery_failure_total',
  MESSAGE_DELIVERY_LATENCY: 'chat_message_delivery_latency_ms',
  THREAD_READ_SUCCESS: 'chat_thread_read_success_total',
  THREAD_READ_FAILURE: 'chat_thread_read_failure_total',
  THREAD_READ_LATENCY: 'chat_thread_read_latency_ms',
  ACCESS_DENIED: 'chat_access_denied_total',
  RATE_LIMITED: 'chat_rate_limited_total',
  BROADCAST_SUCCESS: 'chat_broadcast_success_total',
  BROADCAST_FAILURE: 'chat_broadcast_failure_total',
} as const;

/** SLO targets for chat endpoints */
export const CHAT_SLOS = {
  // Latency SLOs
  MESSAGE_SEND_LATENCY_P99_MS: 500,
  MESSAGE_SEND_LATENCY_P95_MS: 200,
  MESSAGE_DELIVERY_LATENCY_P99_MS: 1000,
  MESSAGE_DELIVERY_LATENCY_P95_MS: 500,
  THREAD_READ_LATENCY_P99_MS: 300,
  THREAD_READ_LATENCY_P95_MS: 150,
  CONVERSATION_LIST_LATENCY_P99_MS: 200,
  CONVERSATION_LIST_LATENCY_P95_MS: 100,

  // Availability SLOs
  MESSAGE_SEND_SUCCESS_RATE: 99.5,
  MESSAGE_DELIVERY_SUCCESS_RATE: 99.0,
  THREAD_READ_SUCCESS_RATE: 99.9,
  CONVERSATION_LIST_SUCCESS_RATE: 99.9,

  // Security SLOs
  MAX_ACCESS_DENIED_RATE_PER_MINUTE: 100,
  MAX_RATE_LIMITED_RATE_PER_MINUTE: 200,
} as const;

class ChatMetricsService {
  /**
   * Record conversation create operation
   */
  recordConversationCreate(success: boolean, durationMs: number): void {
    metricsService.incrementCounter(
      success
        ? CHAT_METRICS.CONVERSATION_CREATE_SUCCESS
        : CHAT_METRICS.CONVERSATION_CREATE_FAILURE
    );
    metricsService.recordLatency(CHAT_METRICS.CONVERSATION_CREATE_LATENCY, durationMs);
  }

  /**
   * Record conversation list operation
   */
  recordConversationList(success: boolean, durationMs: number): void {
    metricsService.incrementCounter(
      success
        ? CHAT_METRICS.CONVERSATION_LIST_SUCCESS
        : CHAT_METRICS.CONVERSATION_LIST_FAILURE
    );
    metricsService.recordLatency(CHAT_METRICS.CONVERSATION_LIST_LATENCY, durationMs);
  }

  /**
   * Record message send operation
   */
  recordMessageSend(success: boolean, durationMs: number): void {
    metricsService.incrementCounter(
      success ? CHAT_METRICS.MESSAGE_SEND_SUCCESS : CHAT_METRICS.MESSAGE_SEND_FAILURE
    );
    metricsService.recordLatency(CHAT_METRICS.MESSAGE_SEND_LATENCY, durationMs);
  }

  /**
   * Record message delivery operation
   */
  recordMessageDelivery(success: boolean, durationMs: number): void {
    metricsService.incrementCounter(
      success ? CHAT_METRICS.MESSAGE_DELIVERY_SUCCESS : CHAT_METRICS.MESSAGE_DELIVERY_FAILURE
    );
    metricsService.recordLatency(CHAT_METRICS.MESSAGE_DELIVERY_LATENCY, durationMs);
  }

  /**
   * Record thread read operation
   */
  recordThreadRead(success: boolean, durationMs: number): void {
    metricsService.incrementCounter(
      success ? CHAT_METRICS.THREAD_READ_SUCCESS : CHAT_METRICS.THREAD_READ_FAILURE
    );
    metricsService.recordLatency(CHAT_METRICS.THREAD_READ_LATENCY, durationMs);
  }

  /**
   * Record broadcast result
   */
  recordBroadcast(success: boolean): void {
    metricsService.incrementCounter(
      success ? CHAT_METRICS.BROADCAST_SUCCESS : CHAT_METRICS.BROADCAST_FAILURE
    );
  }

  /**
   * Record access denied event
   */
  recordAccessDenied(): void {
    metricsService.incrementCounter(CHAT_METRICS.ACCESS_DENIED);
  }

  /**
   * Record rate limit hit
   */
  recordRateLimited(): void {
    metricsService.incrementCounter(CHAT_METRICS.RATE_LIMITED);
  }

  /**
   * Get message send P99 latency
   */
  getMessageSendP99Latency(windowMs = 60000): number {
    const recentMetrics = metricsService.getMetrics(windowMs);
    const latencies = recentMetrics
      .filter((m) => m.name === CHAT_METRICS.MESSAGE_SEND_LATENCY)
      .map((m) => m.value)
      .sort((a, b) => a - b);

    if (latencies.length === 0) return 0;

    const p99Index = Math.floor(latencies.length * 0.99);
    return latencies[p99Index] || latencies[latencies.length - 1];
  }

  /**
   * Get message send success rate
   */
  getMessageSendSuccessRate(windowMs = 60000): number {
    const recentMetrics = metricsService.getMetrics(windowMs);
    const successes = recentMetrics.filter(
      (m) => m.name === CHAT_METRICS.MESSAGE_SEND_SUCCESS
    ).length;
    const failures = recentMetrics.filter(
      (m) => m.name === CHAT_METRICS.MESSAGE_SEND_FAILURE
    ).length;
    const total = successes + failures;
    return total > 0 ? (successes / total) * 100 : 100;
  }

  /**
   * Get message delivery P99 latency
   */
  getMessageDeliveryP99Latency(windowMs = 60000): number {
    const recentMetrics = metricsService.getMetrics(windowMs);
    const latencies = recentMetrics
      .filter((m) => m.name === CHAT_METRICS.MESSAGE_DELIVERY_LATENCY)
      .map((m) => m.value)
      .sort((a, b) => a - b);

    if (latencies.length === 0) return 0;

    const p99Index = Math.floor(latencies.length * 0.99);
    return latencies[p99Index] || latencies[latencies.length - 1];
  }

  /**
   * Get thread read P99 latency
   */
  getThreadReadP99Latency(windowMs = 60000): number {
    const recentMetrics = metricsService.getMetrics(windowMs);
    const latencies = recentMetrics
      .filter((m) => m.name === CHAT_METRICS.THREAD_READ_LATENCY)
      .map((m) => m.value)
      .sort((a, b) => a - b);

    if (latencies.length === 0) return 0;

    const p99Index = Math.floor(latencies.length * 0.99);
    return latencies[p99Index] || latencies[latencies.length - 1];
  }

  /**
   * Get access denied count
   */
  getAccessDeniedCount(windowMs = 60000): number {
    const recentMetrics = metricsService.getMetrics(windowMs);
    return recentMetrics.filter((m) => m.name === CHAT_METRICS.ACCESS_DENIED).length;
  }

  /**
   * Get rate limited count
   */
  getRateLimitedCount(windowMs = 60000): number {
    const recentMetrics = metricsService.getMetrics(windowMs);
    return recentMetrics.filter((m) => m.name === CHAT_METRICS.RATE_LIMITED).length;
  }

  /**
   * Check if chat SLOs are met
   */
  checkSLOs(): { met: boolean; violations: string[] } {
    const violations: string[] = [];

    // Message send latency SLO
    const sendP99Latency = this.getMessageSendP99Latency();
    if (sendP99Latency > CHAT_SLOS.MESSAGE_SEND_LATENCY_P99_MS) {
      violations.push(
        `Chat message send P99 latency ${sendP99Latency}ms exceeds SLO ${CHAT_SLOS.MESSAGE_SEND_LATENCY_P99_MS}ms`
      );
    }

    // Message send success rate SLO
    const sendSuccessRate = this.getMessageSendSuccessRate();
    if (sendSuccessRate < CHAT_SLOS.MESSAGE_SEND_SUCCESS_RATE) {
      violations.push(
        `Chat message send success rate ${sendSuccessRate.toFixed(2)}% below SLO ${CHAT_SLOS.MESSAGE_SEND_SUCCESS_RATE}%`
      );
    }

    // Message delivery latency SLO
    const deliveryP99Latency = this.getMessageDeliveryP99Latency();
    if (deliveryP99Latency > CHAT_SLOS.MESSAGE_DELIVERY_LATENCY_P99_MS) {
      violations.push(
        `Chat message delivery P99 latency ${deliveryP99Latency}ms exceeds SLO ${CHAT_SLOS.MESSAGE_DELIVERY_LATENCY_P99_MS}ms`
      );
    }

    // Thread read latency SLO
    const threadReadP99Latency = this.getThreadReadP99Latency();
    if (threadReadP99Latency > CHAT_SLOS.THREAD_READ_LATENCY_P99_MS) {
      violations.push(
        `Chat thread read P99 latency ${threadReadP99Latency}ms exceeds SLO ${CHAT_SLOS.THREAD_READ_LATENCY_P99_MS}ms`
      );
    }

    // Access denied rate
    const accessDeniedCount = this.getAccessDeniedCount();
    if (accessDeniedCount > CHAT_SLOS.MAX_ACCESS_DENIED_RATE_PER_MINUTE) {
      violations.push(
        `Chat access denied rate ${accessDeniedCount}/min exceeds SLO ${CHAT_SLOS.MAX_ACCESS_DENIED_RATE_PER_MINUTE}/min`
      );
    }

    // Rate limited rate
    const rateLimitedCount = this.getRateLimitedCount();
    if (rateLimitedCount > CHAT_SLOS.MAX_RATE_LIMITED_RATE_PER_MINUTE) {
      violations.push(
        `Chat rate limited rate ${rateLimitedCount}/min exceeds SLO ${CHAT_SLOS.MAX_RATE_LIMITED_RATE_PER_MINUTE}/min`
      );
    }

    return {
      met: violations.length === 0,
      violations,
    };
  }
}

export const chatMetricsService = new ChatMetricsService();
