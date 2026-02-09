/**
 * Shared Widgets domain entity.
 */
export interface Widget {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface TableDataRow {
  [key: string]: unknown;
}

export interface TableDataResult {
  rows: TableDataRow[];
  total: number;
  page: number;
  pageSize: number;
}

export interface VisualizationDataPoint {
  timestamp: Date;
  value: number;
  label?: string;
}

export interface VisualizationResult {
  widgetId: string;
  dataPoints: VisualizationDataPoint[];
  granularity: string;
}

export interface WidgetsHealth {
  status: string;
  widgetsAvailable: number;
  sloCompliance: Record<string, boolean>;
}
