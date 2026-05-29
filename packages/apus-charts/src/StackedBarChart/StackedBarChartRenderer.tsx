/**
 * @file StackedBarChartRenderer.tsx
 * @description Renderer component for the StackedBarChart
 */
import React from 'react';
import { StackedBarChartData } from './types';
import { Dimensions } from '../hooks/useChartDimensions';
import type { Margin } from '../types/base';
import type { LegendConfig } from '../types/legend';
import { XAxis, YAxis } from '../components/Axis';
import {
  stackLayout,
  ordinalScale,
  bandScale,
  linearScale,
  type StackedSeries,
  type StackedPoint,
} from '../math';

// Type for a segment of a stacked bar (from math stackLayout)
type StackedBarSegment = StackedPoint<StackedBarChartData>;

// Define the props for the renderer component - updated for pure JSX, new tooltip callbacks
export interface StackedBarChartRendererProps {
  layout?: 'vertical' | 'horizontal';
  tooltipComponent?: React.ComponentType<{
    data: { id: string; value: number; indexValue: string };
    color: string;
  }>;
  data: StackedBarChartData[];
  keys: string[];
  indexBy: string;
  dimensions: Dimensions;
  margin: Margin;
  colors: string[];
  showXAxis: boolean;
  showYAxis: boolean;
  showGridLines: boolean;
  xAxisTextColor: string;
  yAxisTextColor: string;
  axisLineColor: string;
  yAxisTicks: number;
  visibleKeys: string[];
  setVisibleKeys: React.Dispatch<React.SetStateAction<string[]>>;
  showLegend: boolean;
  legend: LegendConfig;
  barCornerRadius?: number;
  showValues?: boolean;
  valuesFontSize?: string;
  valuesFontColor?: string;
  barOpacity?: number;
  animationDuration?: number;
  // New tooltip callbacks (from updated useTooltip)
  showTooltip?: (content: string, event: React.MouseEvent | MouseEvent) => void;
  hideTooltip?: () => void;
}

