/**
 * @file types.ts
 * @description Type definitions for StackedBarChart component
 */

import type { BaseChartProps } from '../types/base';
import type { LegendConfig } from '../types/legend';
import type { TooltipConfig } from '../types/tooltip';

export type StackedBarChartData = {
  [key: string]: number | string;
};

export type StackedBarChartProps = BaseChartProps & {
  data: StackedBarChartData[]; // Data format: array of objects, each object is a bar (e.g., month), keys are stack categories
  keys: string[]; // Keys from the data objects to stack (e.g., ['Out of Compliance', 'Ineligible', ...])
  indexBy: string; // The key in data objects to use as the index (e.g., 'month')
  layout?: 'vertical' | 'horizontal'; // Orientation of the chart, defaults to 'vertical'
  colors?: string[]; // Colors for the stacked segments
  showGridLines?: boolean;
  showLegend?: boolean;
  legend?: LegendConfig;
  showXAxis?: boolean;
  showYAxis?: boolean;
  xAxisTextColor?: string;
  yAxisTextColor?: string;
  axisLineColor?: string;
  yAxisTicks?: number;
  tooltip?: TooltipConfig;
  barCornerRadius?: number;
  showValues?: boolean;
  valuesFontSize?: string;
  valuesFontColor?: string;
  barOpacity?: number;
  animationDuration?: number;
  visibleKeys?: string[];
  setVisibleKeys?: React.Dispatch<React.SetStateAction<string[]>>;
  tooltipComponent?: React.ComponentType<{
    data: { id: string; value: number; indexValue: string };
    color: string;
  }>;
};
