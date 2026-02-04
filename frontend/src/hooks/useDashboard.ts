/**
 * useDashboard hook for fetching and managing dashboard data.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { DashboardService } from '@/services';
import type { DashboardMetricsResponse } from '@/@types';

/** Dashboard hook state. */
export interface UseDashboardState {
  /** Dashboard metrics data. */
  data: DashboardMetricsResponse | null;
  /** Whether data is currently loading. */
  isLoading: boolean;
  /** Error message if fetch failed. */
  error: string | null;
  /** Timestamp of last successful fetch. */
  lastUpdated: string | null;
}

/** Dashboard hook return value. */
export interface UseDashboardReturn extends UseDashboardState {
  /** Refresh dashboard data. */
  refresh: () => Promise<void>;
}

/**
 * Hook for fetching dashboard metrics with caching and refresh.
 * @returns Dashboard state and refresh function
 */
export function useDashboard(): UseDashboardReturn {
  const [state, setState] = useState<UseDashboardState>({
    data: null,
    isLoading: true,
    error: null,
    lastUpdated: null,
  });

  const isMounted = useRef(true);

  const fetchData = useCallback(async (force = false) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const data = await DashboardService.getMetrics({ force });

      if (isMounted.current) {
        setState({
          data,
          isLoading: false,
          error: null,
          lastUpdated: data.lastUpdated,
        });
      }
    } catch (err) {
      if (isMounted.current) {
        const message =
          err instanceof Error ? err.message : 'Failed to load dashboard';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: message,
        }));
      }
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  useEffect(() => {
    isMounted.current = true;
    fetchData();

    return () => {
      isMounted.current = false;
    };
  }, [fetchData]);

  return {
    ...state,
    refresh,
  };
}
