/**
 * @file LineChart.tsx
 * @description Main LineChart component
 * @author Harsha Attray
 */
import React, { useRef, useEffect } from 'react';
import { LineChartProps } from './types';
import { useChartDimensions } from '../hooks/useChartDimensions';
import { useTooltip } from '../hooks/useTooltip';
import { LineChartRenderer } from './LineChartRenderer';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Use custom hooks
  const dimensions = useChartDimensions(containerRef, width, height, responsive);
  // Temporary: pass the tooltip config prop (new hook signature takes only config).
  // The legacy ref + applyTooltipStyles path is no longer supported by the hook.
  const tooltipHook = useTooltip(tooltip);

  // Apply tooltip styles when component mounts (no-op for now; new Tooltip component handles styles)
  useEffect(() => {
    // tooltipHook has no applyTooltipStyles in the current implementation
  }, [tooltipHook]);

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
        <LineChartRenderer
          svgRef={svgRef}
          tooltipRef={tooltipRef}
          data={data}
          dimensions={dimensions}
          colors={colors}
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
          legend={legend}
        />
      </svg>
      <div ref={tooltipRef} className="tooltip" style={{ opacity: 0 }} />
    </div>
  );
};
