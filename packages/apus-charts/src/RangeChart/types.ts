import type { BaseChartProps } from '../types/base';
import type { TooltipConfig } from '../types/tooltip';

export interface RangeChartDataItem {
  day: string;
  range1: {
    min: number;
    max: number;
  };
  range2: {
    min: number;
    max: number;
  };
}

export interface RangeChartProps extends BaseChartProps {
  data: RangeChartDataItem[];
  colors?: string[]; // [color1, color2]
  showXAxis?: boolean;
  showYAxis?: boolean;
  showGridLines?: boolean;
  xAxisTextColor?: string;
  yAxisTextColor?: string;
  axisLineColor?: string;
  yAxisTicks?: number;
  tooltip?: TooltipConfig;
}
