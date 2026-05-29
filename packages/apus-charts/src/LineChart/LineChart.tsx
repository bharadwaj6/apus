/**
 * @file LineChart.tsx
 * @description Main LineChart component
 * @author Harsha Attray
 */
import React, { useRef } from 'react';
import { LineChartProps } from './types';
import { useChartDimensions } from '../hooks/useChartDimensions';
import { useTooltip } from '../hooks/useTooltip';
import { LineChartRenderer } from './LineChartRenderer';
import { useChartTheme } from '../theme/ChartThemeContext';
import type { LegendConfig } from '../types/legend';
import type { TooltipConfig } from '../types/tooltip';
import { Tooltip } from '../components/Tooltip';

/**
 * LineChart component for rendering line charts
 */
export const LineChart: React.FC<LineChartProps> = ({
  data,
  width = 600,
  height = 400,
  colors = '#4682b4',
  areaColor = 'rgba(70, 130, 180, 0.3)',
  pointColor = '#88b0de',
  margin = { top: 20, right: 30, bottom: 30, left: 40 },
  yAxisTicks = 5,
  showXAxis = true,
  showYAxis = true,
  showGridLines = false,
  tooltip = {
    backgroundColor: '#333333',
    textColor: '#ffffff',
    padding: '8px',
    borderRadius: '4px',
    fontSize: '12px',
  },
  areaGradientColors,
  lineGradientColors,
  showArea = true,
  responsive = true,
  showLegend = false,
  legend = {
    position: 'bottom',
    itemFontSize: '12px',
    itemColor: '#cccccc',
  },
  ariaLabel = 'Line chart',
}) => {
  const theme = useChartTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  // Merge tooltip config with theme
  const tooltipConfig: TooltipConfig = {
    ...theme.tooltip,
    ...tooltip,
  };

  // Merge legend
  const legendConfig: LegendConfig = {
    ...theme.legend,
    ...legend,
    show: showLegend,
  };

  const dimensions = useChartDimensions(containerRef, width, height, responsive);

  const tooltipHook = useTooltip(tooltipConfig);

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
        width={dimensions.width}
        height={dimensions.height}
        style={{
          position: responsive ? 'absolute' : undefined,
          top: 0,
          left: 0,
        }}
        aria-label={ariaLabel}
      >
        <LineChartRenderer
          data={data}
          dimensions={dimensions}
          colors={Array.isArray(colors) ? colors : [colors]}
          areaColor={areaColor}
          pointColor={pointColor}
          margin={margin}
          yAxisTicks={yAxisTicks}
          showXAxis={showXAxis}
          showYAxis={showYAxis}
          showGridLines={showGridLines}
          areaGradientColors={areaGradientColors}
          lineGradientColors={lineGradientColors}
          showArea={showArea}
          showLegend={showLegend}
          legend={legendConfig}
          responsive={responsive}
          showTooltip={tooltipHook.showTooltip}
          hideTooltip={tooltipHook.hideTooltip}
        />
      </svg>
      <Tooltip state={tooltipHook.tooltipState} config={tooltipConfig} />
    </div>
  );
};
