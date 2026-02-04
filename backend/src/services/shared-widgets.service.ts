/**
 * Shared Widgets Service
 * Tasks 1.2, 1.3, 1.4, 1.5, 1.6, 1.7: Widget data service with caching, audit, tenant isolation
 */

import type {
  AvailableWidget,
  TableDataResponse,
  VisualizationDataResponse,
  TableColumn,
  TableRow,
  ChartSeries,
  AggregatedMetric,
  SharedWidgetsServiceResult,
  SortMeta,
  PaginationMeta,
} from '../models/shared-widgets.model.js';
import { WIDGET_METADATA, getWidgetMetadata, isValidWidgetId } from '../models/shared-widgets.model.js';
import { auditService } from './audit.service.js';
import { sharedWidgetsMetricsService } from './shared-widgets-metrics.service.js';

// ============================================================
// In-Memory Cache
// ============================================================

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  tenantId: string;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const tableDataCache = new Map<string, CacheEntry<TableDataResponse>>();
const visualizationDataCache = new Map<string, CacheEntry<VisualizationDataResponse>>();

function getCacheKey(tenantId: string, widgetId: string, params?: Record<string, unknown>): string {
  const baseKey = `${tenantId}:${widgetId}`;
  if (!params) return baseKey;
  return `${baseKey}:${JSON.stringify(params)}`;
}

function cleanExpiredCache(): void {
  const now = Date.now();
  for (const [key, entry] of tableDataCache.entries()) {
    if (entry.expiresAt < now) {
      tableDataCache.delete(key);
    }
  }
  for (const [key, entry] of visualizationDataCache.entries()) {
    if (entry.expiresAt < now) {
      visualizationDataCache.delete(key);
    }
  }
}

// Run cache cleanup every minute
setInterval(cleanExpiredCache, 60 * 1000);

// ============================================================
// Mock Data Generators
// ============================================================

function generateMockTableData(
  widgetId: AvailableWidget,
  page: number,
  pageSize: number,
  sortColumn?: string,
  sortDirection?: 'asc' | 'desc'
): { columns: TableColumn[]; rows: TableRow[]; totalItems: number } {
  let columns: TableColumn[];
  let allRows: TableRow[];

  switch (widgetId) {
    case 'candidates-overview-table':
      columns = [
        { id: 'name', label: 'Candidate Name', type: 'string', sortable: true, filterable: true },
        { id: 'email', label: 'Email', type: 'string', sortable: true, filterable: true },
        { id: 'status', label: 'Status', type: 'string', sortable: true, filterable: true },
        { id: 'appliedDate', label: 'Applied Date', type: 'date', sortable: true, filterable: false },
        { id: 'progress', label: 'Progress', type: 'number', sortable: true, filterable: false },
      ];
      allRows = Array.from({ length: 47 }, (_, i) => ({
        id: `cand-${i + 1}`,
        name: `Candidate ${i + 1}`,
        email: `candidate${i + 1}@example.com`,
        status: ['pending', 'in-progress', 'completed', 'rejected'][i % 4],
        appliedDate: new Date(Date.now() - i * 86400000).toISOString(),
        progress: Math.min(100, (i % 5) * 25),
      }));
      break;

    case 'screenings-status-table':
      columns = [
        { id: 'screeningId', label: 'Screening ID', type: 'string', sortable: true, filterable: true },
        { id: 'candidateName', label: 'Candidate', type: 'string', sortable: true, filterable: true },
        { id: 'type', label: 'Type', type: 'string', sortable: true, filterable: true },
        { id: 'status', label: 'Status', type: 'string', sortable: true, filterable: true },
        { id: 'dueDate', label: 'Due Date', type: 'date', sortable: true, filterable: false },
      ];
      allRows = Array.from({ length: 35 }, (_, i) => ({
        id: `scr-${i + 1}`,
        screeningId: `SCR-${1000 + i}`,
        candidateName: `Candidate ${i + 1}`,
        type: ['background', 'reference', 'identity', 'employment'][i % 4],
        status: ['pending', 'in-progress', 'completed', 'failed'][i % 4],
        dueDate: new Date(Date.now() + i * 86400000).toISOString(),
      }));
      break;

    case 'recent-applications-table':
      columns = [
        { id: 'applicationId', label: 'Application ID', type: 'string', sortable: true, filterable: true },
        { id: 'applicantName', label: 'Applicant', type: 'string', sortable: true, filterable: true },
        { id: 'position', label: 'Position', type: 'string', sortable: true, filterable: true },
        { id: 'submittedAt', label: 'Submitted', type: 'date', sortable: true, filterable: false },
        { id: 'status', label: 'Status', type: 'string', sortable: true, filterable: true },
      ];
      allRows = Array.from({ length: 28 }, (_, i) => ({
        id: `app-${i + 1}`,
        applicationId: `APP-${2000 + i}`,
        applicantName: `Applicant ${i + 1}`,
        position: ['Engineer', 'Manager', 'Analyst', 'Director'][i % 4],
        submittedAt: new Date(Date.now() - i * 3600000).toISOString(),
        status: ['new', 'reviewing', 'approved', 'rejected'][i % 4],
      }));
      break;

    case 'compliance-checks-table':
      columns = [
        { id: 'checkId', label: 'Check ID', type: 'string', sortable: true, filterable: true },
        { id: 'type', label: 'Check Type', type: 'string', sortable: true, filterable: true },
        { id: 'result', label: 'Result', type: 'string', sortable: true, filterable: true },
        { id: 'completedAt', label: 'Completed', type: 'date', sortable: true, filterable: false },
        { id: 'score', label: 'Score', type: 'number', sortable: true, filterable: false },
      ];
      allRows = Array.from({ length: 52 }, (_, i) => ({
        id: `chk-${i + 1}`,
        checkId: `CHK-${3000 + i}`,
        type: ['identity', 'criminal', 'employment', 'education', 'credit'][i % 5],
        result: ['pass', 'fail', 'review', 'pending'][i % 4],
        completedAt: new Date(Date.now() - i * 7200000).toISOString(),
        score: 60 + (i % 41),
      }));
      break;

    default:
      columns = [];
      allRows = [];
  }

  // Apply sorting
  if (sortColumn && allRows.length > 0) {
    const col = columns.find((c) => c.id === sortColumn);
    if (col?.sortable) {
      allRows.sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        if (aVal === null) return 1;
        if (bVal === null) return -1;
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortDirection === 'desc' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
        }
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'desc' ? bVal - aVal : aVal - bVal;
        }
        return 0;
      });
    }
  }

  // Paginate
  const start = (page - 1) * pageSize;
  const rows = allRows.slice(start, start + pageSize);

  return { columns, rows, totalItems: allRows.length };
}

