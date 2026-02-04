/**
 * Chart Service
 * Integration layer for charting and data visualization operations.
 */

import { ApiService } from './ApiService';
import type {
  ChartType,
  ChartDataRequest,
  ChartDataResponseDTO,
  SavedChartDTO,
  DateRange,
  ResponseMeta,
} from '@/@types/contracts';

/**
 * ChartService provides methods for chart data and management.
 */
export const ChartService = {
  /**
   * Gets chart data for a specific chart type.
   */
  async getData(
    chartType: ChartType,
    params?: {
      dateRange?: DateRange;
      filters?: Record<string, unknown>;
      groupBy?: string;
    }
  ): Promise<ChartDataResponseDTO> {
    const response = await ApiService.get<ChartDataResponseDTO>('charts.data', {
      pathParams: { chartType },
      params: {
        ...(params?.dateRange && {
          startDate: params.dateRange.start,
          endDate: params.dateRange.end,
        }),
        ...(params?.groupBy && { groupBy: params.groupBy }),
        ...(params?.filters && { filters: JSON.stringify(params.filters) }),
      },
    });
    return response.data;
  },

  /**
   * Exports chart data to a file.
   */
  async export(
    chartType: ChartType,
    format: 'csv' | 'xlsx' | 'pdf',
    params?: {
      dateRange?: DateRange;
      filters?: Record<string, unknown>;
    }
  ): Promise<Blob> {
    const response = await ApiService.get<Blob>('charts.export', {
      pathParams: { chartType },
      params: {
        format,
        ...(params?.dateRange && {
          startDate: params.dateRange.start,
          endDate: params.dateRange.end,
        }),
        ...(params?.filters && { filters: JSON.stringify(params.filters) }),
      },
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Lists saved charts.
   */
  async listSaved(options?: {
    limit?: number;
    offset?: number;
  }): Promise<{ charts: SavedChartDTO[]; meta: ResponseMeta }> {
    const response = await ApiService.get<{ charts: SavedChartDTO[]; meta: ResponseMeta }>(
      'charts.saved',
      { params: options }
    );
    return response.data;
  },

  /**
   * Saves a chart configuration.
   */
  async save(data: {
    name: string;
    chartType: ChartType;
    config: ChartDataRequest;
  }): Promise<SavedChartDTO> {
    const response = await ApiService.post<SavedChartDTO>('charts.save', data);
    return response.data;
  },

  /**
   * Deletes a saved chart.
   */
  async deleteSaved(chartId: string): Promise<void> {
    await ApiService.delete<void>('charts.delete', {
      pathParams: { id: chartId },
    });
  },
};
