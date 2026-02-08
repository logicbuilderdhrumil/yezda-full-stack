import type { ISharedWidgetsRepository, Widget, TableDataResult, VisualizationResult, WidgetsHealth, TableDataQuery, VisualizationQuery } from '../../domain/index.js';

export class GetAvailableWidgets {
  constructor(private repo: ISharedWidgetsRepository) {}
  async execute(): Promise<Widget[]> { return this.repo.getAvailableWidgets(); }
}

export class GetTableData {
  constructor(private repo: ISharedWidgetsRepository) {}
  async execute(tenantId: string | null, widgetId: string, query: TableDataQuery): Promise<TableDataResult> {
    return this.repo.getTableData(tenantId, widgetId, query);
  }
}

export class GetVisualizationData {
  constructor(private repo: ISharedWidgetsRepository) {}
  async execute(tenantId: string | null, widgetId: string, query: VisualizationQuery): Promise<VisualizationResult> {
    return this.repo.getVisualizationData(tenantId, widgetId, query);
  }
}

export class GetWidgetsHealth {
  constructor(private repo: ISharedWidgetsRepository) {}
  async execute(): Promise<WidgetsHealth> { return this.repo.getHealth(); }
}