function generateMockVisualizationData(
  widgetId: AvailableWidget,
  startDate?: string,
  endDate?: string,
  granularity: 'hour' | 'day' | 'week' | 'month' = 'day'
): { series: ChartSeries[]; metrics?: AggregatedMetric[]; timeRange?: { start: string; end: string; granularity: string } } {
  const now = new Date();
  const start = startDate ? new Date(startDate) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : now;

  const metadata = getWidgetMetadata(widgetId);
  let series: ChartSeries[] = [];
  let metrics: AggregatedMetric[] | undefined;

  switch (widgetId) {
    case 'screening-pipeline-chart':
      series = [
        {
          id: 'submitted',
          name: 'Submitted',
          color: '#3B82F6',
          data: generateTimeSeriesData(start, end, granularity, 100, 200),
        },
        {
          id: 'in-progress',
          name: 'In Progress',
          color: '#F59E0B',
          data: generateTimeSeriesData(start, end, granularity, 50, 150),
        },
        {
          id: 'completed',
          name: 'Completed',
          color: '#10B981',
          data: generateTimeSeriesData(start, end, granularity, 80, 180),
        },
      ];
      break;

    case 'completion-trends-chart':
      series = [
        {
          id: 'completions',
          name: 'Completions',
          color: '#10B981',
          data: generateTimeSeriesData(start, end, granularity, 20, 80),
        },
        {
          id: 'target',
          name: 'Target',
          color: '#6B7280',
          data: generateTimeSeriesData(start, end, granularity, 50, 50),
        },
      ];
      break;

    case 'status-distribution-pie':
      series = [
        {
          id: 'distribution',
          name: 'Status Distribution',
          data: [
            { label: 'Completed', value: 45 },
            { label: 'In Progress', value: 30 },
            { label: 'Pending', value: 15 },
            { label: 'Rejected', value: 10 },
          ],
        },
      ];
      break;

    case 'monthly-volume-bar':
      series = [
        {
          id: 'volume',
          name: 'Monthly Volume',
          color: '#3B82F6',
          data: [
            { label: 'Jan', value: 120 },
            { label: 'Feb', value: 145 },
            { label: 'Mar', value: 132 },
            { label: 'Apr', value: 168 },
            { label: 'May', value: 155 },
            { label: 'Jun', value: 178 },
          ],
        },
      ];
      break;

    case 'turnaround-metrics-chart':
      series = [
        {
          id: 'avg-turnaround',
          name: 'Avg Turnaround (hours)',
          color: '#8B5CF6',
          data: generateTimeSeriesData(start, end, granularity, 24, 72),
        },
      ];
      metrics = [
        { id: 'avg-tat', label: 'Average TAT', value: 48, previousValue: 52, changePercent: -7.7, trend: 'down', unit: 'hours' },
        { id: 'p95-tat', label: 'P95 TAT', value: 96, previousValue: 102, changePercent: -5.9, trend: 'down', unit: 'hours' },
      ];
      break;

    case 'compliance-score-gauge':
      series = [
        {
          id: 'score',
          name: 'Compliance Score',
          data: [{ label: 'Score', value: 87 }],
        },
      ];
      metrics = [
        { id: 'overall-score', label: 'Overall Score', value: 87, previousValue: 82, changePercent: 6.1, trend: 'up', unit: '%' },
        { id: 'checks-passed', label: 'Checks Passed', value: 156, previousValue: 148, changePercent: 5.4, trend: 'up' },
      ];
      break;

    default:
      series = [];
  }

  return {
    series,
    metrics,
    timeRange: metadata.type !== 'pie' && metadata.type !== 'donut'
      ? { start: start.toISOString(), end: end.toISOString(), granularity }
      : undefined,
  };
}

