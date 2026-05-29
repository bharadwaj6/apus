/**
 * @file BarChartRenderer.tsx
 * @description Renderer component for the BarChart (modern zero-dep version)
 */
import React from 'react';
import { BarChartData } from './types';
import type { Margin } from '../types/base';
import type { Dimensions } from '../hooks/useChartDimensions';
import type { LegendConfig } from '../types/legend';
import { XAxis, YAxis } from '../components/Axis';
import { bandScale, linearScale, maxOf } from '../math';

// Modern renderer props (pure JSX, callbacks for tooltip)
type BarChartRendererProps = {
  data: BarChartData[];
  dimensions: Dimensions;
  margin: Margin;
  colors: string[];
  gradientColors?: string[];
  showXAxis: boolean;
  showYAxis: boolean;
  showGridLines: boolean;
  xAxisTextColor: string;
  yAxisTextColor: string;
  axisLineColor: string;
  yAxisTicks: number;
  showLegend: boolean;
  legend?: LegendConfig;
  showTooltip?: (content: string, event: React.MouseEvent | MouseEvent) => void;
  hideTooltip?: () => void;
};

export const BarChartRenderer: React.FC<BarChartRendererProps> = ({
  data,
  dimensions,
  margin,
  colors,
  gradientColors,
  showXAxis,
  showYAxis,
  showGridLines,
  xAxisTextColor,
  yAxisTextColor,
  axisLineColor,
  yAxisTicks,
  showLegend,
  legend = {},
  showTooltip,
  hideTooltip,
}) => {
  const { width: currentWidth, height: currentHeight } = dimensions;

  if (!data || data.length === 0 || currentWidth <= 0 || currentHeight <= 0) {
    return null;
  }

  // Inner dimensions (pure calculation)
  let innerWidth = currentWidth - margin.left - margin.right;
  let innerHeight = currentHeight - margin.top - margin.bottom;

  if (innerWidth <= 0 || innerHeight <= 0) return null;

  // Simple legend space reservation (bottom only for basic support)
  let legendHeight = 0;
  if (showLegend) {
    legendHeight = 32;
    innerHeight -= legendHeight;
  }

  if (innerWidth <= 0 || innerHeight <= 0) return null;

  const chartX = margin.left;
  const chartY = margin.top;

  // Data
  const categories = data.map((d) => d.label);
  const values = data.map((d) => d.value);
  const maxValue = maxOf(values);

  // Scales (modern math, replaces d3.scaleBand / scaleLinear)
  const xScale = bandScale(categories, [0, innerWidth], 0.15, 0.08);
  const yScale = linearScale([0, maxValue || 1], [innerHeight, 0]);

  const barWidth = xScale.bandwidth ? xScale.bandwidth() : 20;

  // Colors
  const getBarColor = (index: number) => {
    if (gradientColors && gradientColors.length >= 2) {
      // Simple gradient fallback via CSS (or could add <defs> here)
      return `url(#barGradient)`;
    }
    return colors[index % colors.length] || '#6a93d1';
  };

  // Gradient definition if needed (pure JSX)
  const gradientDef =
    gradientColors && gradientColors.length >= 2 ? (
      <defs>
        <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={gradientColors[0]} />
          <stop offset="100%" stopColor={gradientColors[1]} />
        </linearGradient>
      </defs>
    ) : null;

  // Bars as pure JSX
  const bars = data.map((d, i) => {
    const x = xScale(d.label) ?? 0;
    const barHeight = Math.max(0, innerHeight - yScale(d.value));
    const y = yScale(d.value);

    const onMouseEnter = (e: React.MouseEvent<SVGRectElement>) => {
      if (showTooltip) {
        const content = `<strong>${d.label}</strong>: ${d.value}`;
        showTooltip(content, e);
      }
    };

    const onMouseLeave = () => {
      hideTooltip?.();
    };

    return (
      <rect
        key={i}
        x={x}
        y={y}
        width={Math.max(0, barWidth)}
        height={Math.max(0, barHeight)}
        fill={getBarColor(i)}
        rx={2}
        ry={2}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{ cursor: 'pointer' }}
      />
    );
  });

  // Simple bottom legend (if enabled)
  let legendNode: React.ReactNode = null;
  if (showLegend && data.length > 0) {
    const legY = chartY + innerHeight + 18;
    legendNode = (
      <g transform={`translate(${chartX}, ${legY})`}>
        {data.slice(0, 6).map((d, i) => {
          const x = i * 90;
          return (
            <g key={i} transform={`translate(${x}, 0)`}>
              <rect width={12} height={12} rx={2} fill={getBarColor(i)} />
              <text x={16} y={10} fontSize="11" fill={legend.itemColor || '#333'}>
                {d.label}
              </text>
            </g>
          );
        })}
      </g>
    );
  }

  return (
    <g transform={`translate(${chartX}, ${chartY})`}>
      {gradientDef}

      {/* Grid lines (simple manual implementation) */}
      {showGridLines && showYAxis && (
        <g className="grid">
          {yScale.ticks(5).map((tick, i) => {
            const y = yScale(tick);
            return (
              <line
                key={i}
                x1={0}
                x2={innerWidth}
                y1={y}
                y2={y}
                stroke={axisLineColor}
                strokeOpacity={0.2}
              />
            );
          })}
        </g>
      )}

      {/* Bars */}
      <g className="bars">{bars}</g>

      {/* Axes */}
      {showXAxis && (
        <g transform={`translate(0, ${innerHeight})`}>
          <XAxis
            scale={xScale as any}
            innerHeight={0}
            ticks={categories}
            textColor={xAxisTextColor}
            lineColor={axisLineColor}
            fontSize={10}
          />
        </g>
      )}

      {showYAxis && (
        <g>
          <YAxis
            scale={yScale as any}
            innerWidth={innerWidth}
            tickCount={yAxisTicks}
            textColor={yAxisTextColor}
            lineColor={axisLineColor}
            fontSize={10}
          />
        </g>
      )}

      {/* Legend */}
      {legendNode}
    </g>
  );
};
