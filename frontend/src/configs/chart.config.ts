/**
 * Chart configuration and type definitions.
 * Provides base configuration for all chart components.
 */

import type { CurveType } from 'recharts/types/shape/Curve';

// ============================================================================
// CHART TYPES
// ============================================================================

/** Supported chart types. */
export type ChartType = 'line' | 'bar' | 'area' | 'pie' | 'donut';

/** Chart axis configuration (required fields). */
export interface ChartAxisConfig {
  /** Show axis line. */
  axisLine: boolean;
  /** Show tick line. */
  tickLine: boolean;
  /** Tick size. */
  tickSize: number;
  /** Tick margin from axis. */
  tickMargin: number;
  /** Hide axis. */
  hide: boolean;
}

/** Chart grid configuration (required fields). */
export interface ChartGridConfig {
  /** Show horizontal grid lines. */
  horizontal: boolean;
  /** Show vertical grid lines. */
  vertical: boolean;
  /** Grid stroke dasharray. */
  strokeDasharray: string;
  /** Grid opacity. */
  opacity: number;
}

/** Chart legend configuration (required fields). */
export interface ChartLegendConfig {
  /** Show legend. */
  show: boolean;
  /** Legend alignment. */
  align: 'left' | 'center' | 'right';
  /** Vertical alignment. */
  verticalAlign: 'top' | 'middle' | 'bottom';
  /** Icon size. */
  iconSize: number;
  /** Icon type. */
  iconType: 'line' | 'square' | 'rect' | 'circle' | 'cross' | 'diamond' | 'star' | 'triangle' | 'wye';
}

/** Chart tooltip configuration (required fields). */
export interface ChartTooltipConfig {
  /** Show tooltip. */
  show: boolean;
  /** Show cursor. */
  cursor: boolean;
}

/** Animation configuration (required fields). */
export interface ChartAnimationConfig {
  /** Enable animation. */
  enabled: boolean;
  /** Animation duration in ms. */
  duration: number;
}

/** Complete chart configuration. */
export interface ChartConfig {
  /** X-axis configuration. */
  xAxis: ChartAxisConfig;
  /** Y-axis configuration. */
  yAxis: ChartAxisConfig;
  /** Grid configuration. */
  grid: ChartGridConfig;
  /** Legend configuration. */
  legend: ChartLegendConfig;
  /** Tooltip configuration. */
  tooltip: ChartTooltipConfig;
  /** Animation configuration. */
  animation: ChartAnimationConfig;
  /** Default curve type for line/area charts. */
  curveType: CurveType;
  /** Chart margin. */
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  /** Responsive container aspect ratio. */
  aspectRatio: number;
  /** Minimum height. */
  minHeight: number;
}

/** Partial chart axis configuration for overrides. */
export type PartialAxisConfig = Partial<ChartAxisConfig>;

/** Partial chart grid configuration for overrides. */
export type PartialGridConfig = Partial<ChartGridConfig>;

/** Partial chart legend configuration for overrides. */
export type PartialLegendConfig = Partial<ChartLegendConfig>;

/** Partial chart tooltip configuration for overrides. */
export type PartialTooltipConfig = Partial<ChartTooltipConfig>;

/** Partial animation configuration for overrides. */
export type PartialAnimationConfig = Partial<ChartAnimationConfig>;

/** Partial chart configuration for overrides. */
export interface PartialChartConfig {
  xAxis?: PartialAxisConfig;
  yAxis?: PartialAxisConfig;
  grid?: PartialGridConfig;
  legend?: PartialLegendConfig;
  tooltip?: PartialTooltipConfig;
  animation?: PartialAnimationConfig;
  curveType?: CurveType;
  margin?: Partial<ChartConfig['margin']>;
  aspectRatio?: number;
  minHeight?: number;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

/** Default X-axis configuration. */
export const defaultXAxisConfig: ChartAxisConfig = {
  axisLine: true,
  tickLine: false,
  tickSize: 6,
  tickMargin: 8,
  hide: false,
};

/** Default Y-axis configuration. */
export const defaultYAxisConfig: ChartAxisConfig = {
  axisLine: false,
  tickLine: false,
  tickSize: 6,
  tickMargin: 8,
  hide: false,
};

/** Default grid configuration. */
export const defaultGridConfig: ChartGridConfig = {
  horizontal: true,
  vertical: false,
  strokeDasharray: '3 3',
  opacity: 0.3,
};

/** Default legend configuration. */
export const defaultLegendConfig: ChartLegendConfig = {
  show: true,
  align: 'right',
  verticalAlign: 'top',
  iconSize: 14,
  iconType: 'circle',
};

/** Default tooltip configuration. */
export const defaultTooltipConfig: ChartTooltipConfig = {
  show: true,
  cursor: true,
};

/** Default animation configuration. */
export const defaultAnimationConfig: ChartAnimationConfig = {
  enabled: true,
  duration: 300,
};

/** Default chart configuration. */
export const defaultChartConfig: ChartConfig = {
  xAxis: defaultXAxisConfig,
  yAxis: defaultYAxisConfig,
  grid: defaultGridConfig,
  legend: defaultLegendConfig,
  tooltip: defaultTooltipConfig,
  animation: defaultAnimationConfig,
  curveType: 'monotone',
  margin: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20,
  },
  aspectRatio: 16 / 9,
  minHeight: 300,
};

// ============================================================================
// CONFIGURATION HELPERS
// ============================================================================

/**
 * Merge partial chart config with defaults.
 */
export function mergeChartConfig(partial?: PartialChartConfig): ChartConfig {
  if (!partial) return defaultChartConfig;

  return {
    xAxis: { ...defaultChartConfig.xAxis, ...partial.xAxis },
    yAxis: { ...defaultChartConfig.yAxis, ...partial.yAxis },
    grid: { ...defaultChartConfig.grid, ...partial.grid },
    legend: { ...defaultChartConfig.legend, ...partial.legend },
    tooltip: { ...defaultChartConfig.tooltip, ...partial.tooltip },
    animation: { ...defaultChartConfig.animation, ...partial.animation },
    curveType: partial.curveType ?? defaultChartConfig.curveType,
    margin: { ...defaultChartConfig.margin, ...partial.margin },
    aspectRatio: partial.aspectRatio ?? defaultChartConfig.aspectRatio,
    minHeight: partial.minHeight ?? defaultChartConfig.minHeight,
  };
}

/**
 * Create a minimal chart config (no axis, grid, or legend).
 */
export function createSparklineConfig(): PartialChartConfig {
  return {
    xAxis: { hide: true },
    yAxis: { hide: true },
    grid: { horizontal: false, vertical: false },
    legend: { show: false },
    tooltip: { show: false },
    margin: { top: 5, right: 5, bottom: 5, left: 5 },
    minHeight: 50,
  };
}

/**
 * Create config for dashboard charts.
 */
export function createDashboardChartConfig(): PartialChartConfig {
  return {
    legend: { show: true, align: 'center', verticalAlign: 'bottom' },
    margin: { top: 10, right: 10, bottom: 30, left: 10 },
    minHeight: 250,
  };
}