function generateTimeSeriesData(
  start: Date,
  end: Date,
  granularity: 'hour' | 'day' | 'week' | 'month',
  minValue: number,
  maxValue: number
): { label: string; value: number }[] {
  const data: { label: string; value: number }[] = [];
  const current = new Date(start);

  const incrementMap = {
    hour: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
  };

  while (current <= end) {
    data.push({
      label: current.toISOString(),
      value: Math.floor(minValue + Math.random() * (maxValue - minValue)),
    });
    current.setTime(current.getTime() + incrementMap[granularity]);
  }

  return data;
}

// ============================================================
// Service Implementation
// ============================================================

export class SharedWidgetsService {
  /**
   * Task 1.2: Get table data with pagination and sorting
   */
  async getTableData(
    tenantId: string,
    widgetId: AvailableWidget,
    options: {
      page?: number;
      pageSize?: number;
      sortColumn?: string;
      sortDirection?: 'asc' | 'desc';
    } = {},
    userId?: string,
    userType?: 'user' | 'candidate',
    ipAddress?: string
  ): Promise<SharedWidgetsServiceResult<TableDataResponse>> {
    const startTime = Date.now();
    const { page = 1, pageSize = 20, sortColumn, sortDirection } = options;

    // Validate widget ID
    if (!isValidWidgetId(widgetId)) {
      sharedWidgetsMetricsService.recordFailure(Date.now() - startTime);
      return { success: false, error: 'Invalid widget ID', errorCode: 'INVALID_WIDGET' };
    }

    const metadata = getWidgetMetadata(widgetId);
    if (metadata.type !== 'table') {
      sharedWidgetsMetricsService.recordFailure(Date.now() - startTime);
      return { success: false, error: 'Widget is not a table type', errorCode: 'INVALID_WIDGET_TYPE' };
    }

    // Check cache
    const cacheKey = getCacheKey(tenantId, widgetId, { page, pageSize, sortColumn, sortDirection });
    const cached = tableDataCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now() && cached.tenantId === tenantId) {
      // Task 1.6: Audit logging for widget access
      this.logWidgetAccess(widgetId, tenantId, userId, userType, ipAddress, true);
      sharedWidgetsMetricsService.recordSuccess(Date.now() - startTime, true);
      return { success: true, data: cached.data, cached: true };
    }

    // Generate data
    const { columns, rows, totalItems } = generateMockTableData(
      widgetId,
      page,
      pageSize,
      sortColumn,
      sortDirection
    );

    const totalPages = Math.ceil(totalItems / pageSize);
    const pagination: PaginationMeta = {
      page,
      pageSize,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };

    const sort: SortMeta | undefined =
      sortColumn && sortDirection ? { column: sortColumn, direction: sortDirection } : undefined;

    const response: TableDataResponse = {
      widgetId,
      widgetType: 'table',
      columns,
      rows,
      pagination,
      sort,
      generatedAt: new Date().toISOString(),
    };

    // Cache response
    tableDataCache.set(cacheKey, {
      data: response,
      expiresAt: Date.now() + CACHE_TTL_MS,
      tenantId,
    });

    // Task 1.6: Audit logging for widget access
    this.logWidgetAccess(widgetId, tenantId, userId, userType, ipAddress, false);
    sharedWidgetsMetricsService.recordSuccess(Date.now() - startTime, false);

