/**
 * @file types.ts
 * @description Type definitions for the BarChart component
 */

import type { BaseChartProps, Margin } from '../types/base';
import type { LegendConfig } from '../types/legend';
import type { TooltipConfig } from '../types/tooltip';

export type BarChartData = {
  label: string;
  value: number;
};

export type BarChartProps = BaseChartProps & {
  data: BarChartData[];
  colors?: string[];
  gradientColors?: string[];
  showXAxis?: boolean;
  showYAxis?: boolean;
  showGridLines?: boolean;
  xAxisTextColor?: string;
  yAxisTextColor?: string;
  axisLineColor?: string;
  yAxisTicks?: number;
  tooltip?: TooltipConfig;
  showLegend?: boolean;
  legend?: LegendConfig;
};
