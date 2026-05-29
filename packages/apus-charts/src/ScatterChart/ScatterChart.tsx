import React, { FC, useState } from 'react';
import { ScatterChartProps, ScatterHoveredData, ScatterDataPoint } from './types';
import { ScatterChartRenderer } from './ScatterChartRenderer';
import { useTooltip } from '../hooks/useTooltip';
import { Tooltip } from '../components/Tooltip';

/**
 * ScatterChart component for visualizing data points in a two-dimensional space.
 *
 * @component
 * @example
 * ```jsx
 * import { BasicScatterChart } from './ScatterChart.examples';
 *
 * <BasicScatterChart />
 * ```
 *
 * @example
 * ```jsx
 * import { ScatterChartWithFeatures } from './ScatterChart.examples';
 *
 * <ScatterChartWithFeatures />
 * ```
 *
 * @example
 * ```jsx
 * import { ScatterChartWithTrendLine } from './ScatterChart.examples';
 *
 * <ScatterChartWithTrendLine />
 * ```
 */
export const ScatterChart: FC<ScatterChartProps> = ({
  data,
  series,
  width,
  height,
  colors,
  style,
  className,
  xAxis = {},
  yAxis = {},
  grid = {},
  showLegend = true,
  legend = { position: 'right', clickable: true },
  onLegendItemClick,
  showTooltip = true,
  tooltipFormat,
  tooltip = {
    backgroundColor: 'rgba(50, 50, 50, 0.85)',
    textColor: '#FFFFFF',
    padding: '8px 12px',
    borderRadius: '4px',
    offsetX: 10,
    offsetY: 10,
  },
  trendLine,
  pointSize,
  bubbleChart,
  errorBars,
  visibleSeries,
  onSeriesToggle,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null);
  const [internalVisibleSeries, setInternalVisibleSeries] = useState<Record<string, boolean>>({});
  const visibleSeriesState = visibleSeries || internalVisibleSeries;

  // New useTooltip (no ref, config only) + Tooltip component for pure JSX pattern
  const tooltipConfig = {
    backgroundColor: tooltip.backgroundColor,
    textColor: tooltip.textColor,
    padding: tooltip.padding,
    borderRadius: tooltip.borderRadius,
    fontSize: '12px',
  };
  const { tooltipState, showTooltip: showTooltipFn, hideTooltip } = useTooltip(tooltipConfig);

  // Initialize visible series when component mounts or series changes
  React.useEffect(() => {
    if (series && !visibleSeries) {
      const initialVisibility: Record<string, boolean> = {};
      series.forEach((s) => {
        initialVisibility[s.id] = s.visible !== false; // Default to true if not specified
      });
      setInternalVisibleSeries(initialVisibility);
    }
  }, [series, visibleSeries]);

  const handleLegendItemClick = (category: string | null, seriesId?: string) => {
    setSelectedCategory(category);
    if (seriesId) {
      setSelectedSeries(selectedSeries === seriesId ? null : seriesId);
    }
    if (legend.onItemClick) {
      legend.onItemClick(category, seriesId);
    }
  };

  const handleSeriesToggle = (seriesId: string, visible: boolean) => {
    if (onSeriesToggle) {
      onSeriesToggle(seriesId, visible);
    } else {
      setInternalVisibleSeries((prev) => ({
        ...prev,
        [seriesId]: visible,
      }));
    }
  };

  // No longer need old point hover/leave wrappers; renderer uses onShowTooltip / onHideTooltip directly

  return (
    <div style={{ ...style, position: 'relative' }} className={className}>
      <ScatterChartRenderer
        data={data}
        series={series}
        width={width}
        height={height}
        colors={colors}
        xAxis={xAxis}
        yAxis={yAxis}
        grid={grid}
        showLegend={showLegend}
        legend={legend}
        tooltip={tooltip}
        selectedCategory={selectedCategory}
        selectedSeries={selectedSeries}
        onShowTooltip={showTooltipFn}
        onHideTooltip={hideTooltip}
        onSeriesToggle={handleSeriesToggle}
        trendLine={trendLine}
        pointSize={pointSize}
        bubbleChart={bubbleChart}
        errorBars={errorBars}
        visibleSeries={visibleSeriesState}
        onLegendItemClick={handleLegendItemClick}
        tooltipFormat={tooltipFormat}
      />
      <Tooltip state={tooltipState} config={tooltip} />
    </div>
  );
};
