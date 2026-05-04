import type { CSSProperties } from 'react';

export type Margin = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export interface BaseChartProps {
  /** Width of the chart in pixels */
  width?: number;
  /** Height of the chart in pixels */
  height?: number;
  /** Margin around the chart visualization area */
  margin?: Margin;
  /** Enable responsive sizing (chart fills container width) */
  responsive?: boolean;
  /** Additional CSS class name for the chart container */
  className?: string;
  /** Inline styles for the chart container */
  style?: CSSProperties;
  /** Accessibility label for the chart */
  ariaLabel?: string;
}

export const DEFAULT_MARGIN: Margin = {
  top: 20,
  right: 30,
  bottom: 30,
  left: 40,
};
