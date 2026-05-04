import type { BaseChartProps } from '../types/base';
import type { LegendConfig } from '../types/legend';
import type { TooltipConfig } from '../types/tooltip';

export type GradientStop = {
  offset: string;
  color: string;
  opacity?: number;
};

export type GaugeDonutData = {
  label: string;
  value: number;
  color?: string;
  gradient?: GradientStop[];
};

export type GaugeDonutChartProps = BaseChartProps & {
  data: GaugeDonutData[];
  variant?:
    | 'full'
    | 'half-bottom'
    | 'half-top'
    | 'half-left'
    | 'half-right'
    | 'quarter-bottom-right'
    | 'quarter-top-right'
    | 'quarter-bottom-left'
    | 'quarter-top-left';
  centerLabel?: string;
  centerValue?: string | number;
  onSliceClick?: (data: GaugeDonutData) => void;
  colors?: string[];
  innerRadius?: number;
  outerRadius?: number;
  cornerRadius?: number;
  padAngle?: number;
  showLegend?: boolean;
  legend?: LegendConfig;
  showTooltip?: boolean;
  tooltip?: TooltipConfig;
  tooltipFormat?: (data: GaugeDonutData, total: number, percent: string) => string;
  theme?: 'light' | 'dark';
  enableGlow?: boolean;
  glowColor?: string;
  glowBlur?: number;
};

// GaugeDonutChartRendererProps is the same as GaugeDonutChartProps
export type GaugeDonutChartRendererProps = GaugeDonutChartProps;

export {};
