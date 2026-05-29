/**
 * @file DonutChart.tsx
 * @description Main DonutChart component
 */
import React, { useRef, useState } from 'react';
import { DonutChartProps } from './types';
import DonutChartRenderer from './DonutChartRenderer';
import { useChartDimensions } from '../hooks/useChartDimensions';
import { useChartTheme } from '../theme/ChartThemeContext';
import type { TooltipConfig, LegendConfig } from '../types';
import { useTooltip } from '../hooks/useTooltip';
import { Tooltip } from '../components/Tooltip';

/**
 * DonutChart component for rendering donut/pie charts
 */
export const DonutChart: React.FC<DonutChartProps> = (props) => {
  const theme = useChartTheme();

  const {
    data,
    width = 320,
    height = 320,
    innerRadiusRatio = 0.7,
    colors: colorsProp,
    margin = props.margin || theme.margin,
    responsive = true,
    showTooltip = true,
    tooltip,
    showLegend = true,
    legend,
    centerLabel,
    centerValue,
    centerIcon,
    extraCenterInfo,
    ariaLabel = 'Donut chart',
    onSliceClick,
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Merge tooltip config with theme
  const tooltipConfig: TooltipConfig = {
    ...theme.tooltip,
    ...tooltip,
    show: showTooltip,
  };

  // Merge legend config with theme
  const legendConfig: LegendConfig = {
    ...theme.legend,
    ...legend,
    show: showLegend,
  };

  // New React tooltip (replaces old d3 version)
  const { tooltipState, showTooltip, hideTooltip } = useTooltip(tooltipConfig);

  const dimensions = useChartDimensions(containerRef, width, height, responsive);

  // Calculate radii
  const outerRadius = Math.min(dimensions.width, dimensions.height) / 2 - 8;
  const innerRadius = outerRadius * innerRadiusRatio;

  // Prepare color scale
  const colorScale = (label: string, i: number) => {
    if (colorsProp && colorsProp.length > 0) return colorsProp[i % colorsProp.length];
    return `hsl(${(i * 360) / data.length}, 70%, 50%)`;
  };

  // Slice visibility state
  const [visibleLabels, setVisibleLabels] = useState<string[]>(data.map((d) => d.label));
  const toggleLabel = (label: string) => {
    setVisibleLabels((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label],
    );
  };

  // Filter data for visible slices
  const filteredData = data.filter((d) => visibleLabels.includes(d.label));
  const total = filteredData.reduce((sum, d) => sum + d.value, 0);

  // Legend rendering
  const isLegendVertical = legendConfig.position === 'left' || legendConfig.position === 'right';
  const isLegendFirst = legendConfig.position === 'top' || legendConfig.position === 'left';

  const legendElement = legendConfig.show ? (
    <div
      className={`donut-legend donut-legend-${legendConfig.position || 'bottom'}`}
      style={{
        display: 'flex',
        flexDirection: isLegendVertical ? 'column' : 'row',
        justifyContent: isLegendVertical ? 'flex-start' : 'center',
        alignItems: isLegendVertical ? 'flex-start' : 'center',
        flexWrap: 'wrap',
        marginBottom: legendConfig.position === 'top' ? 16 : 0,
        marginRight: legendConfig.position === 'left' ? 24 : 0,
        marginTop: legendConfig.position === 'bottom' ? 16 : 0,
        marginLeft: legendConfig.position === 'right' ? 24 : 0,
        paddingLeft: isLegendVertical ? 8 : 0,
        paddingTop: !isLegendVertical ? 8 : 0,
        gap: isLegendVertical ? 8 : 0,
      }}
    >
      {data.map((d, i) => {
        const isVisible = visibleLabels.includes(d.label);
        const percent = isVisible && total > 0 ? ((d.value / total) * 100).toFixed(1) : '0.0';
        return (
          <div
            key={d.label}
            className="donut-legend-item"
            style={{
              display: 'flex',
              alignItems: 'center',
              marginRight: !isLegendVertical ? 32 : 0,
              marginBottom: isLegendVertical ? 8 : 0,
              cursor: 'pointer',
              fontSize: legendConfig.itemFontSize || '12px',
              color: legendConfig.itemColor || '#333',
              userSelect: 'none',
              minWidth: 120,
              opacity: isVisible ? 1 : 0.4,
              fontWeight: 500,
              transition: 'opacity 0.2s',
              padding: '2px 0',
            }}
            onClick={() => toggleLabel(d.label)}
          >
            <span
              style={{
                display: 'inline-block',
                width: 16,
                height: 16,
                background: d.color || colorScale(d.label, i),
                marginRight: 10,
                borderRadius: '50%',
                border: '2px solid #fff',
                boxShadow: '0 0 0 1px #ccc',
                opacity: isVisible ? 1 : 0.4,
                transition: 'opacity 0.2s',
              }}
            />
            <span style={{ minWidth: 80, textAlign: 'left' }}>{d.label}</span>
            <span style={{ marginLeft: 8, color: '#888', fontWeight: 400, minWidth: 24, textAlign: 'right' }}>
              {d.value}
            </span>
            {isVisible && (
              <span style={{ marginLeft: 8, color: '#aaa', fontWeight: 400, minWidth: 40, textAlign: 'right' }}>
                {percent}%
              </span>
            )}
          </div>
        );
      })}
    </div>
  ) : null;

  return (
    <div
      ref={containerRef}
      className={`donut-chart-flex-container legend-${legendConfig.position || 'bottom'}`}
      style={{
        width: '100%',
        maxWidth: width,
        margin: '0 auto',
        position: 'relative',
        display: 'flex',
        flexDirection: legendConfig.position === 'top' || legendConfig.position === 'bottom' ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: isLegendVertical ? 32 : 0,
      }}
    >
      {/* Legend (top/left) */}
      {legendConfig.show && isLegendFirst && legendElement}

      {/* SVG Donut Chart */}
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        aria-label={ariaLabel}
        style={{ display: 'block', background: 'none', flex: 'none' }}
      >
        <DonutChartRenderer
          data={filteredData.map((d, i) => ({ ...d, color: d.color || colorScale(d.label, i) }))}
          width={dimensions.width}
          height={dimensions.height}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          showTooltip={showTooltip}
          tooltip={tooltipConfig}
          legend={legendConfig}
          centerLabel={centerLabel}
          centerValue={total}
          centerIcon={centerIcon}
          extraCenterInfo={extraCenterInfo}
          onSliceClick={(data) => {
            if (onSliceClick) onSliceClick(data);
          }}
          visibleLabels={visibleLabels}
          onShowTooltip={showTooltip}
          onHideTooltip={hideTooltip}
        />
      </svg>

      {/* Legend (bottom/right) */}
      {legendConfig.show && !isLegendFirst && legendElement}

      <Tooltip state={tooltipState} config={tooltipConfig} />
    </div>
  );
};
