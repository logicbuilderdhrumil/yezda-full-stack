/**
 * Chart color palette and theme constants.
 * Provides theme-aware colors for chart rendering.
 */

// ============================================================================
// COLOR PALETTES
// ============================================================================

/** Chart color palette for data series. */
export interface ChartColorPalette {
  /** Primary series colors (ordered for multiple series). */
  series: string[];
  /** Color for positive/success values. */
  positive: string;
  /** Color for negative/error values. */
  negative: string;
  /** Color for neutral/warning values. */
  neutral: string;
  /** Grid line color. */
  grid: string;
  /** Axis text color. */
  axisText: string;
  /** Tooltip background color. */
  tooltipBackground: string;
  /** Tooltip text color. */
  tooltipText: string;
  /** Tooltip border color. */
  tooltipBorder: string;
  /** Legend text color. */
  legendText: string;
}

/** Light theme chart colors. */
export const lightChartColors: ChartColorPalette = {
  series: [
    '#2563eb', // blue-600
    '#16a34a', // green-600
    '#ca8a04', // yellow-600
    '#dc2626', // red-600
    '#9333ea', // purple-600
    '#0891b2', // cyan-600
    '#ea580c', // orange-600
    '#4f46e5', // indigo-600
    '#db2777', // pink-600
    '#059669', // emerald-600
  ],
  positive: '#16a34a',
  negative: '#dc2626',
  neutral: '#ca8a04',
  grid: '#e2e8f0',
  axisText: '#64748b',
  tooltipBackground: '#ffffff',
  tooltipText: '#0f172a',
  tooltipBorder: '#e2e8f0',
  legendText: '#475569',
};

/** Dark theme chart colors. */
export const darkChartColors: ChartColorPalette = {
  series: [
    '#3b82f6', // blue-500
    '#22c55e', // green-500
    '#eab308', // yellow-500
    '#ef4444', // red-500
    '#a855f7', // purple-500
    '#06b6d4', // cyan-500
    '#f97316', // orange-500
    '#6366f1', // indigo-500
    '#ec4899', // pink-500
    '#10b981', // emerald-500
  ],
  positive: '#22c55e',
  negative: '#ef4444',
  neutral: '#eab308',
  grid: '#334155',
  axisText: '#94a3b8',
  tooltipBackground: '#1e293b',
  tooltipText: '#f8fafc',
  tooltipBorder: '#475569',
  legendText: '#cbd5e1',
};

/** Chart color palettes by theme. */
export const chartColorsByTheme: Record<'light' | 'dark', ChartColorPalette> = {
  light: lightChartColors,
  dark: darkChartColors,
};

// ============================================================================
// GRADIENT DEFINITIONS
// ============================================================================

/** Gradient definition for area charts. */
export interface ChartGradient {
  id: string;
  color: string;
  startOpacity: number;
  endOpacity: number;
}

/**
 * Create gradient definitions for area charts.
 */
export function createAreaGradients(
  colors: string[],
  prefix = 'area'
): ChartGradient[] {
  return colors.map((color, index) => ({
    id: `${prefix}-gradient-${index}`,
    color,
    startOpacity: 0.3,
    endOpacity: 0.05,
  }));
}

// ============================================================================
// SEMANTIC COLOR HELPERS
// ============================================================================

/**
 * Get color for a value based on thresholds.
 */
export function getValueColor(
  value: number,
  palette: ChartColorPalette,
  thresholds: { good: number; warning: number }
): string {
  if (value >= thresholds.good) return palette.positive;
  if (value >= thresholds.warning) return palette.neutral;
  return palette.negative;
}

/**
 * Get color for a percentage change.
 */
export function getChangeColor(
  change: number,
  palette: ChartColorPalette,
  positiveIsGood = true
): string {
  if (change === 0) return palette.neutral;
  const isPositive = change > 0;
  if (positiveIsGood) {
    return isPositive ? palette.positive : palette.negative;
  }
  return isPositive ? palette.negative : palette.positive;
}

/**
 * Get series color by index with wrapping.
 */
export function getSeriesColor(palette: ChartColorPalette, index: number): string {
  const seriesLength = palette.series.length;
  if (seriesLength === 0) return palette.positive;
  return palette.series[index % seriesLength] ?? palette.positive;
}

// ============================================================================
// CHART SIZE BREAKPOINTS
// ============================================================================

/** Chart responsive breakpoints. */
export const CHART_BREAKPOINTS = {
  /** Small chart (compact dashboards). */
  sm: { minHeight: 150, aspectRatio: 4 / 3 },
  /** Medium chart (standard). */
  md: { minHeight: 250, aspectRatio: 16 / 10 },
  /** Large chart (detailed view). */
  lg: { minHeight: 350, aspectRatio: 16 / 9 },
  /** Extra large chart (full-page). */
  xl: { minHeight: 450, aspectRatio: 2 / 1 },
} as const;

/** Sparkline dimensions. */
export const SPARKLINE_SIZE = {
  width: 100,
  height: 30,
} as const;

// ============================================================================
// ANIMATION PRESETS
// ============================================================================

/** Animation presets for different contexts. */
export const CHART_ANIMATIONS = {
  /** Fast animation for frequent updates. */
  fast: { duration: 150, easing: 'ease-out' as const },
  /** Default animation. */
  default: { duration: 300, easing: 'ease-out' as const },
  /** Slow animation for emphasis. */
  slow: { duration: 500, easing: 'ease-in-out' as const },
  /** No animation. */
  none: { duration: 0, easing: 'linear' as const },
} as const;

// ============================================================================
// LABEL FORMATTERS
// ============================================================================

/** Default number formatter for chart labels. */
export function formatChartNumber(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toLocaleString();
}

/** Default percentage formatter for chart labels. */
export function formatChartPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/** Default currency formatter for chart labels. */
export function formatChartCurrency(
  value: number,
  currency = 'USD',
  locale = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: value >= 10_000 ? 'compact' : 'standard',
    maximumFractionDigits: value >= 10_000 ? 1 : 0,
  }).format(value);
}
