/**
 * Shared chart components.
 * Provides consistent chart rendering with theme integration.
 */

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { type ReactNode, useId, useMemo, useSyncExternalStore } from 'react';
import { cn } from '@/utils';
import {
  type ChartConfig,
  type PartialChartConfig,
  mergeChartConfig,
  createSparklineConfig,
} from '@/configs/chart.config';
import {
  type ChartColorPalette,
  chartColorsByTheme,
  getSeriesColor,
  createAreaGradients,
  formatChartNumber,
  SPARKLINE_SIZE,
} from '@/constants/chart.constant';

// ============================================================================
// HOOKS
// ============================================================================

/** Subscribe to matchMedia changes. */
function subscribeToMediaQuery(
  query: string,
  callback: () => void
): () => void {
  if (typeof window === 'undefined') return () => {};
  const mql = window.matchMedia(query);
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

/** Get current dark mode state from matchMedia. */
function getIsDarkMode(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

const darkModeSubscribe = (callback: () => void) =>
  subscribeToMediaQuery('(prefers-color-scheme: dark)', callback);

/**
 * Hook to get theme-aware chart colors.
 * Uses system preference when no theme context is available.
 * Memoizes matchMedia usage and subscribes to changes.
 */
export function useChartColors(): ChartColorPalette {
  const isDark = useSyncExternalStore(
    darkModeSubscribe,
    getIsDarkMode,
    () => false // SSR fallback
  );

  return isDark ? chartColorsByTheme.dark : chartColorsByTheme.light;
}

// ============================================================================
// TYPES
// ============================================================================

/** Base props for all chart components. */
export interface BaseChartProps<T = Record<string, unknown>> {
  /** Chart data. */
  data: T[];
  /** Chart configuration overrides. */
  config?: PartialChartConfig;
  /** CSS class name. */
  className?: string;
  /** Chart color palette override. */
  colors?: ChartColorPalette;
  /** Loading state. */
  loading?: boolean;
  /** Empty state. */
  empty?: boolean;
  /** Empty state message. */
  emptyMessage?: string;
  /** Accessible label. */
  ariaLabel?: string;
}

/** Series definition for multi-series charts. */
export interface ChartSeries {
  /** Data key (field name). */
  dataKey: string;
  /** Display name. */
  name: string;
  /** Color override. */
  color?: string;
  /** Stack ID for stacked charts. */
  stackId?: string;
}

/** Line chart props. */
export interface LineChartProps<T = Record<string, unknown>> extends BaseChartProps<T> {
  /** X-axis data key. */
  xAxisKey: string;
  /** Data series. */
  series: ChartSeries[];
  /** Show dots on lines. */
  showDots?: boolean;
  /** Dot size. */
  dotSize?: number;
}

/** Bar chart props. */
export interface BarChartProps<T = Record<string, unknown>> extends BaseChartProps<T> {
  /** X-axis data key. */
  xAxisKey: string;
  /** Data series. */
  series: ChartSeries[];
  /** Stack bars. */
  stacked?: boolean;
  /** Horizontal bars. */
  horizontal?: boolean;
  /** Bar radius. */
  radius?: number;
}

/** Area chart props. */
export interface AreaChartProps<T = Record<string, unknown>> extends BaseChartProps<T> {
  /** X-axis data key. */
  xAxisKey: string;
  /** Data series. */
  series: ChartSeries[];
  /** Stack areas. */
  stacked?: boolean;
  /** Show gradient fill. */
  gradient?: boolean;
}

/** Pie chart props. */
export interface PieChartProps<T = Record<string, unknown>> extends BaseChartProps<T> {
  /** Data key for values. */
  dataKey: string;
  /** Data key for labels. */
  nameKey: string;
  /** Inner radius for donut chart (0 for pie). */
  innerRadius?: number;
  /** Outer radius. */
  outerRadius?: number;
  /** Padding angle between slices. */
  paddingAngle?: number;
  /** Show labels. */
  showLabels?: boolean;
}

/** Sparkline props. */
export interface SparklineProps<T = Record<string, unknown>> {
  /** Chart data. */
  data: T[];
  /** Data key for Y values. */
  dataKey: string;
  /** Chart type. */
  type?: 'line' | 'bar' | 'area';
  /** Line/bar color. */
  color?: string;
  /** Show reference line at value. */
  referenceLine?: number;
  /** Width override. */
  width?: number;
  /** Height override. */
  height?: number;
  /** CSS class name. */
  className?: string;
}

// ============================================================================
// LOADING AND EMPTY STATES
// ============================================================================

/** Chart loading placeholder. */
export interface ChartLoadingProps {
  /** Minimum height. */
  minHeight?: number | undefined;
  /** CSS class name. */
  className?: string | undefined;
}

export function ChartLoading({
  minHeight = 300,
  className,
}: ChartLoadingProps): ReactNode {
  return (
    <div
      className={cn(
        'flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg animate-pulse',
        className
      )}
      style={{ minHeight }}
      role="status"
      aria-label="Loading chart"
    >
      <div className="flex flex-col items-center gap-2 text-gray-400 dark:text-gray-500">
        <svg
          className="w-8 h-8 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span className="text-sm">Loading chart...</span>
      </div>
    </div>
  );
}

/** Chart empty state. */
export interface ChartEmptyProps {
  /** Message to display. */
  message?: string | undefined;
  /** Minimum height. */
  minHeight?: number | undefined;
  /** CSS class name. */
  className?: string | undefined;
}

export function ChartEmpty({
  message = 'No data available',
  minHeight = 300,
  className,
}: ChartEmptyProps): ReactNode {
  return (
    <div
      className={cn(
        'flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg border border-dashed border-gray-200 dark:border-gray-700',
        className
      )}
      style={{ minHeight }}
      role="status"
      aria-label={message}
    >
      <div className="flex flex-col items-center gap-2 text-gray-400 dark:text-gray-500">
        <svg
          className="w-12 h-12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <span className="text-sm">{message}</span>
      </div>
    </div>
  );
}

// ============================================================================
// CHART CONTAINER
// ============================================================================

interface ChartContainerProps {
  config: ChartConfig;
  loading?: boolean | undefined;
  empty?: boolean | undefined;
  emptyMessage?: string | undefined;
  className?: string | undefined;
  ariaLabel?: string | undefined;
  children: ReactNode;
}

function ChartContainer({
  config,
  loading,
  empty,
  emptyMessage,
  className,
  ariaLabel,
  children,
}: ChartContainerProps): ReactNode {
  if (loading) {
    return <ChartLoading minHeight={config.minHeight} className={className} />;
  }

  if (empty) {
    return (
      <ChartEmpty
        message={emptyMessage}
        minHeight={config.minHeight}
        className={className}
      />
    );
  }

  return (
    <div
      className={cn('w-full', className)}
      style={{ minHeight: config.minHeight }}
      role="img"
      aria-label={ariaLabel}
    >
      <ResponsiveContainer width="100%" aspect={config.aspectRatio}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}

// ============================================================================
// CUSTOM TOOLTIP
// ============================================================================

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number | string;
    color: string;
    dataKey: string;
  }>;
  label?: string;
  palette: ChartColorPalette;
  valueFormatter?: (value: number) => string;
}

function CustomTooltip({
  active,
  payload,
  label,
  palette,
  valueFormatter = formatChartNumber,
}: CustomTooltipProps): ReactNode {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="rounded-lg border shadow-lg p-3 text-sm"
      style={{
        backgroundColor: palette.tooltipBackground,
        borderColor: palette.tooltipBorder,
        color: palette.tooltipText,
      }}
    >
      {label && (
        <p className="font-medium mb-2" style={{ color: palette.tooltipText }}>
          {label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span style={{ color: palette.legendText }}>{entry.name}</span>
            </div>
            <span className="font-medium" style={{ color: palette.tooltipText }}>
              {typeof entry.value === 'number'
                ? valueFormatter(entry.value)
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// LINE CHART
// ============================================================================

export function Chart<T extends Record<string, unknown>>({
  data,
  xAxisKey,
  series,
  config: configOverrides,
  className,
  colors,
  loading,
  empty,
  emptyMessage,
  showDots = false,
  dotSize = 4,
  ariaLabel = 'Line chart',
}: LineChartProps<T>): ReactNode {
  const defaultPalette = useChartColors();
  const palette = colors ?? defaultPalette;
  const config = useMemo(() => mergeChartConfig(configOverrides), [configOverrides]);

  const isEmpty = empty || !data.length;

  return (
    <ChartContainer
      config={config}
      loading={loading}
      empty={isEmpty}
      emptyMessage={emptyMessage}
      className={className}
      ariaLabel={ariaLabel}
    >
      <LineChart data={data} margin={config.margin}>
        <CartesianGrid
          horizontal={config.grid.horizontal}
          vertical={config.grid.vertical}
          strokeDasharray={config.grid.strokeDasharray}
          stroke={palette.grid}
          strokeOpacity={config.grid.opacity}
        />
        {!config.xAxis.hide && (
          <XAxis
            dataKey={xAxisKey}
            axisLine={config.xAxis.axisLine}
            tickLine={config.xAxis.tickLine}
            tickMargin={config.xAxis.tickMargin}
            tick={{ fill: palette.axisText, fontSize: 12 }}
            stroke={palette.grid}
          />
        )}
        {!config.yAxis.hide && (
          <YAxis
            axisLine={config.yAxis.axisLine}
            tickLine={config.yAxis.tickLine}
            tickMargin={config.yAxis.tickMargin}
            tickFormatter={formatChartNumber}
            tick={{ fill: palette.axisText, fontSize: 12 }}
            stroke={palette.grid}
          />
        )}
        {config.tooltip.show && (
          <Tooltip
            content={<CustomTooltip palette={palette} />}
            cursor={
              config.tooltip.cursor
                ? { stroke: palette.grid, strokeDasharray: '3 3' }
                : false
            }
          />
        )}
        {config.legend.show && (
          <Legend
            verticalAlign={config.legend.verticalAlign}
            align={config.legend.align}
            iconSize={config.legend.iconSize}
            iconType={config.legend.iconType}
            wrapperStyle={{ color: palette.legendText }}
          />
        )}
        {series.map((s, index) => (
          <Line
            key={s.dataKey}
            type={config.curveType}
            dataKey={s.dataKey}
            name={s.name}
            stroke={s.color ?? getSeriesColor(palette, index)}
            strokeWidth={2}
            dot={showDots ? { r: dotSize, fill: s.color ?? getSeriesColor(palette, index) } : false}
            activeDot={{ r: dotSize + 2 }}
            animationDuration={config.animation.enabled ? config.animation.duration : 0}
          />
        ))}
      </LineChart>
    </ChartContainer>
  );
}

// ============================================================================
// BAR CHART
// ============================================================================

export function ChartBar<T extends Record<string, unknown>>({
  data,
  xAxisKey,
  series,
  config: configOverrides,
  className,
  colors,
  loading,
  empty,
  emptyMessage,
  stacked = false,
  horizontal = false,
  radius = 4,
  ariaLabel = 'Bar chart',
}: BarChartProps<T>): ReactNode {
  const defaultPalette = useChartColors();
  const palette = colors ?? defaultPalette;
  const config = useMemo(() => mergeChartConfig(configOverrides), [configOverrides]);

  const isEmpty = empty || !data.length;

  return (
    <ChartContainer
      config={config}
      loading={loading}
      empty={isEmpty}
      emptyMessage={emptyMessage}
      className={className}
      ariaLabel={ariaLabel}
    >
      <BarChart data={data} margin={config.margin} layout={horizontal ? 'vertical' : 'horizontal'}>
        <CartesianGrid
          horizontal={config.grid.horizontal}
          vertical={config.grid.vertical}
          strokeDasharray={config.grid.strokeDasharray}
          stroke={palette.grid}
          strokeOpacity={config.grid.opacity}
        />
        {!config.xAxis.hide && (
          <XAxis
            {...(horizontal ? {} : { dataKey: xAxisKey })}
            type={horizontal ? 'number' : 'category'}
            axisLine={config.xAxis.axisLine}
            tickLine={config.xAxis.tickLine}
            tickMargin={config.xAxis.tickMargin}
            {...(horizontal ? { tickFormatter: formatChartNumber } : {})}
            tick={{ fill: palette.axisText, fontSize: 12 }}
            stroke={palette.grid}
          />
        )}
        {!config.yAxis.hide && (
          <YAxis
            {...(horizontal ? { dataKey: xAxisKey } : {})}
            type={horizontal ? 'category' : 'number'}
            axisLine={config.yAxis.axisLine}
            tickLine={config.yAxis.tickLine}
            tickMargin={config.yAxis.tickMargin}
            {...(!horizontal ? { tickFormatter: formatChartNumber } : {})}
            tick={{ fill: palette.axisText, fontSize: 12 }}
            stroke={palette.grid}
          />
        )}
        {config.tooltip.show && (
          <Tooltip
            content={<CustomTooltip palette={palette} />}
            cursor={config.tooltip.cursor ? { fill: palette.grid, opacity: 0.2 } : false}
          />
        )}
        {config.legend.show && (
          <Legend
            verticalAlign={config.legend.verticalAlign}
            align={config.legend.align}
            iconSize={config.legend.iconSize}
            iconType="square"
            wrapperStyle={{ color: palette.legendText }}
          />
        )}
        {series.map((s, index) => {
          const stackId = stacked ? 'stack' : s.stackId;
          return (
            <Bar
              key={s.dataKey}
              dataKey={s.dataKey}
              name={s.name}
              fill={s.color ?? getSeriesColor(palette, index)}
              radius={[radius, radius, 0, 0]}
              {...(stackId ? { stackId } : {})}
              animationDuration={config.animation.enabled ? config.animation.duration : 0}
            />
          );
        })}
      </BarChart>
    </ChartContainer>
  );
}

// ============================================================================
// AREA CHART
// ============================================================================

export function ChartArea<T extends Record<string, unknown>>({
  data,
  xAxisKey,
  series,
  config: configOverrides,
  className,
  colors,
  loading,
  empty,
  emptyMessage,
  stacked = false,
  gradient = true,
  ariaLabel = 'Area chart',
}: AreaChartProps<T>): ReactNode {
  const defaultPalette = useChartColors();
  const palette = colors ?? defaultPalette;
  const config = useMemo(() => mergeChartConfig(configOverrides), [configOverrides]);

  const isEmpty = empty || !data.length;

  const gradients = useMemo(() => {
    if (!gradient) return [];
    return createAreaGradients(
      series.map((s, i) => s.color ?? getSeriesColor(palette, i))
    );
  }, [series, palette, gradient]);

  return (
    <ChartContainer
      config={config}
      loading={loading}
      empty={isEmpty}
      emptyMessage={emptyMessage}
      className={className}
      ariaLabel={ariaLabel}
    >
      <AreaChart data={data} margin={config.margin}>
        {gradient && (
          <defs>
            {gradients.map((g) => (
              <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={g.color} stopOpacity={g.startOpacity} />
                <stop offset="100%" stopColor={g.color} stopOpacity={g.endOpacity} />
              </linearGradient>
            ))}
          </defs>
        )}
        <CartesianGrid
          horizontal={config.grid.horizontal}
          vertical={config.grid.vertical}
          strokeDasharray={config.grid.strokeDasharray}
          stroke={palette.grid}
          strokeOpacity={config.grid.opacity}
        />
        {!config.xAxis.hide && (
          <XAxis
            dataKey={xAxisKey}
            axisLine={config.xAxis.axisLine}
            tickLine={config.xAxis.tickLine}
            tickMargin={config.xAxis.tickMargin}
            tick={{ fill: palette.axisText, fontSize: 12 }}
            stroke={palette.grid}
          />
        )}
        {!config.yAxis.hide && (
          <YAxis
            axisLine={config.yAxis.axisLine}
            tickLine={config.yAxis.tickLine}
            tickMargin={config.yAxis.tickMargin}
            tickFormatter={formatChartNumber}
            tick={{ fill: palette.axisText, fontSize: 12 }}
            stroke={palette.grid}
          />
        )}
        {config.tooltip.show && (
          <Tooltip
            content={<CustomTooltip palette={palette} />}
            cursor={
              config.tooltip.cursor
                ? { stroke: palette.grid, strokeDasharray: '3 3' }
                : false
            }
          />
        )}
        {config.legend.show && (
          <Legend
            verticalAlign={config.legend.verticalAlign}
            align={config.legend.align}
            iconSize={config.legend.iconSize}
            iconType={config.legend.iconType}
            wrapperStyle={{ color: palette.legendText }}
          />
        )}
        {series.map((s, index) => {
          const color = s.color ?? getSeriesColor(palette, index);
          const stackId = stacked ? 'stack' : s.stackId;
          return (
            <Area
              key={s.dataKey}
              type={config.curveType}
              dataKey={s.dataKey}
              name={s.name}
              stroke={color}
              strokeWidth={2}
              fill={gradient ? `url(#${gradients[index]?.id})` : color}
              fillOpacity={gradient ? 1 : 0.3}
              {...(stackId ? { stackId } : {})}
              animationDuration={config.animation.enabled ? config.animation.duration : 0}
            />
          );
        })}
      </AreaChart>
    </ChartContainer>
  );
}

// ============================================================================
// PIE / DONUT CHART
// ============================================================================

export function ChartPie<T extends Record<string, unknown>>({
  data,
  dataKey,
  nameKey,
  config: configOverrides,
  className,
  colors,
  loading,
  empty,
  emptyMessage,
  innerRadius = 0,
  outerRadius = 80,
  paddingAngle = 2,
  showLabels = true,
  ariaLabel = 'Pie chart',
}: PieChartProps<T>): ReactNode {
  const defaultPalette = useChartColors();
  const palette = colors ?? defaultPalette;
  const config = useMemo(() => mergeChartConfig(configOverrides), [configOverrides]);

  const isEmpty = empty || !data.length;

  return (
    <ChartContainer
      config={config}
      loading={loading}
      empty={isEmpty}
      emptyMessage={emptyMessage}
      className={className}
      ariaLabel={ariaLabel}
    >
      <PieChart margin={config.margin}>
        {config.tooltip.show && (
          <Tooltip content={<CustomTooltip palette={palette} />} />
        )}
        {config.legend.show && (
          <Legend
            verticalAlign={config.legend.verticalAlign}
            align={config.legend.align}
            iconSize={config.legend.iconSize}
            iconType="circle"
            wrapperStyle={{ color: palette.legendText }}
          />
        )}
        <Pie
          data={data}
          dataKey={dataKey}
          nameKey={nameKey}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={paddingAngle}
          label={
            showLabels
              ? ({ name, percent }) =>
                  `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
              : false
          }
          labelLine={showLabels}
          animationDuration={config.animation.enabled ? config.animation.duration : 0}
        >
          {data.map((_, index) => (
            <Cell key={index} fill={getSeriesColor(palette, index)} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}

// ============================================================================
// SPARKLINE
// ============================================================================

export function Sparkline<T extends Record<string, unknown>>({
  data,
  dataKey,
  type = 'line',
  color,
  width = SPARKLINE_SIZE.width,
  height = SPARKLINE_SIZE.height,
  className,
}: SparklineProps<T>): ReactNode {
  const palette = useChartColors();
  const sparklineConfig = useMemo(() => mergeChartConfig(createSparklineConfig()), []);
  const gradientId = useId();
  const fillColor = color ?? palette.series[0] ?? palette.positive;

  if (!data.length) return null;

  return (
    <div className={cn('inline-block', className)} style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        {type === 'bar' ? (
          <BarChart data={data} margin={sparklineConfig.margin}>
            <Bar dataKey={dataKey} fill={fillColor} radius={[2, 2, 0, 0]} />
          </BarChart>
        ) : type === 'area' ? (
          <AreaChart data={data} margin={sparklineConfig.margin}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={fillColor} stopOpacity={0.3} />
                <stop offset="100%" stopColor={fillColor} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={fillColor}
              strokeWidth={1.5}
              fill={`url(#${gradientId})`}
            />
          </AreaChart>
        ) : (
          <LineChart data={data} margin={sparklineConfig.margin}>
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={fillColor}
              strokeWidth={1.5}
              dot={false}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
