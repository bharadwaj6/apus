/**
 * @file BarChart.tsx
 * @description Main BarChart component
 * @author Harsha Attray
 */
import React, { useRef, useEffect } from 'react';
import { BarChartProps } from './types';
import { useChartDimensions } from '../hooks/useChartDimensions';
import { useTooltip } from '../hooks/useTooltip';
import { BarChartRenderer } from './BarChartRenderer';
import { useChartTheme } from '../theme/ChartThemeContext';
import type { LegendConfig } from '../types/legend';
import type { TooltipConfig } from '../types/tooltip';

/**
 * BarChart component for rendering bar charts
 */
export const BarChart: React.FC<BarChartProps> = (props) => {
  const theme = useChartTheme();

  const {
    data,
    width = 600,
    height = 400,
    margin = props.margin || theme.margin,
    responsive = true,
    colors = ['#6a93d1'],
    gradientColors,
    showXAxis = true,
    showYAxis = true,
    showGridLines = false,
    xAxisTextColor = props.xAxisTextColor || theme.axis.textColor,
    yAxisTextColor = props.yAxisTextColor || theme.axis.textColor,
    axisLineColor = props.axisLineColor || theme.axis.lineColor,
    yAxisTicks = 5,
    showLegend = false,
    legend,
    ariaLabel = 'Bar chart',
  } = props;

  const { tooltip: tooltipProp } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Merge tooltip config with theme
  const tooltipConfig: TooltipConfig = {
    ...theme.tooltip,
    ...tooltipProp,
  };

  // Merge legend config with theme
  const legendConfig: LegendConfig = {
    ...theme.legend,
    ...legend,
  };

  const tooltip = useTooltip(tooltipRef, tooltipConfig);

  // Apply tooltip styles when component mounts
  useEffect(() => {
    tooltip.applyTooltipStyles();
  }, [tooltip]);

  const dimensions = useChartDimensions(containerRef, width, height, responsive);

  const paddingBottom = responsive ? `${(height / width) * 100}%` : undefined;

  return (
    <div
      ref={containerRef}
      style={{
        position: responsive ? 'relative' : undefined,
        width: responsive ? '100%' : width,
        height: responsive ? '0' : height,
        paddingBottom: paddingBottom,
      }}
    >
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{
          position: responsive ? 'absolute' : undefined,
          top: 0,
          left: 0,
        }}
        aria-label={ariaLabel}
      >
        <BarChartRenderer
          svgRef={svgRef}
          tooltipRef={tooltipRef}
          data={data}
          dimensions={dimensions}
          colors={colors}
          gradientColors={gradientColors}
          margin={margin}
          showXAxis={showXAxis}
          showYAxis={showYAxis}
          showGridLines={showGridLines}
          xAxisTextColor={xAxisTextColor}
          yAxisTextColor={yAxisTextColor}
          axisLineColor={axisLineColor}
          yAxisTicks={yAxisTicks}
          showLegend={showLegend}
          legend={legendConfig}
        />
      </svg>
      <div ref={tooltipRef} className="tooltip" style={{ opacity: 0 }} />
    </div>
  );
};
