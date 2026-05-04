/**
 * @file types.ts
 * @description Type definitions for the LineChart component
 */

import type { BaseChartProps } from '../types/base';
import type { LegendConfig } from '../types/legend';
import type { TooltipConfig } from '../types/tooltip';

export type LineChartDataPoint = {
  label: string | number;
  value: number;
};

export type LineChartSeries = {
  name: string;
  dataPoints: LineChartDataPoint[];
};

export type LineChartProps = BaseChartProps & {
  data: LineChartSeries[];
  colors?: string | string[];
  areaColor?: string;
  pointColor?: string;
  yAxisTicks?: number;
  showXAxis?: boolean;
  showYAxis?: boolean;
  showGridLines?: boolean;
  areaGradientColors?: string[];
  lineGradientColors?: string[];
  showArea?: boolean;
  tooltip?: TooltipConfig;
  showLegend?: boolean;
  legend?: LegendConfig;
  // Axis styling properties
  xAxisTextColor?: string;
  yAxisTextColor?: string;
  axisLineColor?: string;
};
