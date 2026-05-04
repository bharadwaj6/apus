import type { BaseChartProps } from '../types/base';
import type { LegendConfig } from '../types/legend';
import type { TooltipConfig } from '../types/tooltip';

export type NestedDonutDataPoint = {
  label: string;
  value: number;
  color?: string;
};

export type NestedDonutLevelData = NestedDonutDataPoint[];

export type NestedDonutChartProps = BaseChartProps & {
  levels: NestedDonutLevelData[];
  colors?: string[][];
  centerLabel?: string;
  centerValue?: string | number;
  onSliceClick?: (levelIndex: number, data: NestedDonutDataPoint) => void;
  showLegend?: boolean;
  legend?: LegendConfig;
  theme?: 'light' | 'dark';
  // Added glow effect props
  enableGlow?: boolean;
  glowColor?: string; // defaults to slice color
  glowBlur?: number; // Gaussian blur standard deviation
  innerRadius?: number;
  outerRadius?: number;
  cornerRadius?: number;
  padAngle?: number;
  tooltip?: TooltipConfig;
};

// NestedDonutChartRendererProps is the same as NestedDonutChartProps
export type NestedDonutChartRendererProps = NestedDonutChartProps;

export {};
