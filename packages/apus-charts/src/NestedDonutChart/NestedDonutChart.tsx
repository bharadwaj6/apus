import React from 'react';
import { NestedDonutChartProps } from './types';
import { NestedDonutChartRenderer } from './NestedDonutChartRenderer';
import { useTooltip } from '../hooks/useTooltip';
import { Tooltip } from '../components/Tooltip';

// The main NestedDonutChart component that acts as a wrapper and passes props to the renderer.
// Tooltip is provided via useTooltip + Tooltip; renderer is pure computed JSX (pieLayout + arcPath).
export const NestedDonutChart: React.FC<NestedDonutChartProps> = (props) => {
  const { tooltipState, showTooltip, hideTooltip } = useTooltip(props.tooltip);
  return (
    <>
      <NestedDonutChartRenderer
        {...props}
        onShowTooltip={showTooltip}
        onHideTooltip={hideTooltip}
      />
      <Tooltip state={tooltipState} config={props.tooltip} />
    </>
  );
};
