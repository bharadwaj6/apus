import { useState, useCallback } from 'react';
import type { TooltipConfig } from '../types/tooltip';

export interface TooltipState {
  visible: boolean;
  content: string;
  x: number;
  y: number;
}

export interface TooltipHookReturn {
  tooltipState: TooltipState;
  showTooltip: (content: string, event: MouseEvent | React.MouseEvent) => void;
  hideTooltip: () => void;
}

export function useTooltip(_config?: TooltipConfig): TooltipHookReturn {
  const [tooltipState, setTooltipState] = useState<TooltipState>({
    visible: false,
    content: '',
    x: 0,
    y: 0,
  });

  const showTooltip = useCallback((content: string, event: MouseEvent | React.MouseEvent) => {
    setTooltipState({ visible: true, content, x: event.clientX, y: event.clientY });
  }, []);

  const hideTooltip = useCallback(() => {
    setTooltipState((s) => ({ ...s, visible: false }));
  }, []);

  return { tooltipState, showTooltip, hideTooltip };
}
