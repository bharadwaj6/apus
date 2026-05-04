import type { CSSProperties } from 'react';
import type { LegendConfig } from '../types/legend';
import type { TooltipConfig } from '../types/tooltip';
import type { Margin } from '../types/base';

export interface ChartTheme {
  /** Default colors for chart series */
  colors: {
    primary: string[];
    secondary: string[];
  };
  /** Tooltip default styles */
  tooltip: TooltipConfig;
  /** Legend default styles */
  legend: LegendConfig;
  /** Axis styles */
  axis: {
    textColor: string;
    lineColor: string;
    fontSize: string;
    fontFamily?: string;
  };
  /** Grid styles */
  grid: {
    color: string;
    opacity: number;
    strokeWidth?: number;
    strokeDasharray?: string;
  };
  /** Default margin */
  margin: Margin;
  /** Font family for the chart */
  fontFamily?: string;
  /** Background color */
  backgroundColor?: string;
}
