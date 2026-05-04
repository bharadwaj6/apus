/**
 * @file StackedBarChart.tsx
 * @description Main StackedBarChart component
 */
import React, { useRef, useEffect, useState } from 'react';
import { StackedBarChartProps } from './types';
import { useChartDimensions } from '../hooks/useChartDimensions';
import { useTooltip } from '../hooks/useTooltip';
import { StackedBarChartRenderer } from './StackedBarChartRenderer';
import { useChartTheme } from '../theme/ChartThemeContext';
import type { TooltipConfig, LegendConfig } from '../types';

/**
 * StackedBarChart component for rendering stacked bar charts
 */
export const StackedBarChart: React.FC<StackedBarChartProps> = (props) => {
  const theme = useChartTheme();

  const {
    data,
    keys,
    indexBy,
    width = 600,
    height = 400,
    layout = 'vertical',
    colors: colorsProp,
    margin = props.margin || theme.margin,
    responsive = true,
    showXAxis = true,
    showYAxis = true,
    showGridLines = true,
    xAxisTextColor = props.xAxisTextColor || theme.axis.textColor,
    yAxisTextColor = props.yAxisTextColor || theme.axis.textColor,
    axisLineColor = props.axisLineColor || theme.axis.lineColor,
    yAxisTicks = 5,
    tooltip: tooltipProp,
    showLegend = true,
    legend: legendProp,
    barCornerRadius = 0,
    showValues = false,
    valuesFontSize = '10px',
    valuesFontColor = '#333',
    barOpacity = 1,
    animationDuration = 750,
    visibleKeys: externalVisibleKeys,
    setVisibleKeys: externalSetVisibleKeys,
    ariaLabel = 'Stacked bar chart',
  } = props;

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
    ...legendProp,
    show: showLegend,
  };

  // State for tracking visible keys if not controlled from parent
  const [internalVisibleKeys, setInternalVisibleKeys] = useState<string[]>(keys);

  // Use controlled visibleKeys if provided, otherwise use local state
  const visibleKeys = externalVisibleKeys !== undefined ? externalVisibleKeys : internalVisibleKeys;
  const setVisibleKeys = externalSetVisibleKeys || setInternalVisibleKeys;

  // Use custom hooks
  const dimensions = useChartDimensions(containerRef, width, height, responsive);
  const tooltip = useTooltip(tooltipRef, tooltipConfig);

  // Apply tooltip styles when component mounts
  useEffect(() => {
    tooltip.applyTooltipStyles();
  }, [tooltip]);

  // Update visible keys when keys prop changes
  useEffect(() => {
    if (!externalSetVisibleKeys) {
      setInternalVisibleKeys(keys);
    }
  }, [keys, externalSetVisibleKeys, setInternalVisibleKeys]);

  const paddingBottom = responsive ? `${(height / width) * 100}%` : undefined;

  return (
    <div
      ref={containerRef}
      style={{
        position: responsive ? 'relative' : undefined,
        width: responsive ? '100%' : width,
        height: responsive ? '0' : height,
        paddingBottom: paddingBottom,
        minHeight: responsive ? undefined : height,
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
        <StackedBarChartRenderer
          svgRef={svgRef}
          tooltipRef={tooltipRef}
          data={data}
          keys={keys}
          indexBy={indexBy}
          dimensions={dimensions}
          colors={colorsProp || ['#f8a07b', '#ffc5b2', '#ff7c43', '#e34a33', '#b30000', '#7f0000']}
          margin={margin}
          layout={layout}
          showXAxis={showXAxis}
          showYAxis={showYAxis}
          showGridLines={showGridLines}
          xAxisTextColor={xAxisTextColor}
          yAxisTextColor={yAxisTextColor}
          axisLineColor={axisLineColor}
          yAxisTicks={yAxisTicks}
          tooltip={tooltipConfig}
          showLegend={showLegend}
          legend={legendConfig}
          barCornerRadius={barCornerRadius}
          showValues={showValues}
          valuesFontSize={valuesFontSize}
          valuesFontColor={valuesFontColor}
          barOpacity={barOpacity}
          animationDuration={animationDuration}
          visibleKeys={visibleKeys}
          setVisibleKeys={setVisibleKeys}
        />
      </svg>
      <div ref={tooltipRef} aria-hidden="true" />
    </div>
  );
};
