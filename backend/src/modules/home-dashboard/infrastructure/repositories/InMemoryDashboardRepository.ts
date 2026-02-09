/**
 * In-Memory Dashboard Repository (mock data)
 * Delegates to the legacy dashboard service's mock generators.
 */
import type { IDashboardRepository } from '../../domain/ports/IDashboardRepository.js';
import type { DashboardSummary, KpiSummary, ActivityFeed, TrendData, DashboardTimeRange, KpiMetricType, KpiMetric, ActivityItem, ActivityType, TrendSeries, TrendDataPoint } from '../../domain/entities/dashboard.entity.js';

function generateMockKpis(timeRange: DashboardTimeRange): KpiMetric[] {
  const m = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  return [
    { type: 'active_users', label: 'Active Users', value: Math.floor(150 * m * (0.8 + Math.random() * 0.4)), trend: { direction: 'up', percentage: 12.5, comparisonPeriod: `previous ${timeRange}` } },
    { type: 'new_signups', label: 'New Signups', value: Math.floor(25 * m * (0.8 + Math.random() * 0.4)), trend: { direction: 'up', percentage: 8.3, comparisonPeriod: `previous ${timeRange}` } },
    { type: 'pending_tasks', label: 'Pending Tasks', value: Math.floor(45 * (0.8 + Math.random() * 0.4)), trend: { direction: 'down', percentage: 5.2, comparisonPeriod: `previous ${timeRange}` } },
    { type: 'completed_tasks', label: 'Completed Tasks', value: Math.floor(120 * m * (0.8 + Math.random() * 0.4)), trend: { direction: 'up', percentage: 15.8, comparisonPeriod: `previous ${timeRange}` } },
    { type: 'open_tickets', label: 'Open Tickets', value: Math.floor(18 * (0.8 + Math.random() * 0.4)), trend: { direction: 'stable', percentage: 0.5, comparisonPeriod: `previous ${timeRange}` } },
    { type: 'avg_response_time', label: 'Avg Response Time', value: Math.floor(2.5 * 60 * (0.9 + Math.random() * 0.2)), unit: 'seconds', trend: { direction: 'down', percentage: 10.2, comparisonPeriod: `previous ${timeRange}` } },
  ];
}

const TITLES: Record<string, string> = { user_signup: 'New user registered', task_completed: 'Task completed', task_created: 'New task created', ticket_opened: 'Support ticket opened', ticket_resolved: 'Ticket resolved', user_login: 'User logged in' };

function generateMockActivity(limit: number): ActivityItem[] {
  const types: ActivityType[] = ['user_signup', 'task_completed', 'task_created', 'ticket_opened', 'ticket_resolved', 'user_login'];
  const now = Date.now();
  return Array.from({ length: limit }, (_, i) => {
    const t = types[Math.floor(Math.random() * types.length)];
    return { id: `activity-${i + 1}`, type: t, title: TITLES[t] ?? 'Activity', timestamp: new Date(now - i * 300000 - Math.random() * 60000), actorId: `user-${Math.floor(Math.random() * 100)}`, actorName: `User ${Math.floor(Math.random() * 100)}` };
  });
}

export class InMemoryDashboardRepository implements IDashboardRepository {
  async getSummary(tenantId: string, timeRange: DashboardTimeRange, requestedMetrics: KpiMetricType[] | undefined, activityLimit: number): Promise<DashboardSummary> {
    let kpis = generateMockKpis(timeRange);
    if (requestedMetrics?.length) kpis = kpis.filter(k => requestedMetrics.includes(k.type));
    const recentActivity = generateMockActivity(activityLimit);
    return { tenantId, timestamp: new Date(), timeRange, kpis, recentActivity, activityTotal: 100 };
  }

  async getKpiSummary(tenantId: string, timeRange: DashboardTimeRange, requestedMetrics: KpiMetricType[] | undefined): Promise<KpiSummary> {
    let metrics = generateMockKpis(timeRange);
    if (requestedMetrics?.length) metrics = metrics.filter(k => requestedMetrics.includes(k.type));
    return { tenantId, timestamp: new Date(), timeRange, metrics };
  }

  async getActivityFeed(tenantId: string, limit: number, _cursor: string | undefined, types: ActivityType[] | undefined): Promise<ActivityFeed> {
    let items = generateMockActivity(limit + 1);
    if (types?.length) items = items.filter(i => types.includes(i.type));
    const hasMore = items.length > limit;
    const resultItems = hasMore ? items.slice(0, limit) : items;
    return { tenantId, items: resultItems, total: 100, hasMore, nextCursor: hasMore ? resultItems[resultItems.length - 1]?.timestamp.toISOString() : undefined };
  }

  async getTrends(tenantId: string, timeRange: DashboardTimeRange, metrics: KpiMetricType[], aggregation: 'hourly' | 'daily' | 'weekly'): Promise<TrendData> {
    const now = Date.now();
    const msPerPoint = aggregation === 'hourly' ? 3600000 : aggregation === 'daily' ? 86400000 : 604800000;
    const rangeMs = timeRange === '24h' ? 86400000 : timeRange === '7d' ? 604800000 : timeRange === '30d' ? 2592000000 : 7776000000;
    const points = Math.min(Math.ceil(rangeMs / msPerPoint), 100);
    const series: TrendSeries[] = metrics.map(metric => {
      const base = metric === 'active_users' ? 100 : metric === 'new_signups' ? 20 : 50;
      return { metric, label: metric.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), aggregation, data: Array.from({ length: points }, (_, i) => ({ timestamp: new Date(now - (points - i - 1) * msPerPoint), value: Math.floor(base * (0.8 + Math.random() * 0.4)) } as TrendDataPoint)) };
    });
    return { tenantId, timeRange, series };
  }
}
