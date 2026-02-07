/**
 * Shared widgets index - exports all shared components and utilities.
 */

// DataTable
export {
  DataTable,
  type ColumnDef,
  type SortState,
  type SortDirection,
  type DataTableProps,
} from './DataTable';

// Chart (recharts-based)
export {
  Chart,
  ChartBar,
  ChartArea,
  ChartPie,
  Sparkline,
  ChartLoading,
  ChartEmpty,
  useChartColors,
  type BaseChartProps,
  type ChartSeries,
  type LineChartProps,
  type BarChartProps,
  type AreaChartProps,
  type PieChartProps,
  type SparklineProps,
  type ChartLoadingProps,
  type ChartEmptyProps,
} from './Chart';

// State components
export {
  LoadingState,
  EmptyState,
  ErrorState,
  NoResultsState,
  ContentPlaceholder,
  type LoadingStateProps,
  type EmptyStateProps,
  type ErrorStateProps,
  type NoResultsStateProps,
  type ContentPlaceholderProps,
} from './StateComponents';

// Rich text editor
export {
  RichTextEditor,
  RichTextViewer,
  type RichTextEditorProps,
  type RichTextViewerProps,
  type TextFormat,
  type HeadingLevel,
  type ListType,
  type TextAlign,
  type ToolbarAction,
} from './RichTextEditor';

// Visualizations (Map, Gantt)
export {
  Map,
  Gantt,
  type MapMarker,
  type MapProps,
  type GanttTask,
  type GanttProps,
} from './Visualizations';

// Organization selector
export { OrganizationSelector } from './OrganizationSelector';

// Document preview dialog
export { DocumentPreviewDialog } from './DocumentPreviewDialog';

// App download button
export { AppDownloadButton } from './AppDownloadButton';

// Online status indicator
export { OnlineStatusIndicator } from './OnlineStatusIndicator';

// Utilities
export {
  // Pagination
  paginate,
  getPaginationOffset,
  generatePageNumbers,
  type PaginationState,
  type PaginatedResult,
  // Filtering
  getNestedValue,
  matchesCondition,
  matchesFilterGroup,
  filterItems,
  type FilterOperator,
  type FilterCondition,
  type FilterGroup,
  // Search
  searchItems,
  highlightMatches,
  type SearchOptions,
  // Sorting
  sortItems,
  type SortConfig,
  // Export
  exportToCsv,
  exportToJson,
  exportData,
  downloadFile,
  type ExportOptions,
} from './utils';