    return { success: true, data: response, cached: false };
  }

  /**
   * Task 1.3: Get visualization data
   */
  async getVisualizationData(
    tenantId: string,
    widgetId: AvailableWidget,
    options: {
      startDate?: string;
      endDate?: string;
      granularity?: 'hour' | 'day' | 'week' | 'month';
    } = {},
    userId?: string,
    userType?: 'user' | 'candidate',
    ipAddress?: string
  ): Promise<SharedWidgetsServiceResult<VisualizationDataResponse>> {
    const startTime = Date.now();
    const { startDate, endDate, granularity = 'day' } = options;

    // Validate widget ID
    if (!isValidWidgetId(widgetId)) {
      sharedWidgetsMetricsService.recordFailure(Date.now() - startTime);
      return { success: false, error: 'Invalid widget ID', errorCode: 'INVALID_WIDGET' };
    }

    const metadata = getWidgetMetadata(widgetId);
    if (metadata.type === 'table') {
      sharedWidgetsMetricsService.recordFailure(Date.now() - startTime);
      return { success: false, error: 'Widget is a table type, use table endpoint', errorCode: 'INVALID_WIDGET_TYPE' };
    }

    // Check cache
    const cacheKey = getCacheKey(tenantId, widgetId, { startDate, endDate, granularity });
    const cached = visualizationDataCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now() && cached.tenantId === tenantId) {
      this.logWidgetAccess(widgetId, tenantId, userId, userType, ipAddress, true);
      sharedWidgetsMetricsService.recordSuccess(Date.now() - startTime, true);
      return { success: true, data: cached.data, cached: true };
    }

    // Generate data
    const { series, metrics, timeRange } = generateMockVisualizationData(
      widgetId,
      startDate,
      endDate,
      granularity
    );

    const response: VisualizationDataResponse = {
      widgetId,
      widgetType: metadata.type,
      series,
      metrics,
      timeRange: timeRange as VisualizationDataResponse['timeRange'],
      generatedAt: new Date().toISOString(),
    };

    // Cache response
    visualizationDataCache.set(cacheKey, {
      data: response,
      expiresAt: Date.now() + CACHE_TTL_MS,
      tenantId,
    });

    // Task 1.6: Audit logging
    this.logWidgetAccess(widgetId, tenantId, userId, userType, ipAddress, false);
    sharedWidgetsMetricsService.recordSuccess(Date.now() - startTime, false);

    return { success: true, data: response, cached: false };
  }

  /**
   * Task 1.5: Validate tenant access to widget data
   */
  validateTenantAccess(
    requestedTenantId: string,
    userTenantId: string,
    widgetId: string,
    userId: string,
    userType: 'user' | 'candidate',
    ipAddress?: string
  ): { allowed: boolean; error?: string } {
    if (requestedTenantId !== userTenantId) {
      // Log cross-tenant access attempt
      auditService.log({
        eventType: 'WIDGET_ACCESS_DENIED',
        actorId: userId,
        actorType: userType,
        targetId: widgetId,
        targetType: 'widget',
        channel: 'api',
        ipAddress,
        metadata: {
          requestedTenantId,
          actualTenantId: userTenantId,
          reason: 'Cross-tenant access denied',
        },
        success: false,
        errorMessage: 'Cross-tenant widget access denied',
      });

      return { allowed: false, error: 'Access denied to widget data outside your tenant scope' };
    }

    return { allowed: true };
  }

  /**
   * Get list of available widgets
   */
  getAvailableWidgets(): { id: AvailableWidget; type: string; category: string }[] {
    return Object.entries(WIDGET_METADATA).map(([id, meta]) => ({
      id: id as AvailableWidget,
      type: meta.type,
      category: meta.category,
    }));
  }

  /**
   * Task 1.8: Check SLO compliance
   */
  checkSLOs() {
    return sharedWidgetsMetricsService.checkSLOs();
  }

  /**
   * Task 1.6: Log widget access audit event
   */
  private logWidgetAccess(
    widgetId: string,
    tenantId: string,
    userId?: string,
    userType?: 'user' | 'candidate',
    ipAddress?: string,
    cached?: boolean
  ): void {
    auditService.log({
      eventType: 'WIDGET_DATA_ACCESSED',
      actorId: userId,
      actorType: userType,
      targetId: widgetId,
      targetType: 'widget',
      channel: 'api',
      ipAddress,
      metadata: {
        tenantId,
        widgetId,
        cached,
        timestamp: new Date().toISOString(),
      },
      success: true,
    });
  }

  /**
   * Clear cache (for testing)
   */
  clearCache(): void {
    tableDataCache.clear();
    visualizationDataCache.clear();
  }
}

export const sharedWidgetsService = new SharedWidgetsService();
