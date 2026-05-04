/**
 * @file types.ts
 * @description Type definitions for the DonutChart component
 */

import type { BaseChartProps } from '../types/base';
import type { LegendConfig } from '../types/legend';
import type { TooltipConfig } from '../types/tooltip';

export type DonutChartData = {
  label: string;
  value: number;
  color?: string;
  extraInfo?: React.ReactNode | string;
};

export type DonutChartLegendItem = {
  label: string;
  color: string;
  value: number;
  percentage: number;
};

export type DonutChartProps = BaseChartProps & {
  data: DonutChartData[];
  innerRadius?: number;
  outerRadius?: number;
  innerRadiusRatio?: number; // 0.5 for donut, 0 for pie
  colors?: string[];
  showTooltip?: boolean;
  tooltip?: TooltipConfig;
  showLegend?: boolean;
  legend?: LegendConfig;
  centerLabel?: string;
  centerValue?: string | number;
  centerIcon?: React.ReactNode;
  extraCenterInfo?: React.ReactNode;
  showHoverEffect?: boolean;
  onSliceClick?: (data: DonutChartData) => void;
  cornerRadius?: number;
  padAngle?: number;
  theme?: 'light' | 'dark';
  enableGlow?: boolean;
  glowColor?: string;
  glowBlur?: number;
};

export type DonutChartRendererProps = DonutChartProps;

export {};
