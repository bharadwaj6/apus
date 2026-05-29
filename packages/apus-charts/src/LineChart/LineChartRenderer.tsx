/**
 * @file LineChartRenderer.tsx
 * @description Renderer component for the LineChart (modern zero-dep pure JSX version)
 */
import React from 'react';
import { LineChartSeries } from './types';
import type { LegendConfig } from '../types/legend';
import type { Dimensions } from '../hooks/useChartDimensions';
import type { Margin } from '../types/base';
import { XAxis, YAxis } from '../components/Axis';
import { pointScale, linearScale, maxOf, linePath, areaPath } from '../math';

type LineChartRendererProps = {
  data: LineChartSeries[];
  dimensions: Dimensions;
  margin: Margin;
  colors: string | string[];
  areaColor?: string;
  pointColor?: string;
  yAxisTicks: number;
  showXAxis: boolean;
  showYAxis: boolean;
  showGridLines: boolean;
  areaGradientColors?: string[];
  lineGradientColors?: string[];
  showArea: boolean;
  showLegend: boolean;
  legend: LegendConfig;
  responsive?: boolean;
  showTooltip?: (content: string, event: React.MouseEvent | MouseEvent) => void;
  hideTooltip?: () => void;
};

export const LineChartRenderer: React.FC<LineChartRendererProps> = ({
  data,
  dimensions,
  margin,
  colors = '#4682b4',
  areaColor = 'rgba(70, 130, 180, 0.3)',
  pointColor = '#88b0de',
  yAxisTicks,
  showXAxis,
  showYAxis,
  showGridLines,
  areaGradientColors,
  lineGradientColors,
  showArea,
  showLegend,
  legend = {},
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

  const allPoints = data.flatMap((series) => series.dataPoints || series.values || []);
  const xDomain = Array.from(new Set(allPoints.map((p: any) => String(p.label))));
  const yMax = maxOf(allPoints, (p: any) => p.value);

  const xScale = pointScale(xDomain, [0, innerWidth]);
  const yScale = linearScale([0, yMax || 1], [innerHeight, 0]);

  const colorArray = Array.isArray(colors) ? colors : [colors || '#4682b4'];

  const seriesElements = data.map((series, si) => {
    const seriesColor = colorArray[si % colorArray.length];
    const points = series.dataPoints || series.values || [];

    if (points.length === 0) return null;

    const lineD = linePath(
      points,
      (d: any) => xScale(String(d.label)) ?? 0,
      (d: any) => yScale(d.value),
      'monotone',
    );

    const areaD = showArea
      ? areaPath(
          points,
          (d: any) => xScale(String(d.label)) ?? 0,
          (d: any) => yScale(0),
          (d: any) => yScale(d.value),
          'monotone',
        )
      : null;

    const onPointEnter = (e: React.MouseEvent<SVGCircleElement>, pt: any) => {
      if (showTooltip) {
        const content = `<strong>${series.name}</strong><br/>${pt.label}: ${pt.value}`;
        showTooltip(content, e);
      }
    };
    const onPointLeave = () => hideTooltip?.();

    return (
      <g key={si}>
        {areaD && (
          <path
            d={areaD}
            fill={areaGradientColors ? 'url(#areaGradient)' : areaColor}
            opacity={0.35}
            stroke="none"
          />
        )}

        <path
          d={lineD}
          fill="none"
          stroke={lineGradientColors ? 'url(#lineGradient)' : seriesColor}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {points.map((pt: any, pi: number) => {
          const cx = xScale(String(pt.label)) ?? 0;
          const cy = yScale(pt.value);
          return (
            <circle
              key={pi}
              cx={cx}
              cy={cy}
              r={4}
              fill={pointColor}
              stroke="#fff"
              strokeWidth={1.5}
              onMouseEnter={(e) => onPointEnter(e, pt)}
              onMouseLeave={onPointLeave}
              style={{ cursor: 'pointer' }}
            />
          );
        })}
      </g>
    );
  });

  const defs = (areaGradientColors || lineGradientColors) && (
    <defs>
      {areaGradientColors && areaGradientColors.length >= 2 && (
        <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={areaGradientColors[0]} stopOpacity={0.5} />
          <stop offset="100%" stopColor={areaGradientColors[1]} stopOpacity={0.1} />
        </linearGradient>
      )}
      {lineGradientColors && lineGradientColors.length >= 2 && (
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={lineGradientColors[0]} />
          <stop offset="100%" stopColor={lineGradientColors[1]} />
        </linearGradient>
      )}
    </defs>
  );

  return (
    <g transform={`translate(${margin.left}, ${margin.top})`}>
      {defs}

      {showGridLines && showYAxis && (
        <g className="grid" opacity={0.15}>
          {yScale.ticks(6).map((tick: number, i: number) => (
            <line
              key={i}
              x1={0}
              x2={innerWidth}
              y1={yScale(tick)}
              y2={yScale(tick)}
              stroke={axisLineColor || '#ccc'}
            />
          ))}
        </g>
      )}

      <g className="series">{seriesElements}</g>

      {showXAxis && (
        <g transform={`translate(0, ${innerHeight})`}>
          <XAxis
            scale={xScale as any}
            innerHeight={0}
            ticks={xDomain}
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
