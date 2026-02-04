/**
 * Shared Widgets Model
 * Task 1.1: Define shared widget data schemas and response envelopes
 */

import { z } from 'zod';

// ============================================================
// Table Data Types
// ============================================================

/**
 * Sort direction for table columns
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Table column definition
 */
export interface TableColumn {
  id: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'currency';
  sortable: boolean;
  filterable: boolean;
}

/**
 * Table row data with flexible columns
 */
export type TableRow = Record<string, string | number | boolean | null>;

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Sort metadata
 */
export interface SortMeta {
  column: string;
  direction: SortDirection;
}

/**
 * Table data response envelope
 */
export interface TableDataResponse {
  widgetId: string;
  widgetType: 'table';
  columns: TableColumn[];
  rows: TableRow[];
  pagination: PaginationMeta;
  sort?: SortMeta;
  filters?: Record<string, string | number | boolean>;
  generatedAt: string;
}

// ============================================================
// Visualization Data Types
// ============================================================

/**
 * Visualization widget types
 */
export type VisualizationType = 'line' | 'bar' | 'pie' | 'donut' | 'area' | 'scatter';

/**
 * Data point for time series or category-based charts
 */
export interface DataPoint {
  label: string;
  value: number;
  metadata?: Record<string, unknown>;
}

/**
 * Series data for multi-series charts
 */
export interface ChartSeries {
  id: string;
  name: string;
  color?: string;
  data: DataPoint[];
}

/**
 * Aggregated metric for summary widgets
 */
export interface AggregatedMetric {
  id: string;
  label: string;
  value: number;
  previousValue?: number;
  changePercent?: number;
  trend?: 'up' | 'down' | 'stable';
  unit?: string;
}

/**
 * Visualization data response envelope
 */
export interface VisualizationDataResponse {
  widgetId: string;
  widgetType: VisualizationType;
  title?: string;
  series: ChartSeries[];
  metrics?: AggregatedMetric[];
  timeRange?: {
    start: string;
    end: string;
    granularity: 'hour' | 'day' | 'week' | 'month';
  };
  generatedAt: string;
}

// ============================================================
// Widget Access Types
// ============================================================

/**
 * Widget category for access control grouping
 */
export type WidgetCategory = 'reporting' | 'analytics' | 'operational' | 'compliance';

/**
 * Widget access entry for audit purposes
 */
export interface WidgetAccessEntry {
  widgetId: string;
  widgetType: 'table' | VisualizationType;
  category: WidgetCategory;
  tenantId: string;
  userId: string;
  userType: 'user' | 'candidate';
  accessedAt: Date;
}

// ============================================================
// Available Widgets Catalog
// ============================================================

export const AVAILABLE_WIDGETS = [
  'candidates-overview-table',
  'screenings-status-table',
  'recent-applications-table',
  'compliance-checks-table',
  'screening-pipeline-chart',
  'completion-trends-chart',
  'status-distribution-pie',
  'monthly-volume-bar',
  'turnaround-metrics-chart',
  'compliance-score-gauge',
] as const;

export type AvailableWidget = (typeof AVAILABLE_WIDGETS)[number];

/**
 * Widget metadata registry
 */
export const WIDGET_METADATA: Record<AvailableWidget, { type: 'table' | VisualizationType; category: WidgetCategory }> = {
  'candidates-overview-table': { type: 'table', category: 'operational' },
  'screenings-status-table': { type: 'table', category: 'operational' },
  'recent-applications-table': { type: 'table', category: 'operational' },
  'compliance-checks-table': { type: 'table', category: 'compliance' },
  'screening-pipeline-chart': { type: 'line', category: 'analytics' },
  'completion-trends-chart': { type: 'area', category: 'analytics' },
  'status-distribution-pie': { type: 'pie', category: 'reporting' },
  'monthly-volume-bar': { type: 'bar', category: 'reporting' },
  'turnaround-metrics-chart': { type: 'line', category: 'analytics' },
  'compliance-score-gauge': { type: 'donut', category: 'compliance' },
};

// ============================================================
// Validation Schemas
// ============================================================

/**
 * Query schema for table data endpoints
 */
export const tableDataQuerySchema = z.object({
  widgetId: z.enum(AVAILABLE_WIDGETS),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortColumn: z.string().optional(),
  sortDirection: z.enum(['asc', 'desc']).optional(),
});

export type TableDataQuery = z.infer<typeof tableDataQuerySchema>;

/**
 * Query schema for visualization data endpoints
 */
export const visualizationDataQuerySchema = z.object({
  widgetId: z.enum(AVAILABLE_WIDGETS),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  granularity: z.enum(['hour', 'day', 'week', 'month']).default('day'),
});

export type VisualizationDataQuery = z.infer<typeof visualizationDataQuerySchema>;

/**
 * Check if a widget ID is valid
 */
export function isValidWidgetId(widgetId: string): widgetId is AvailableWidget {
  return AVAILABLE_WIDGETS.includes(widgetId as AvailableWidget);
}

/**
 * Get widget metadata
 */
export function getWidgetMetadata(widgetId: AvailableWidget): { type: 'table' | VisualizationType; category: WidgetCategory } {
  return WIDGET_METADATA[widgetId];
}

// ============================================================
// Service Result Types
// ============================================================

export interface SharedWidgetsServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
  cached?: boolean;
}
