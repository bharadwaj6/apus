import React from 'react';
import type { TooltipState } from '../hooks/useTooltip';
import type { TooltipConfig } from '../types/tooltip';

interface TooltipProps {
  state: TooltipState;
  config?: TooltipConfig;
}

export function Tooltip({ state, config }: TooltipProps) {
  if (!state.visible) return null;
  return (
    <div
      style={{
        position: 'fixed',
        left: state.x + 12,
        top: state.y - 8,
        pointerEvents: 'none',
        zIndex: 9999,
        backgroundColor: config?.backgroundColor ?? 'rgba(0,0,0,0.8)',
        color: config?.textColor ?? '#fff',
        padding: config?.padding ?? '6px 10px',
        borderRadius: config?.borderRadius ?? 4,
        fontSize: config?.fontSize ?? 12,
        whiteSpace: 'nowrap',
      }}
      dangerouslySetInnerHTML={{ __html: state.content }}
    />
  );
}
