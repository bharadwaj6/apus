import type { CSSProperties } from 'react';

export type LegendPosition = 'top' | 'right' | 'bottom' | 'left';

export interface LegendConfig {
  /** Show or hide the legend */
  show?: boolean;
  /** Position of the legend relative to the chart */
  position?: LegendPosition;
  /** Title text displayed above the legend */
  title?: string;
  /** Color of the title text */
  titleColor?: string;
  /** Font size of the title */
  titleFontSize?: string;
  /** Font family of the title */
  titleFontFamily?: string;
  /** Color of legend item labels */
  itemColor?: string;
  /** Font size of legend item labels */
  itemFontSize?: string;
  /** Font family of legend items */
  itemFontFamily?: string;
  /** Size of color swatches in pixels */
  swatchSize?: number;
  /** Border color of swatches */
  swatchBorderColor?: string;
  /** Border width of swatches */
  swatchBorderWidth?: number;
  /** Gap between legend items */
  gap?: number;
  /** Padding around the legend */
  padding?: string | number;
  /** Enable clickable legend items (toggle series visibility) */
  clickable?: boolean;
  /** Callback when a legend item is clicked */
  onItemClick?: (itemName: string | null) => void;
}
