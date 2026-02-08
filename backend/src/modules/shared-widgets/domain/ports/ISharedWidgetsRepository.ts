import type { Widget, TableDataResult, VisualizationResult, WidgetsHealth } from '../entities/shared-widgets.entity.js';

export interface TableDataQuery { page?: number; pageSize?: number; sortColumn?: string; sortDirection?: 'asc' | 'desc'; }
export interface VisualizationQuery { startDate?: string; endDate?: string; granularity?: string; }

export interface ISharedWidgetsRepository {
  getAvailableWidgets(): Promise<Widget[]>;
  getTableData(tenantId: string | null, widgetId: string, query: TableDataQuery): Promise<TableDataResult>;
  getVisualizationData(tenantId: string | null, widgetId: string, query: VisualizationQuery): Promise<VisualizationResult>;
  getHealth(): Promise<WidgetsHealth>;
}
