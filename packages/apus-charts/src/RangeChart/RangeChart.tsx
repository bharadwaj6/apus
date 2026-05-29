/**
 * @file RangeChart.tsx
 * @description Main component for the RangeChart
 */
import React, { useRef } from 'react';
import { RangeChartProps } from './types';
import { RangeChartRenderer } from './RangeChartRenderer';
import { useChartDimensions } from '../hooks/useChartDimensions';
import { useTooltip } from '../hooks/useTooltip';
import { useChartTheme } from '../theme/ChartThemeContext';
import type { TooltipConfig } from '../types/tooltip';
import { Tooltip } from '../components/Tooltip';

const defaultMargin = { top: 20, right: 20, bottom: 30, left: 40 };

export const RangeChart: React.FC<RangeChartProps> = ({
  data,
  width = 600,
  height = 400,
  responsive = true,
  colors = ['#8884d8', '#82ca9d'],
  margin = defaultMargin,
  showXAxis = true,
  showYAxis = true,
  showGridLines = true,
  xAxisTextColor = '#333',
  yAxisTextColor = '#333',
  axisLineColor = '#ccc',
  yAxisTicks = 5,
  tooltip,
}) => {
  const theme = useChartTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const dimensions = useChartDimensions(containerRef, width, height, responsive);

  const tooltipConfig: TooltipConfig = {
    ...theme.tooltip,
    ...tooltip,
  };

  const tooltipHook = useTooltip(tooltipConfig);

  return (
    <div
      ref={containerRef}
      style={{
        position: responsive ? 'relative' : undefined,
        width: responsive ? '100%' : width,
        height: responsive ? '0' : height,
        paddingBottom: responsive ? `${(height / width) * 100}%` : undefined,
      }}
    >
      <svg
        width={dimensions.width}
        height={dimensions.height}
        style={{
          position: responsive ? 'absolute' : undefined,
          top: 0,
          left: 0,
        }}
      >
        <RangeChartRenderer
          data={data}
          dimensions={dimensions}
          colors={colors}
          margin={margin}
          showXAxis={showXAxis}
          showYAxis={showYAxis}
          showGridLines={showGridLines}
          xAxisTextColor={xAxisTextColor}
          yAxisTextColor={yAxisTextColor}
          axisLineColor={axisLineColor}
          yAxisTicks={yAxisTicks}
          showTooltip={tooltipHook.showTooltip}
          hideTooltip={tooltipHook.hideTooltip}
        />
      </svg>
      <Tooltip state={tooltipHook.tooltipState} config={tooltipConfig} />
    </div>
  );
};
