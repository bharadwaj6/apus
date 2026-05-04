export interface TooltipConfig {
  /** Show or hide tooltips */
  show?: boolean;
  /** Background color of the tooltip */
  backgroundColor?: string;
  /** Text color of the tooltip */
  textColor?: string;
  /** Padding inside the tooltip */
  padding?: string;
  /** Border radius of the tooltip */
  borderRadius?: string;
  /** Font size of the tooltip text */
  fontSize?: string;
  /** X offset from cursor position */
  offsetX?: number;
  /** Y offset from cursor position */
  offsetY?: number;
  /** Custom function to format tooltip content */
  format?: (data: unknown) => string;
}