export const StackedBarChartRenderer: React.FC<StackedBarChartRendererProps> = ({
  data,
  keys,
  indexBy,
  dimensions,
  margin,
  colors,
  showXAxis,
  showYAxis,
  showGridLines,
  xAxisTextColor,
  yAxisTextColor,
  axisLineColor,
  yAxisTicks,
  visibleKeys,
  setVisibleKeys,
  showLegend,
  legend = {},
  barCornerRadius = 0,
  showValues = false,
  valuesFontSize = '10px',
  valuesFontColor = '#333333',
  barOpacity = 1,
  animationDuration = 750,
  layout = 'vertical',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  tooltipComponent,
  showTooltip,
  hideTooltip,
}) => {
  const { width: currentWidth, height: currentHeight } = dimensions;

  if (
    !data ||
    data.length === 0 ||
    !keys ||
    keys.length === 0 ||
    currentWidth <= 0 ||
    currentHeight <= 0
  ) {
    return null;
  }

  // Calculate inner dimensions (pure, no D3)
  let innerWidth = currentWidth - margin.left - margin.right;
  let innerHeight = currentHeight - margin.top - margin.bottom;

  if (innerWidth <= 0 || innerHeight <= 0) return null;

  // Legend measurement/offset calc - pure JS estimates (fixes legend shadowing / legend2 TDZ)
  const legendRectSize = 20;
  const legendItemHorizontalPadding = 8;
  const legendItemSpacing = 15;
  const legendVerticalPadding = 10;
  const legendLineHeight = legendRectSize + legendVerticalPadding;
  let legendWidth = 0;
  let legendHeight = 0;
  const fontSizeForLegend = parseFloat(legend.itemFontSize || '12');

  if (showLegend) {
    if (legend.position === 'top' || legend.position === 'bottom') {
      let curX = 0;
      let numRows = 1;
      keys.forEach((key, i) => {
        const textW = key.length * (fontSizeForLegend * 0.55);
        const itemW = legendRectSize + legendItemHorizontalPadding + textW + legendItemSpacing;
        if (curX + itemW > innerWidth && i > 0) {
          curX = 0;
          numRows++;
        }
        curX += itemW;
      });
      legendHeight = numRows * legendLineHeight;
      innerHeight -= legendHeight;
    } else if (legend.position === 'left' || legend.position === 'right') {
      const maxTextW = Math.max(...keys.map((k) => k.length * (fontSizeForLegend * 0.55)));
      legendWidth = legendRectSize + legendItemHorizontalPadding + maxTextW + legendItemSpacing;
      innerWidth -= legendWidth;
    }
  }

  if (innerWidth <= 0 || innerHeight <= 0) return null;

  // Main chart offset for legend
  let chartX = margin.left;
  let chartY = margin.top;
  if (showLegend) {
    if (legend.position === 'top') chartY += legendHeight + legendVerticalPadding;
    else if (legend.position === 'left') chartX += legendWidth + legendItemSpacing;
  }
  const mainTransform = `translate(${chartX}, ${chartY})`;

  // Legend offset
  let legX = 0;
  let legY = 0;
  if (showLegend) {
    if (legend.position === 'top') {
      legY = margin.top;
    } else if (legend.position === 'bottom') {
      legY = chartY + innerHeight + 20;
    } else if (legend.position === 'left') {
      legX = margin.left;
    } else {
      legX = chartX + innerWidth + legendItemSpacing;
    }
  }

  // Stack using math (replaces d3.stack) - note arg order: keys, data
  const stackedData: StackedSeries<StackedBarChartData>[] = stackLayout(
    visibleKeys.length ? visibleKeys : keys,
    data,
  );

  // Categories for scales
  const categories = data.map((d) => String(d[indexBy]));

  // Scales using math (bandScale + ordinalScale + linearScale)
  let xScale: ReturnType<typeof bandScale> | ReturnType<typeof linearScale>;
  let yScale: ReturnType<typeof linearScale> | ReturnType<typeof bandScale>;

  const defaultColors = ['#f8a07b', '#ffc5b2', '#ff7c43', '#e34a33', '#b30000', '#7f0000'];
  const colorRange = colors && colors.length ? colors : defaultColors;
  const colorScale = ordinalScale(keys, colorRange);

  if (layout === 'vertical') {
    xScale = bandScale(categories, [0, innerWidth], 0.2, 0.1);
    const allPoints = stackedData.flat();
    const yMax = allPoints.length ? Math.max(...allPoints.map((p) => p[1])) : 0;
    const yMin = allPoints.length ? Math.min(...allPoints.map((p) => p[0])) : 0;
    yScale = linearScale([Math.min(0, yMin), yMax || 1], [innerHeight, 0]);
  } else {
    // horizontal
    xScale = linearScale([0, 1], [0, innerWidth]); // temp
    yScale = bandScale(categories, [0, innerHeight], 0.2, 0.1);
    const allPoints = stackedData.flat();
    const xMax = allPoints.length ? Math.max(...allPoints.map((p) => p[1])) : 0;
    const xMin = allPoints.length ? Math.min(...allPoints.map((p) => p[0])) : 0;
    xScale = linearScale([Math.min(0, xMin), xMax || 1], [0, innerWidth]);
  }

  // Build bar series + rects + value labels (pure JSX, replaces all d3.select/append/transition)
  const barSeries: React.ReactNode[] = [];
  const valueLabels: React.ReactNode[] = [];

  stackedData.forEach((series, si) => {
    const fillColor = colorScale(series.key);
    const rects: React.ReactNode[] = [];
    series.forEach((seg, pi) => {
      const catVal = String(seg.data[indexBy]);
      const v0 = seg[0];
      const v1 = seg[1];
      const val = v1 - v0;

      let rx = 0,
        ry = 0,
        rw = 0,
        rh = 0,
        posX = 0,
        posY = 0;

      if (layout === 'vertical') {
        posX = (xScale as any)(catVal) || 0;
        rw = (xScale as any).bandwidth ? (xScale as any).bandwidth() : 20;
        posY = (yScale as any)(Math.max(v0, v1));
        rh = Math.abs((yScale as any)(v0) - (yScale as any)(v1));
      } else {
        posY = (yScale as any)(catVal) || 0;
        rh = (yScale as any).bandwidth ? (yScale as any).bandwidth() : 20;
        posX = (xScale as any)(Math.min(v0, v1));
        rw = Math.abs((xScale as any)(v1) - (xScale as any)(v0));
      }

      const onEnter = (e: React.MouseEvent<SVGRectElement>) => {
        if (showTooltip) {
          const html = `<div style="padding: 8px; min-width: 140px; font-family: sans-serif; font-size: 12px;"><strong>${catVal}</strong><hr style="border-top: 1px solid #eee; margin: 4px 0;"><div style="display:flex;align-items:center;"><span style="display:inline-block;width:10px;height:10px;background:${fillColor};margin-right:5px;border-radius:2px;"></span><span>${series.key}: ${val.toLocaleString()}</span></div></div>`;
          showTooltip(html, e);
        }
      };
      const onLeave = () => {
        hideTooltip?.();
      };

      rects.push(
        <rect
          key={pi}
          className="bar-segment"
          x={posX}
          y={posY}
          width={Math.max(0, rw)}
          height={Math.max(0, rh)}
          rx={barCornerRadius}
          ry={barCornerRadius}
          fill={fillColor}
          opacity={barOpacity}
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
        />,
      );

      if (showValues && val !== 0) {
        let lx = posX,
          ly = posY;
        if (layout === 'vertical') {
          lx = posX + rw / 2;
          ly = posY - 4;
        } else {
          lx = posX + rw / 2;
          ly = posY + rh / 2 + 3;
        }
        valueLabels.push(
          <text
            key={`val-${si}-${pi}`}
            x={lx}
            y={ly}
            textAnchor="middle"
            fontSize={valuesFontSize}
            fill={valuesFontColor}
          >
            {val.toFixed(0)}
          </text>,
        );
      }
    });

    barSeries.push(
      <g key={si} fill={fillColor} opacity={barOpacity}>
        {rects}
      </g>,
    );
  });

  // Axes - use <XAxis>/<YAxis> where types allow; manual for horiz y-band to avoid type issues
  const axisNodes: React.ReactNode[] = [];
  if (showXAxis) {
    const xS = layout === 'vertical' ? (xScale as any) : (xScale as any);
    axisNodes.push(
      <g key="xax" className="x-axis">
        <XAxis
          scale={xS}
          innerHeight={innerHeight}
          textColor={xAxisTextColor}
          lineColor={axisLineColor}
          fontSize={10}
        />
      </g>,
    );
  }
  if (showYAxis && layout === 'vertical') {
    axisNodes.push(
      <g key="yax" className="y-axis">
        <YAxis
          scale={yScale as any}
          innerWidth={innerWidth}
          tickCount={yAxisTicks}
          textColor={yAxisTextColor}
          lineColor={axisLineColor}
          fontSize={10}
        />
      </g>,
    );
  }
  // For horizontal, manual category axis on left using y band (no YAxis band support)
  if (showYAxis && layout === 'horizontal' && yScale && 'bandwidth' in (yScale as any)) {
    const yB = yScale as any;
    const tickNodes = categories.map((cat, i) => {
      const yy = yB(cat) + (yB.bandwidth ? yB.bandwidth() / 2 : 0);
      return (
        <g key={i} transform={`translate(0, ${yy})`}>
          <line x1={-6} x2={0} stroke={axisLineColor} />
          <text
            x={-10}
            textAnchor="end"
            dominantBaseline="middle"
            fill={yAxisTextColor}
            fontSize={10}
          >
            {cat}
          </text>
        </g>
      );
    });
    axisNodes.push(
      <g key="yax-h" className="y-axis">
        <line y1={0} y2={innerHeight} stroke={axisLineColor} />
        {tickNodes}
      </g>,
    );
  }

  // Pure legend (no d3, no shadowing, uses estimated widths from above)
  let legendNode: React.ReactNode = null;
  if (showLegend && keys.length > 0) {
    const items: React.ReactNode[] = [];
    let curX = 0;
    let curY = 0;
    const isHorizontalLeg = legend.position === 'top' || legend.position === 'bottom';

    keys.forEach((key, i) => {
      const isVis = visibleKeys.includes(key);
      const fillC = colorScale(key);
      const textW = key.length * (fontSizeForLegend * 0.55);
      const itemW = legendRectSize + legendItemHorizontalPadding + textW + legendItemSpacing;

      if (isHorizontalLeg && curX + itemW > innerWidth && i > 0) {
        curX = 0;
        curY += legendLineHeight;
      }

      const itemTransform = `translate(${curX}, ${curY})`;
      const clickH = () => {
        setVisibleKeys((prev) =>
          prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
        );
      };

      items.push(
        <g
          key={key}
          className="legend-item"
          transform={itemTransform}
          opacity={isVis ? 1 : 0.5}
          style={{ cursor: 'pointer' }}
          onClick={clickH}
        >
          <rect
            width={legendRectSize}
            height={legendRectSize}
            rx={legendRectSize / 2}
            ry={legendRectSize / 2}
            fill={fillC}
          />
          <text
            x={legendRectSize + legendItemHorizontalPadding}
            y={legendRectSize / 2}
            dy="0.35em"
            fontSize={legend.itemFontSize}
            fill={legend.itemColor || '#333'}
          >
            {key}
          </text>
        </g>,
      );

      if (isHorizontalLeg) {
        curX += itemW;
      } else {
        curY += legendLineHeight;
      }
    });

    legendNode = (
      <g
        className="legend"
        transform={`translate(${legX}, ${legY})`}
        style={{ pointerEvents: 'none' }}
      >
        {items}
      </g>
    );
  }

  return (
    <>
      <g transform={mainTransform}>
        <g className="bar-series-container">{barSeries}</g>
        {showValues && valueLabels.length > 0 && <g className="value-labels">{valueLabels}</g>}
        {axisNodes}
      </g>
      {legendNode}
    </>
  );
};
