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
};
