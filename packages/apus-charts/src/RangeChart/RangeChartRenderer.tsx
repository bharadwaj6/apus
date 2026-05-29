/**
 * @file RangeChartRenderer.tsx
 * @description Renderer component for the RangeChart (modern zero-dep pure JSX version)
 */
import React from 'react';
import { RangeChartDataItem } from './types';
import type { Dimensions } from '../hooks/useChartDimensions';
import type { Margin } from '../types/base';
import { XAxis, YAxis } from '../components/Axis';
import { bandScale, linearScale, maxOf, minOf } from '../math';

type RangeChartRendererProps = {
  data: RangeChartDataItem[];
  dimensions: Dimensions;
  colors: string[];
  margin: Margin;
  showXAxis: boolean;
  showYAxis: boolean;
  showGridLines: boolean;
  xAxisTextColor: string;
  yAxisTextColor: string;
  axisLineColor: string;
  yAxisTicks: number;
  showTooltip?: (content: string, event: React.MouseEvent | MouseEvent) => void;
  hideTooltip?: () => void;
};

export const RangeChartRenderer: React.FC<RangeChartRendererProps> = ({
  data,
  dimensions,
  colors,
  margin,
  showXAxis,
  showYAxis,
  showGridLines,
  xAxisTextColor,
  yAxisTextColor,
  axisLineColor,
  yAxisTicks,
  showTooltip,
  hideTooltip,
}) => {
  const { width: currentWidth, height: currentHeight } = dimensions;

  if (!data || data.length === 0 || currentWidth <= 0 || currentHeight <= 0) {
    return null;
  }

  let innerWidth = currentWidth - margin.left - margin.right;
  let innerHeight = currentHeight - margin.top - margin.bottom;

  if (innerWidth <= 0 || innerHeight <= 0) return null;

  const categories = data.map((d) => d.day);
  const allValues = data.flatMap((d) => [d.range1.min, d.range1.max, d.range2.min, d.range2.max]);
  const yMin = minOf(allValues);
  const yMax = maxOf(allValues);

  const xScale = bandScale(categories, [0, innerWidth], 0.2, 0.1);
  const yScale = linearScale([yMin, yMax || 1], [innerHeight, 0]);

  const barWidth = (xScale.bandwidth ? xScale.bandwidth() : 20) * 0.4;

  const groups = data.map((item, i) => {
    const x =
      (xScale(item.day) ?? 0) + (xScale.bandwidth ? (xScale.bandwidth() - barWidth * 2) / 2 : 0);

    const onEnter = (e: React.MouseEvent) => {
      if (showTooltip) {
        const content = `<strong>${item.day}</strong><br/>Range1: ${item.range1.min} - ${item.range1.max}<br/>Range2: ${item.range2.min} - ${item.range2.max}`;
        showTooltip(content, e as any);
      }
    };
    const onLeave = () => hideTooltip?.();

    return (
      <g key={i} onMouseEnter={onEnter} onMouseLeave={onLeave} style={{ cursor: 'pointer' }}>
        {/* Range1 bar */}
        <rect
          x={x}
          y={yScale(item.range1.max)}
          width={barWidth}
          height={Math.max(0, yScale(item.range1.min) - yScale(item.range1.max))}
          fill={colors[0]}
          rx={2}
        />
        {/* Range2 bar */}
        <rect
          x={x + barWidth + 4}
          y={yScale(item.range2.max)}
          width={barWidth}
          height={Math.max(0, yScale(item.range2.min) - yScale(item.range2.max))}
          fill={colors[1]}
          rx={2}
        />
      </g>
    );
  });

  return (
    <g transform={`translate(${margin.left}, ${margin.top})`}>
      {showGridLines && showYAxis && (
        <g className="grid" opacity={0.15}>
          {yScale.ticks(yAxisTicks).map((tick: number, i: number) => (
            <line
              key={i}
              x1={0}
              x2={innerWidth}
              y1={yScale(tick)}
              y2={yScale(tick)}
              stroke={axisLineColor}
            />
          ))}
        </g>
      )}

      <g className="ranges">{groups}</g>

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
    </g>
  );
};
