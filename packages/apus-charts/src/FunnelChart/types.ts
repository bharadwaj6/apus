import type { BaseChartProps } from '../types/base';
import type { LegendConfig } from '../types/legend';
import type { TooltipConfig } from '../types/tooltip';

export interface FunnelData {
  label: string;
  value: number;
  color?: string;
}

export interface FunnelChartProps extends BaseChartProps {
  data: FunnelData[];
  showValues?: boolean;
  valueFormat?: (value: number) => string;
  onSliceClick?: (data: FunnelData) => void;
  isDarkMode?: boolean;
  // Tooltip props
  tooltip?: TooltipConfig;
  tooltipFormat?: (data: FunnelData) => string;
  // Legend props
  showLegend?: boolean;
  legend?: LegendConfig;
  clickableLegend?: boolean;
  onLegendItemClick?: (data: FunnelData | null) => void;
  enableGradients?: boolean;
  gradientDirection?: 'vertical' | 'horizontal';
  segmentShadowColor?: string;
  segmentShadowBlur?: number;
  segmentShadowOffsetX?: number;
  segmentShadowOffsetY?: number;
}

export interface TimeSeriesFunnelData {
  periodLabel: string; // e.g., "Jan 2023", "Week 1", "Day 1"
  data: FunnelData[]; // The existing FunnelData for this period
}

export interface TimeSeriesFunnelChartProps extends Omit<FunnelChartProps, 'data'> {
  seriesData: TimeSeriesFunnelData[];
  chartWidth?: number; // Optional width for each individual chart
  chartHeight?: number; // Optional height for each individual chart
  spacing?: number; // Spacing between charts
  chartTitleColor?: string;
  chartTitleFontSize?: string;
  chartTitleFontFamily?: string;
}

export interface TrendData {
  value: number;
  previousValue: number;
  change: number;
  changePercentage: number;
}

export interface HistoricalData {
  timestamp: number;
  value: number;
}

export interface SegmentAnalytics {
  performance: {
    conversionRate: number;
    averageValue: number;
    peakValue: number;
    trend: TrendData;
  };
  contribution: {
    percentageOfTotal: number;
    relativeToPrevious: number;
  };
  correlation: {
    correlationScore: number;
    relatedSegments: Array<{
      segmentId: string;
      correlationValue: number;
    }>;
  };
}

export interface SegmentedFunnelSegment {
  channel: string;
  value: number;
  color?: string;
  trend?: TrendData;
  historicalData?: HistoricalData[];
  analytics?: SegmentAnalytics;
}

export interface SegmentedFunnelStage {
  label: string; // Stage label, e.g., "Website Visits", "Sign-ups"
  segments: SegmentedFunnelSegment[];
}

export interface SegmentedFunnelChartProps
  extends Omit<FunnelChartProps, 'data' | 'onSliceClick' | 'tooltipFormat'> {
  data: SegmentedFunnelStage[];
  onSliceClick?: (data: {
    stageLabel: string;
    segment: SegmentedFunnelSegment;
    totalStageValue: number;
  }) => void;
  tooltipSegmentFormat?: (data: {
    stageLabel: string;
    segment: SegmentedFunnelSegment;
    totalStageValue: number;
  }) => string;
  showTrendIndicators?: boolean;
  showMiniCharts?: boolean;
  showAnalytics?: boolean;
  miniChartHeight?: number;
  trendIndicatorSize?: number;
  analyticsDisplayMode?: 'tooltip' | 'inline' | 'both';
  // Legacy tooltip props (kept for build compatibility after upstream merge)
  tooltipBackgroundColor?: string;
  tooltipTextColor?: string;
  tooltipPadding?: string;
  tooltipBorderRadius?: string;
  tooltipFontSize?: string;
  tooltipOffsetX?: number;
  tooltipOffsetY?: number;
}
