/**
 * Dashboard module mock fixtures.
 * Provides fake data for dashboard summary, trends, and activity endpoints.
 * Aligned with BackendDashboardSummary and BackendTrendData in DashboardService.
 */

/** Mock KPI metric (BackendKpiMetric shape). */
export interface MockKpi {
  type: string;
  label: string;
  value: number;
  unit?: string;
  trend: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    comparisonPeriod: string;
  };
}

/** Mock activity item (BackendActivityItem shape). */
export interface MockActivity {
  id: string;
  type: string;
  title: string;
  description?: string;
  actorId?: string;
  actorName?: string;
  timestamp: string;
}

/** Mock dashboard KPIs. */
export const mockKpis: MockKpi[] = [
  {
    type: 'active_candidates',
    label: 'Active Candidates',
    value: 148,
    trend: { direction: 'up', percentage: 12.5, comparisonPeriod: 'last_30_days' },
  },
  {
    type: 'screenings_completed',
    label: 'Screenings Completed',
    value: 64,
    trend: { direction: 'down', percentage: 3.2, comparisonPeriod: 'last_30_days' },
  },
  {
    type: 'pending_reviews',
    label: 'Pending Reviews',
    value: 23,
    trend: { direction: 'stable', percentage: 0, comparisonPeriod: 'last_30_days' },
  },
  {
    type: 'avg_turnaround',
    label: 'Avg. Turnaround',
    value: 4.2,
    unit: 'days',
    trend: { direction: 'up', percentage: 8.1, comparisonPeriod: 'last_30_days' },
  },
];

/** Mock recent activity. */
export const mockRecentActivity: MockActivity[] = [
  {
    id: 'act-001',
    type: 'task_created',
    title: 'New candidate John Doe added to Engineering Pipeline',
    actorName: 'Alice Agent',
    timestamp: '2026-02-08T09:15:00.000Z',
  },
  {
    id: 'act-002',
    type: 'task_completed',
    title: 'Background check completed for Jane Smith',
    actorName: 'System',
    timestamp: '2026-02-08T08:42:00.000Z',
  },
  {
    id: 'act-003',
    type: 'task_created',
    title: 'Review task assigned to Bob Agent for Robert Johnson',
    actorName: 'Manager User',
    timestamp: '2026-02-07T17:30:00.000Z',
  },
  {
    id: 'act-004',
    type: 'ticket_resolved',
    title: 'Standard Background Check pipeline stages updated',
    actorName: 'Admin User',
    timestamp: '2026-02-07T14:20:00.000Z',
  },
  {
    id: 'act-005',
    type: 'user_signup',
    title: 'New agent Sarah Wilson invited to the team',
    actorName: 'Admin User',
    timestamp: '2026-02-07T11:05:00.000Z',
  },
];

/** Mock dashboard summary response (BackendDashboardSummary shape). */
export const dashboardSummaryResponse = {
  tenantId: 'tenant-001',
  timestamp: '2026-02-08T10:00:00.000Z',
  timeRange: 'last_30_days',
  kpis: mockKpis,
  recentActivity: mockRecentActivity.slice(0, 3),
  activityTotal: mockRecentActivity.length,
};

/** Mock trend series (BackendTrendData shape). */
export const dashboardTrendsResponse = {
  tenantId: 'tenant-001',
  timeRange: 'last_30_days',
  series: [
    {
      metric: 'candidates_added',
      label: 'Candidates Added',
      aggregation: 'weekly',
      data: [
        { timestamp: '2026-01-09T00:00:00.000Z', value: 12 },
        { timestamp: '2026-01-16T00:00:00.000Z', value: 18 },
        { timestamp: '2026-01-23T00:00:00.000Z', value: 15 },
        { timestamp: '2026-01-30T00:00:00.000Z', value: 22 },
        { timestamp: '2026-02-06T00:00:00.000Z', value: 19 },
      ],
    },
    {
      metric: 'screenings_completed',
      label: 'Screenings Completed',
      aggregation: 'weekly',
      data: [
        { timestamp: '2026-01-09T00:00:00.000Z', value: 8 },
        { timestamp: '2026-01-16T00:00:00.000Z', value: 14 },
        { timestamp: '2026-01-23T00:00:00.000Z', value: 11 },
        { timestamp: '2026-01-30T00:00:00.000Z', value: 16 },
        { timestamp: '2026-02-06T00:00:00.000Z', value: 15 },
      ],
    },
  ],
};

/** Mock paginated activity response. */
export const dashboardActivityResponse = {
  activity: mockRecentActivity,
  meta: {
    page: 1,
    limit: 10,
    total: mockRecentActivity.length,
    totalPages: 1,
  },
};

/** Mock widgets response. */
export const widgetsResponse = {
  widgets: [],
  meta: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
};
