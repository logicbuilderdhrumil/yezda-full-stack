import type { ISharedWidgetsRepository, TableDataQuery, VisualizationQuery } from '../../domain/ports/ISharedWidgetsRepository.js';
import type { Widget, TableDataResult, VisualizationResult, WidgetsHealth } from '../../domain/entities/shared-widgets.entity.js';

const DEFAULT_WIDGETS: Widget[] = [
  { id: 'screening_summary', name: 'Screening Summary', description: 'Summary of screening activity', category: 'screening' },
  { id: 'candidate_pipeline', name: 'Candidate Pipeline', description: 'Pipeline visualization', category: 'pipeline' },
  { id: 'recent_activity', name: 'Recent Activity', description: 'Recent platform activity', category: 'activity' },
];

export class InMemorySharedWidgetsRepository implements ISharedWidgetsRepository {
  async getAvailableWidgets(): Promise<Widget[]> { return DEFAULT_WIDGETS; }

  async getTableData(_tenantId: string | null, _widgetId: string, query: TableDataQuery): Promise<TableDataResult> {
    return { rows: [], total: 0, page: query.page ?? 1, pageSize: query.pageSize ?? 10 };
  }

  async getVisualizationData(_tenantId: string | null, widgetId: string, query: VisualizationQuery): Promise<VisualizationResult> {
    return { widgetId, dataPoints: [], granularity: query.granularity ?? 'day' };
  }

  async getHealth(): Promise<WidgetsHealth> {
    return { status: 'healthy', widgetsAvailable: DEFAULT_WIDGETS.length, sloCompliance: { latency: true, availability: true } };
  }
}
