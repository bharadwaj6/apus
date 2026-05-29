/**
 * @file chartUtils.ts
 * @description Utility functions for chart components (rewritten as pure JSX for zero-dep)
 */
import React from 'react';
import type { Margin } from '../types/base';
import type { LegendConfig } from '../types/legend';

/**
 * Returns a <defs> element containing a linearGradient (pure JSX replacement for old d3 version)
 */
export const createGradient = (
  id: string,
  colors: string[],
  vertical = true,
): React.ReactElement => {
  if (!colors || colors.length < 2) return <defs key={id} />;
  return (
    <defs key={id}>
      <linearGradient
        id={id}
        x1={vertical ? '0%' : '0%'}
        y1={vertical ? '0%' : '0%'}
        x2={vertical ? '0%' : '100%'}
        y2={vertical ? '100%' : '0%'}
      >
        {colors.map((color, i) => (
          <stop
            key={i}
            offset={`${(i / (colors.length - 1)) * 100}%`}
            stopColor={color}
          />
        ))}
      </linearGradient>
    </defs>
  );
};

/**
 * Returns grid line elements as pure JSX (replacement for old d3 mutation version)
 */
export const addGridLines = (
  xScale: any,
  yScale: any,
  width: number,
  height: number,
  showXGrid: boolean,
  showYGrid: boolean,
  ticks: number,
  color: string,
): React.ReactElement => {
  const elements: React.ReactElement[] = [];

  if (showYGrid && yScale?.ticks) {
    const yTicks = yScale.ticks(ticks);
    yTicks.forEach((tick: number, i: number) => {
      const y = yScale(tick);
      elements.push(
        <line
          key={`ygrid-${i}`}
          x1={0}
          x2={width}
          y1={y}
          y2={y}
          stroke={color}
          strokeOpacity={0.2}
        />
      );
    });
  }

  if (showXGrid && xScale) {
    const xTicks = (xScale.domain?.() || []).map((d: any, i: number) => {
      const x = typeof xScale === 'function' ? xScale(d) : (xScale(d) || 0) + (xScale.bandwidth?.() || 0) / 2;
      return (
        <line
          key={`xgrid-${i}`}
          x1={x}
          x2={x}
          y1={0}
          y2={height}
          stroke={color}
          strokeOpacity={0.2}
        />
      );
    });
    elements.push(...xTicks);
  }

  return <g key="grid-lines" className="grid-line">{elements}</g>;
};

/**
 * Adds a legend to a chart
 * @param g - D3 selection of the group element
 * @param labels - Array of labels for the legend
 * @param colors - Array of colors or a single color for the legend
 * @param legend - LegendConfig object
 * @param innerWidth - Inner width of the chart
 * @param innerHeight - Inner height of the chart
 * @param margin - Margins of the chart
 * @param gradientIds - Optional array of gradient IDs
 */
export const addLegend = (
  g: d3.Selection<SVGGElement , unknown, null, undefined>,
  labels: string[],
  colors: string | string[],
  legend: LegendConfig | undefined,
  innerWidth: number,
  innerHeight: number,
  margin: Margin,
  gradientIds?: string[],
): void => {
  if (!labels || labels.length === 0) return;

  const legendConfig = legend || {};
  const position = legendConfig.position || 'bottom';
  const fontSize = legendConfig.itemFontSize || '12px';
  const fontColor = legendConfig.itemColor || '#333';
  const swatchSize = legendConfig.swatchSize || 16;
  const gap = legendConfig.gap || 8;

  // Calculate legend dimensions and position
  const legendItemHeight = swatchSize + gap;
  const legendItemWidth = 80;
  const legendHeight = labels.length * legendItemHeight;

  let legendX = 0;
  let legendY = 0;

  // Position the legend based on the position prop
  switch (position) {
    case 'top':
      legendX = innerWidth / 2 - (legendItemWidth * labels.length) / 2;
      legendY = -margin.top / 2;
      break;
    case 'right':
      legendX = innerWidth + gap;
      legendY = innerHeight / 2 - legendHeight / 2;
      break;
    case 'bottom':
      legendX = innerWidth / 2 - (legendItemWidth * labels.length) / 2;
      legendY = innerHeight + gap + 15; // Added extra padding to avoid x-axis overlap
      break;
    case 'left':
      legendX = -margin.left + gap;
      legendY = innerHeight / 2 - legendHeight / 2;
      break;
  }

  // Create legend group
  const legendGroup = g
    .append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${legendX}, ${legendY})`);

  // For horizontal legends (top/bottom), arrange items side by side
  const isHorizontal = position === 'top' || position === 'bottom';

  // Create legend items
  labels.forEach((label, i) => {
    const itemX = isHorizontal ? i * legendItemWidth : 0;
    const itemY = isHorizontal ? 0 : i * legendItemHeight;

    const legendItem = legendGroup.append('g').attr('transform', `translate(${itemX}, ${itemY})`);

    // Add colored rectangle
    legendItem
      .append('rect')
      .attr('width', swatchSize)
      .attr('height', swatchSize)
      .attr('fill', () => {
        if (gradientIds && gradientIds[i]) {
          return `url(#${gradientIds[i]})`;
        }
        return Array.isArray(colors) ? colors[i % colors.length] : colors;
      });

    // Add text label
    legendItem
      .append('text')
      .attr('x', swatchSize + gap)
      .attr('y', swatchSize / 2 + 4)
      .style('font-size', fontSize)
      .style('fill', fontColor)
      .text(label);
  });
};
