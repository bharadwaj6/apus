/**
 * @file chartUtils.ts
 * @description Legacy utility functions (temporarily using shim during final upstream merge cleanup)
 */
// Legacy chartUtils - d3-shim dependency removed as part of full migration.
// Bar/Line/Range now use pure math + JSX. This file can be cleaned further if needed.

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
  // Legacy grid logic removed as part of full d3 elimination.
  // Modern charts (including the migrated Line/Range) render their own grid via JSX.
  if (showYGrid || showXGrid) {
    // No-op for now
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
