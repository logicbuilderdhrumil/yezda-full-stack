/**
 * useDashboard hook tests.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useDashboard } from './useDashboard';
import { DashboardService } from '@/services';
import type { DashboardMetricsResponse } from '@/@types';

// Mock DashboardService
vi.mock('@/services', () => ({
  DashboardService: {
    getMetrics: vi.fn(),
  },
}));

const mockMetrics: DashboardMetricsResponse = {
  kpis: [
    {
      id: 'kpi-1',
      title: 'Total Users',
      value: 100,
    },
  ],
  activities: [],
  charts: [],
  lastUpdated: '2026-02-04T10:00:00Z',
};

describe('useDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts in loading state', () => {
    vi.mocked(DashboardService.getMetrics).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { result } = renderHook(() => useDashboard());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('fetches and returns dashboard data', async () => {
    vi.mocked(DashboardService.getMetrics).mockResolvedValue(mockMetrics);

    const { result } = renderHook(() => useDashboard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockMetrics);
    expect(result.current.lastUpdated).toBe(mockMetrics.lastUpdated);
    expect(result.current.error).toBeNull();
  });

  it('handles fetch errors', async () => {
    const errorMessage = 'Network error';
    vi.mocked(DashboardService.getMetrics).mockRejectedValue(
      new Error(errorMessage)
    );

    const { result } = renderHook(() => useDashboard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.data).toBeNull();
  });

  it('refresh function forces data reload', async () => {
    vi.mocked(DashboardService.getMetrics).mockResolvedValue(mockMetrics);

    const { result } = renderHook(() => useDashboard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(DashboardService.getMetrics).toHaveBeenCalledTimes(1);

    // Trigger refresh
    await act(async () => {
      await result.current.refresh();
    });

    expect(DashboardService.getMetrics).toHaveBeenCalledTimes(2);
    expect(DashboardService.getMetrics).toHaveBeenLastCalledWith({ force: true });
  });
});
