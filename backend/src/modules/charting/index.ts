import { InMemoryChartingRepository } from './infrastructure/index.js';
import { GetAvailableMetrics, QueryChartData, AggregateMetric, GetChartingHealth } from './application/index.js';
import { ChartingController, createChartingRoutes } from './interface/index.js';

export function createChartingModule() {
  const repo = new InMemoryChartingRepository();
  const controller = new ChartingController(
    new GetAvailableMetrics(repo),
    new QueryChartData(repo),
    new AggregateMetric(repo),
    new GetChartingHealth(repo),
  );
  return { router: createChartingRoutes(controller) };
}
