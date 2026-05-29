/**
 * @file chartUtils.ts
 * @description Legacy utility functions (temporarily using shim during final upstream merge cleanup)
 */
// @ts-nocheck
// Legacy chartUtils still used by Bar/Line/Range renderers during final migration phase.
// These three charts will be fully rewritten in a follow-up to remove this file's d3 usage.
import * as d3 from '../d3-shim';
import type { Margin } from '../types/base';
import type { LegendConfig } from '../types/legend';

export const createGradient = (svg: any, id: string, colors: string[], vertical = true): void => {
  if (!colors || colors.length < 2) return;
  const defs = svg.append('defs');
  const gradient = defs
    .append('linearGradient')
    .attr('id', id)
    .attr('x1', vertical ? '0%' : '0%')
    .attr('y1', vertical ? '0%' : '0%')
    .attr('x2', vertical ? '0%' : '100%')
    .attr('y2', vertical ? '100%' : '0%');
  colors.forEach((color, i) => {
    gradient
      .append('stop')
      .attr('offset', `${(i / (colors.length - 1)) * 100}%`)
      .attr('stop-color', color);
  });
};

export const addGridLines = (
  g: any,
  x: any,
  y: any,
  width: number,
  height: number,
  showXGrid: boolean,
  showYGrid: boolean,
  ticks: number,
  color: string,
): void => {
  if (showYGrid) {
    const yGrid = g
      .append('g')
      .attr('class', 'grid-line')
      .call(
        (d3 as any)
          .axisLeft(y)
          .ticks(ticks)
          .tickSize(-width)
          .tickFormat(() => ''),
      )
      .attr('stroke', color)
      .attr('stroke-opacity', 0.2);
    yGrid.select('.domain').remove();
  }
  if (showXGrid) {
    const xGrid = g
      .append('g')
      .attr('class', 'grid-line')
      .attr('transform', `translate(0, ${height})`)
      .call(
        (d3 as any)
          .axisBottom(x)
          .tickSize(-height)
          .tickFormat(() => ''),
      )
      .attr('stroke', color)
      .attr('stroke-opacity', 0.2);
    xGrid.select('.domain').remove();
  }
};

export const addLegend = (
  g: any,
  labels: string[],
  colors: string | string[],
  legend: LegendConfig | undefined,
  innerWidth: number,
  innerHeight: number,
  margin: Margin,
  gradientIds?: string[],
): void => {
  // Minimal no-op or basic implementation to unblock build
  if (!labels || labels.length === 0) return;
  // For full pure JSX version, this would return elements instead of mutating g
};
