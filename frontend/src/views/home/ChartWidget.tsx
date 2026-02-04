/**
 * Chart Widget component for displaying trend charts.
 * Simple bar/line chart visualization without external charting library.
 */
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { cn } from '@/utils';
import type { ChartWidget as ChartWidgetType } from '@/@types';

interface ChartWidgetProps {
  /** Chart configuration and data. */
  chart: ChartWidgetType;
  /** Optional className. */
  className?: string;
}

/**
 * Normalizes values to percentage heights for the chart.
 */
function normalizeValues(data: ChartWidgetType['data']): number[] {
  if (data.length === 0) return [];
  const maxValue = Math.max(...data.map((d) => d.value));
  if (maxValue === 0) return data.map(() => 0);
  return data.map((d) => (d.value / maxValue) * 100);
}

/**
 * Simple bar chart visualization.
 */
function BarChart({ data }: { data: ChartWidgetType['data'] }): ReactNode {
  const heights = normalizeValues(data);

  return (
    <div className="flex items-end justify-between gap-1 h-32">
      {data.map((point, index) => (
        <div
          key={point.label}
          className="flex flex-col items-center flex-1 min-w-0"
        >
          <div
            className="w-full bg-primary-500 dark:bg-primary-400 rounded-t transition-all duration-300"
            style={{ height: `${Math.max(heights[index], 4)}%` }}
            title={`${point.label}: ${point.value}`}
          />
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate w-full text-center">
            {point.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Simple line chart visualization using SVG.
 */
function LineChart({ data }: { data: ChartWidgetType['data'] }): ReactNode {
  if (data.length === 0) return null;

  const heights = normalizeValues(data);
  const width = 100;
  const height = 128;
  const padding = 8;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2 - 16; // Reserve space for labels

  const points = heights.map((h, i) => {
    const x = padding + (i / (data.length - 1 || 1)) * chartWidth;
    const y = height - padding - 16 - (h / 100) * chartHeight;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;

  return (
    <div className="relative h-32">
      <svg
        aria-label={`Line chart: ${data.length} data points`}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        <path
          d={pathD}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-primary-500 dark:text-primary-400"
        />
        {heights.map((h, i) => {
          const x = padding + (i / (data.length - 1 || 1)) * chartWidth;
          const y = height - padding - 16 - (h / 100) * chartHeight;
          return (
            <circle
              key={data[i].label}
              cx={x}
              cy={y}
              r="3"
              className="fill-primary-500 dark:fill-primary-400"
            />
          );
        })}
      </svg>
      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {data[0]?.label}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {data[data.length - 1]?.label}
        </span>
      </div>
    </div>
  );
}

/**
 * ChartWidget displays a chart with title and controls.
 */
export function ChartWidget({ chart, className }: ChartWidgetProps): ReactNode {
  const { t } = useTranslation();

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          {chart.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {chart.data.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
            {t('pages.home.noChartData')}
          </p>
        ) : chart.type === 'bar' ? (
          <BarChart data={chart.data} />
        ) : (
          <LineChart data={chart.data} />
        )}
      </CardContent>
    </Card>
  );
}
