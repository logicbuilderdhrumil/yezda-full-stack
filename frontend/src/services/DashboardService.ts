/**
 * Dashboard Service
 * Fetches dashboard metrics, activities, and charts for the home dashboard.
 */

import { ApiService } from '@/services/ApiService';
import type {
  DashboardMetricsResponse,
  DashboardRefreshOptions,
} from '@/@types';

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
 * DashboardService provides methods for fetching dashboard data.
 */
export const DashboardService = {
  /**
   * Fetches dashboard metrics including KPIs, activities, and charts.
   * Results are cached for 1 minute unless force refresh is requested.
   * @param options - Optional refresh options
   * @returns Dashboard metrics response
   */
  async getMetrics(options?: DashboardRefreshOptions): Promise<DashboardMetricsResponse> {
    // Return cached data if valid and not forcing refresh
    if (!options?.force && isCacheValid() && cachedMetrics) {
      return cachedMetrics;
    }

    const response = await ApiService.get<DashboardMetricsResponse>(
      'dashboard.metrics'
    );

    // Update cache
    cachedMetrics = response.data;
    cacheTimestamp = Date.now();

    return response.data;
  },

  /**
   * Clears the dashboard metrics cache.
   * Useful when data has been modified elsewhere.
   */
  clearCache(): void {
    cachedMetrics = null;
    cacheTimestamp = null;
  },

  /**
   * Forces a refresh of dashboard metrics.
   * @returns Dashboard metrics response
   */
  async refresh(): Promise<DashboardMetricsResponse> {
    return this.getMetrics({ force: true });
  },
};
