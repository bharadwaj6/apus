/**
 * @file index.ts
 * @description Main export file for the chart library
 */

// Export base types
export type { BaseChartProps, Margin, DEFAULT_MARGIN } from './types/base';

// Export legend and tooltip config types
export type { LegendConfig, LegendPosition } from './types/legend';
export type { TooltipConfig } from './types/tooltip';

// Export components
export { BarChart } from './BarChart/BarChart';
export type { BarChartProps, BarChartData } from './BarChart/types';

// Export ScatterChart and its types
export { ScatterChart } from './ScatterChart/ScatterChart';
export type {
  ScatterChartProps,
  ScatterDataPoint,
  ScatterHoveredData,
  SeriesConfig,
  BubbleChartConfig,
  ErrorBarConfig,
  TrendLineProps,
  AxisProps,
  GridProps,
} from './ScatterChart/types';

export { LineChart } from './LineChart/LineChart';
export type { LineChartProps, LineChartSeries, LineChartDataPoint } from './LineChart/types';

// Export DonutChart and its types
export { DonutChart } from './DonutChart/DonutChart';
export type { DonutChartProps, DonutChartData, DonutChartLegendItem } from './DonutChart/types';

// Export GaugeDonutChart and its types
export { GaugeDonutChart } from './GaugeDonutChart/GaugeDonutChart';
export type { GaugeDonutChartProps, GaugeDonutData, GradientStop } from './GaugeDonutChart/types';

// Export NestedDonutChart and its types
export { NestedDonutChart } from './NestedDonutChart';
export type {
  NestedDonutChartProps,
  NestedDonutLevelData,
  NestedDonutDataPoint,
} from './NestedDonutChart/types';

// Export StackedBarChart
export { StackedBarChart } from './StackedBarChart/StackedBarChart';
export type { StackedBarChartProps, StackedBarChartData } from './StackedBarChart/types';

// Export RadarChart and its types
export { default as RadarChart } from './RadarChart/RadarChart';
export type {
  RadarChartProps,
  RadarChartSeries,
  RadarChartDataPoint,
  HoveredDataInfo,
} from './RadarChart/types';

// Export FunnelChart
export { default as FunnelChart } from './FunnelChart';
export { default as TimeSeriesFunnelChart } from './FunnelChart/TimeSeriesFunnelChart';
export { default as SegmentedFunnelChart } from './FunnelChart/SegmentedFunnelChart';
export type {
  FunnelData,
  FunnelChartProps,
  TimeSeriesFunnelData,
  TimeSeriesFunnelChartProps,
  SegmentedFunnelSegment,
  SegmentedFunnelStage,
  SegmentedFunnelChartProps,
} from './FunnelChart/types';

// Export hooks for advanced usage
export { useChartDimensions } from './hooks/useChartDimensions';
export { useTooltip } from './hooks/useTooltip';

// Export utilities
export { createGradient, addGridLines, addLegend } from './utils/chartUtils';

// Export RangeChart and its types
export { RangeChart } from './RangeChart/RangeChart';
export type { RangeChartProps, RangeChartDataItem } from './RangeChart/types';

// Export theme
export type { ChartTheme } from './theme/types';
export { ChartThemeProvider, useChartTheme } from './theme/ChartThemeContext';
export { lightTheme, darkTheme } from './theme/themes';
