/**
 * Reports/Charts module mock fixtures.
 * Provides fake data for chart and report endpoints.
 */

/** Mock screening overview chart response. */
export const screeningOverviewResponse = {
  chartType: 'bar',
  title: 'Screening Overview — Last 30 Days',
  data: {
    labels: ['Identity Verification', 'Employment History', 'Criminal Record', 'Reference Check', 'Final Review'],
    datasets: [
      {
        label: 'Completed',
        data: [45, 38, 42, 28, 22],
      },
      {
        label: 'In Progress',
        data: [12, 8, 5, 14, 9],
      },
      {
        label: 'Pending',
        data: [3, 6, 2, 10, 15],
      },
    ],
  },
};

/** Mock saved chart. */
export interface MockSavedChart {
  id: string;
  name: string;
  chartType: 'bar' | 'line' | 'pie' | 'doughnut';
  description: string;
  createdAt: string;
  updatedAt: string;
}

/** Predefined mock saved charts. */
export const mockSavedCharts: MockSavedChart[] = [
  {
    id: 'chart-001',
    name: 'Monthly Screening Volume',
    chartType: 'line',
    description: 'Tracks total screenings per month over the past year.',
    createdAt: '2025-09-15T10:00:00.000Z',
    updatedAt: '2026-02-01T08:00:00.000Z',
  },
  {
    id: 'chart-002',
    name: 'Status Distribution',
    chartType: 'doughnut',
    description: 'Breakdown of candidate statuses across all pipelines.',
    createdAt: '2025-11-20T14:30:00.000Z',
    updatedAt: '2026-01-28T16:00:00.000Z',
  },
];

/** Mock saved charts list response. */
export const savedChartsResponse = {
  charts: mockSavedCharts,
  meta: {
    page: 1,
    limit: 10,
    total: mockSavedCharts.length,
    totalPages: 1,
  },
};

/** Mock screening report data matching ScreeningReportData. */
export const screeningReportResponse = {
  summary: {
    totalScreenings: 175,
    completed: 135,
    inProgress: 25,
    pending: 10,
    failed: 5,
    passRate: 92.6,
    averageDaysToComplete: 4.3,
  },
  byType: [
    { type: 'Identity Verification', count: 60, passRate: 96.7 },
    { type: 'Employment History', count: 52, passRate: 90.4 },
    { type: 'Criminal Record', count: 49, passRate: 89.8 },
    { type: 'Reference Check', count: 14, passRate: 100.0 },
  ],
  monthlyTrend: [
    { month: '2025-09', completed: 18, submitted: 22 },
    { month: '2025-10', completed: 24, submitted: 28 },
    { month: '2025-11', completed: 26, submitted: 30 },
    { month: '2025-12', completed: 22, submitted: 25 },
    { month: '2026-01', completed: 30, submitted: 35 },
    { month: '2026-02', completed: 15, submitted: 35 },
  ],
};
