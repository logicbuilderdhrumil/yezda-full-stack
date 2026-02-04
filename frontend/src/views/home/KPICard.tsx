/**
 * KPI Card component for dashboard summary metrics.
 */
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { cn } from '@/utils';
import type { KPIMetric, DeltaDirection } from '@/@types';

interface KPICardProps {
  /** KPI metric data to display. */
  metric: KPIMetric;
  /** Optional className for styling. */
  className?: string;
}

/**
 * Returns the color class for delta direction.
 */
function getDeltaColorClass(direction: DeltaDirection | undefined): string {
  switch (direction) {
    case 'up':
      return 'text-green-600 dark:text-green-400';
    case 'down':
      return 'text-red-600 dark:text-red-400';
    default:
      return 'text-gray-500 dark:text-gray-400';
  }
}

/**
 * Returns the arrow icon for delta direction.
 */
function getDeltaIcon(direction: DeltaDirection | undefined): string {
  switch (direction) {
    case 'up':
      return '↑';
    case 'down':
      return '↓';
    default:
      return '→';
  }
}

/**
 * KPICard displays a single KPI metric with title, value, and delta.
 */
export function KPICard({ metric, className }: KPICardProps): ReactNode {
  const content = (
    <Card
      className={cn(
        'transition-shadow hover:shadow-md',
        metric.href && 'cursor-pointer',
        className
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {metric.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {metric.formattedValue ?? metric.value}
          </p>
          {metric.deltaText && (
            <span
              className={cn(
                'flex items-center text-sm font-medium',
                getDeltaColorClass(metric.deltaDirection)
              )}
            >
              <span className="mr-1">{getDeltaIcon(metric.deltaDirection)}</span>
              {metric.deltaText}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (metric.href) {
    return (
      <Link to={metric.href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
