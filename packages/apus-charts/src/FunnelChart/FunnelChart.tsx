import React, { useState } from 'react';
import { FunnelChartProps } from './types';
import FunnelChartRenderer from './FunnelChartRenderer';
import ChartLegend from './common/ChartLegend';
import { ChartLegendItem } from './common/types';
import { useChartTheme } from '../theme/ChartThemeContext';
import type { TooltipConfig, LegendConfig } from '../types';
import { useTooltip } from '../hooks/useTooltip';
import { Tooltip } from '../components/Tooltip';

const FunnelChart: React.FC<FunnelChartProps> = (props) => {
  const theme = useChartTheme();

  const {
    data,
    width = 600,
    height = 400,
    margin = props.margin || theme.margin,
    showValues = true,
    valueFormat = (value: number) => value.toString(),
    onSliceClick,
    className,
    style,
    tooltip,
    tooltipFormat,
    showLegend = false,
    legend,
    clickableLegend = false,
    isDarkMode,
  } = props;

  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const handleLegendItemClick = (item: ChartLegendItem | null) => {
    setSelectedItem(item ? item.id : null);
    if (onSliceClick) onSliceClick(item ? data.find((d) => d.label === item.id) || null : null);
  };

  const filteredData = selectedItem ? data.filter((d) => d.label === selectedItem) : data;

  const legendItems: ChartLegendItem[] = data.map((d, i) => ({
    id: d.label,
    name: d.label,
    color: d.color || `hsl(${i * 360 / data.length}, 70%, 50%)`,
  }));

  const legendConfig: LegendConfig = {
    ...theme.legend,
    ...legend,
    show: showLegend,
    clickable: clickableLegend,
  };

  const tooltipConfig: TooltipConfig = {
    ...theme.tooltip,
    ...tooltip,
  };

  // Switch to new useTooltip + forward callbacks (replaces old internal tooltip in renderer)
  const { tooltipState, showTooltip, hideTooltip } = useTooltip(tooltipConfig);

  return (
    <div className={className} style={{ width: '100%', height: '100%', ...style }}>
      <FunnelChartRenderer
        data={filteredData}
        width={width}
        height={height}
        margin={margin}
        showValues={showValues}
        valueFormat={valueFormat}
        onSliceClick={onSliceClick}
        isDarkMode={isDarkMode}
        tooltip={tooltipConfig}
        tooltipFormat={tooltipFormat}
        showLegend={showLegend}
        legend={legendConfig}
        onShowTooltip={showTooltip}
        onHideTooltip={hideTooltip}
      />
      {showLegend && (
        <ChartLegend
          items={legendItems}
          selectedId={selectedItem}
          onItemClick={handleLegendItemClick}
          theme={isDarkMode ? 'dark' : 'light'}
        />
      )}
      <Tooltip state={tooltipState} config={tooltipConfig} />
    </div>
  );
};

export default FunnelChart;
