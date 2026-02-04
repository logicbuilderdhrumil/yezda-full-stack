/**
 * Map and Gantt visualization wrappers.
 * These are placeholder components - integrate with actual libraries for production.
 */
import { type ReactNode, type HTMLAttributes } from 'react';
import { cn } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { LoadingState, EmptyState } from './StateComponents';

// ============================================================================
// MAP COMPONENT
// ============================================================================

export interface MapMarker {
  /** Unique marker ID. */
  id: string;
  /** Latitude. */
  lat: number;
  /** Longitude. */
  lng: number;
  /** Marker label. */
  label?: string;
  /** Marker popup content. */
  popupContent?: ReactNode;
  /** Marker color. */
  color?: string;
}

export interface MapProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Map markers. */
  markers?: MapMarker[];
  /** Map center coordinates. */
  center?: { lat: number; lng: number };
  /** Zoom level. */
  zoom?: number;
  /** Map height. */
  height?: number | string;
  /** Map title. */
  title?: string;
  /** Loading state. */
  loading?: boolean;
  /** Marker click handler. */
  onMarkerClick?: (marker: MapMarker) => void;
}

/**
 * Map visualization wrapper.
 * Currently renders a placeholder. Replace with actual map library (e.g., Leaflet, Mapbox).
 */
export function Map({
  markers = [],
  center = { lat: 0, lng: 0 },
  zoom = 10,
  height = 400,
  title,
  loading = false,
  onMarkerClick,
  className,
  ...props
}: MapProps): ReactNode {
  const heightStyle = typeof height === 'number' ? `${height}px` : height;

  if (loading) {
    return (
      <Card className={cn(className)} {...props}>
        {title && (
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div
            className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-md"
            style={{ height: heightStyle }}
          >
            <LoadingState message="Loading map..." />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(className)} {...props}>
      {title && (
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div
          className="relative bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden"
          style={{ height: heightStyle }}
        >
          {/* Map placeholder */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <svg
              className="w-16 h-16 text-gray-400 dark:text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Map Component Placeholder
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Center: {center.lat.toFixed(4)}, {center.lng.toFixed(4)} | Zoom: {zoom}
            </p>
            {markers.length > 0 && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {markers.length} marker(s)
              </p>
            )}
          </div>

          {/* Markers list (for placeholder) */}
          {markers.length > 0 && (
            <div className="absolute bottom-2 left-2 right-2 max-h-24 overflow-y-auto bg-white/90 dark:bg-gray-900/90 rounded p-2">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Markers:
              </p>
              <div className="flex flex-wrap gap-1">
                {markers.slice(0, 5).map((marker) => (
                  <button
                    key={marker.id}
                    onClick={() => onMarkerClick?.(marker)}
                    className="text-xs px-2 py-0.5 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded hover:bg-primary-200 dark:hover:bg-primary-800"
                  >
                    {marker.label ?? `${marker.lat.toFixed(2)}, ${marker.lng.toFixed(2)}`}
                  </button>
                ))}
                {markers.length > 5 && (
                  <span className="text-xs text-gray-500">+{markers.length - 5} more</span>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// GANTT COMPONENT
// ============================================================================

export interface GanttTask {
  /** Unique task ID. */
  id: string;
  /** Task name. */
  name: string;
  /** Start date. */
  start: Date;
  /** End date. */
  end: Date;
  /** Progress (0-100). */
  progress?: number;
  /** Task color. */
  color?: string;
  /** Parent task ID for hierarchical tasks. */
  parentId?: string;
  /** Dependencies (task IDs that must complete before this task). */
  dependencies?: string[];
}

export interface GanttProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Gantt tasks. */
  tasks: GanttTask[];
  /** Chart title. */
  title?: string;
  /** Chart height. */
  height?: number | string;
  /** View mode. */
  viewMode?: 'day' | 'week' | 'month';
  /** Loading state. */
  loading?: boolean;
  /** Task click handler. */
  onTaskClick?: (task: GanttTask) => void;
}

/**
 * Gantt chart visualization wrapper.
 * Currently renders a placeholder. Replace with actual Gantt library (e.g., frappe-gantt).
 */
export function Gantt({
  tasks,
  title,
  height = 400,
  viewMode = 'week',
  loading = false,
  onTaskClick,
  className,
  ...props
}: GanttProps): ReactNode {
  const heightStyle = typeof height === 'number' ? `${height}px` : height;

  if (loading) {
    return (
      <Card className={cn(className)} {...props}>
        {title && (
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div
            className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-md"
            style={{ height: heightStyle }}
          >
            <LoadingState message="Loading Gantt chart..." />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card className={cn(className)} {...props}>
        {title && (
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <EmptyState
            title="No tasks"
            description="Add tasks to see the Gantt chart"
          />
        </CardContent>
      </Card>
    );
  }

  // Calculate date range
  const minDate = new Date(Math.min(...tasks.map(t => t.start.getTime())));
  const maxDate = new Date(Math.max(...tasks.map(t => t.end.getTime())));
  const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Card className={cn(className)} {...props}>
      {title && (
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="text-xs text-gray-500 mb-2">
          View: {viewMode} | {minDate.toLocaleDateString()} - {maxDate.toLocaleDateString()} ({totalDays} days)
        </div>
        <div
          className="overflow-x-auto"
          style={{ height: heightStyle }}
        >
          <div className="min-w-full">
            {/* Simple Gantt placeholder rendering */}
            {tasks.map((task) => {
              const taskStart = task.start.getTime() - minDate.getTime();
              const taskDuration = task.end.getTime() - task.start.getTime();
              const totalRange = maxDate.getTime() - minDate.getTime();
              const leftPercent = (taskStart / totalRange) * 100;
              const widthPercent = (taskDuration / totalRange) * 100;

              return (
                <div
                  key={task.id}
                  className="flex items-center gap-2 py-1 border-b border-gray-100 dark:border-gray-800"
                >
                  <div className="w-32 flex-shrink-0 truncate text-sm">
                    {task.name}
                  </div>
                  <div className="flex-1 relative h-6 bg-gray-100 dark:bg-gray-800 rounded">
                    <button
                      onClick={() => onTaskClick?.(task)}
                      className="absolute h-full rounded transition-colors hover:opacity-80"
                      style={{
                        left: `${leftPercent}%`,
                        width: `${Math.max(widthPercent, 2)}%`,
                        backgroundColor: task.color ?? '#3b82f6',
                      }}
                      title={`${task.name}: ${task.start.toLocaleDateString()} - ${task.end.toLocaleDateString()}`}
                    >
                      {task.progress !== undefined && (
                        <div
                          className="h-full bg-black/20 rounded-l"
                          style={{ width: `${task.progress}%` }}
                        />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
