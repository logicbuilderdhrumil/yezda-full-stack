/**
 * Dashboard Service
 * Integration layer for home dashboard operations.
 */

import { ApiService } from './ApiService';
import type {
  DashboardSummaryDTO,
  ActivityItemDTO,
  WidgetDTO,
  ResponseMeta,
} from '@/@types/contracts';
import type { DashboardMetricsResponse, DashboardRefreshOptions } from '@/@types';

/** Cache storage for dashboard metrics. */
let cachedMetrics: DashboardMetricsResponse | null = null;
let cacheTimestamp: number | null = null;
const CACHE_TTL_MS = 60_000; // 1 minute cache

/**
 * Checks if the cached data is still valid.
 */
function isCacheValid(): boolean {
  if (!cachedMetrics || !cacheTimestamp) return false;
  return Date.now() - cacheTimestamp < CACHE_TTL_MS;
}

/**
 * DashboardService provides methods for dashboard data.
 */
export const DashboardService = {
  /**
   * Gets dashboard summary with metrics and recent activity.
   */
  async getSummary(): Promise<DashboardSummaryDTO> {
    const response = await ApiService.get<DashboardSummaryDTO>('dashboard.summary');
    return response.data;
  },

  /**
   * Gets dashboard widgets.
   */
  async getWidgets(): Promise<{ widgets: WidgetDTO[]; meta: ResponseMeta }> {
    const response = await ApiService.get<{ widgets: WidgetDTO[]; meta: ResponseMeta }>(
      'dashboard.widgets'
    );
    return response.data;
  },

  /**
   * Gets activity feed.
   */
  async getActivity(options?: {
    limit?: number;
    offset?: number;
    type?: string;
  }): Promise<{ activity: ActivityItemDTO[]; meta: ResponseMeta }> {
    const response = await ApiService.get<{
      activity: ActivityItemDTO[];
      meta: ResponseMeta;
    }>('dashboard.activity', { params: options });
    return response.data;
  },

  /**
   * Fetches dashboard metrics including KPIs, activities, and charts.
   * Results are cached for 1 minute unless force refresh is requested.
   */
  async getMetrics(options?: DashboardRefreshOptions): Promise<DashboardMetricsResponse> {
    if (!options?.force && isCacheValid() && cachedMetrics) {
      return cachedMetrics;
    }

    const response = await ApiService.get<DashboardMetricsResponse>('dashboard.metrics');
    cachedMetrics = response.data;
    cacheTimestamp = Date.now();
    return response.data;
  },

  /**
   * Clears the dashboard metrics cache.
   */
  clearCache(): void {
    cachedMetrics = null;
    cacheTimestamp = null;
  },

  /**
   * Forces a refresh of dashboard metrics.
   */
  async refresh(): Promise<DashboardMetricsResponse> {
    return this.getMetrics({ force: true });
  },
};
