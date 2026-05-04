import React, { useState, useRef, useEffect } from 'react';
import { RadarChartProps, HoveredDataInfo } from './types';
import { RadarChartRenderer } from './RadarChartRenderer';
import { useTooltip } from '../hooks/useTooltip';
import { useChartDimensions, Dimensions } from '../hooks/useChartDimensions';

const RadarChart: React.FC<RadarChartProps> = ({
  data,
  size = 300,
  axesLabels,
  maxValue,
  levels = 5,
  className = '',
  showGrid = true,
  showAxesLabels = true,
  showTooltips = true,
  enableSeriesShadow = true,
  seriesShadowColor = 'rgba(0,0,0,0.12)',
  seriesShadowBlur = 4,
  seriesShadowOffsetX = 0,
  seriesShadowOffsetY = 0,
  enableSeriesGlow = false,
  seriesGlowColor, // Defaults to series colors in renderer if undefined
  seriesGlowBlur = 5,
  seriesGlowOffsetX = 0,
  seriesGlowOffsetY = 0,
  seriesGlowOpacity = 0.75,
  tooltip = {
    backgroundColor: 'rgba(50, 50, 50, 0.85)', // Default to dark background
    textColor: '#FFFFFF', // Default to light text
    padding: '8px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    offsetX: 10,
    offsetY: -15,
  },
  tooltipFormat,
  showHoverPoints,
  hoverPointRadius,
  hoverPointFill,
  hoverPointStroke,
  hoverPointStrokeWidth,
  gridStrokeColor = '#CDCDCD',
  gridStrokeWidth = 0.5,
  gridLineStyle = 'solid',
  axisLabelColor = '#333333',
  axisLabelFontSize = '10px',
  axisLabelFontFamily = 'sans-serif', // Added default
  axisLabelOffset = 10,
  axisLineColor = '#B0B0B0',
  axisLineWidth = 1,
  showAxisLines = true,
  seriesFillOpacity = 0.3,
  seriesStrokeWidth = 2,
  seriesHoverStrokeWidth = 2.5, // Added default
  hoverTargetRadius = 8, // Added default
  responsive = true, // Added prop to control responsiveness
  // Legend Props
  showLegend = false,
  legend = {
    position: 'bottom',
    titleFontSize: '14px',
    titleFontFamily: 'sans-serif',
    itemFontSize: '12px',
    itemFontFamily: 'sans-serif',
    swatchSize: 12,
    swatchBorderColor: 'transparent',
    swatchBorderWidth: 0,
    gap: 8, // Gap between legend items (in px)
    padding: '10px',
    clickable: false,
  },
  selectedSeriesFillOpacity = 0.7,
  selectedSeriesStrokeWidth = 3,
  deselectedSeriesFillOpacity = 0.15,
  deselectedSeriesStrokeWidth = 1,
  onLegendItemClick,
}) => {
  const [hoveredData, _setHoveredData] = useState<HoveredDataInfo | null>(null);
  const [selectedSeriesName, setSelectedSeriesName] = useState<string | null>(null);
  const [legendDimensions, setLegendDimensions] = useState({ width: 0, height: 0 });

  const handleSetHoveredData = React.useCallback(
    (data: HoveredDataInfo | null) => {
      _setHoveredData(data);
    },
    [_setHoveredData],
  );
  const filterId = `radar-shadow-${React.useId()}`;
  const glowFilterId = `radar-glow-${React.useId()}`;
  const chartRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);

  const chartDimensions: Dimensions = useChartDimensions(chartRef, size, size, responsive);
  let effectiveSize: number;
  if (responsive && chartDimensions.width > 0 && chartDimensions.height > 0) {
    effectiveSize = Math.min(chartDimensions.width, chartDimensions.height);
  } else {
    effectiveSize = size;
  }

  useEffect(() => {
    if (showLegend && legendRef.current) {
      setLegendDimensions({
        width: legendRef.current.offsetWidth,
        height: legendRef.current.offsetHeight,
      });
    } else if (!showLegend) {
      setLegendDimensions({ width: 0, height: 0 });
    }
  }, [showLegend, legend.position, data]);

  let adjustedChartWidth = effectiveSize;
  let adjustedChartHeight = effectiveSize;

  if (showLegend) {
    if (legend.position === 'top' || legend.position === 'bottom') {
      adjustedChartHeight = Math.max(0, effectiveSize - legendDimensions.height);
    } else if (legend.position === 'left' || legend.position === 'right') {
      adjustedChartWidth = Math.max(0, effectiveSize - legendDimensions.width);
    }
  }

  const tooltip = useTooltip(tooltipRef, {
    backgroundColor: tooltipFormat ? 'transparent' : tooltip.backgroundColor,
    textColor: tooltipFormat ? 'transparent' : tooltip.textColor,
    padding: tooltipFormat ? '0px' : tooltip.padding,
    borderRadius: tooltip.borderRadius,
    fontSize: tooltip.fontSize,
  });

  useEffect(() => {
    tooltip.applyTooltipStyles();
  }, [tooltip]);

  useEffect(() => {
    if (hoveredData && tooltipRef.current && chartRef.current) {
      const content = tooltipFormat
        ? tooltipFormat(hoveredData)
        : `<strong>${hoveredData.seriesName}</strong><br/>${hoveredData.axisLabel}: ${hoveredData.value}`;
      tooltip.showTooltip(
        content,
        hoveredData.tooltipX,
        hoveredData.tooltipY,
        tooltip.offsetX,
        tooltip.offsetY,
      );
    } else if (tooltipRef.current) {
      tooltip.hideTooltip();
    }
  }, [hoveredData, tooltip, tooltip.offsetX, tooltip.offsetY, chartRef, tooltipFormat]);

  if (!data || data.length === 0 || !axesLabels || axesLabels.length === 0) {
    return <p>RadarChart: Insufficient data or axes labels provided.</p>;
  }

  const numAxes = axesLabels.length;
  const radius = (Math.min(adjustedChartWidth, adjustedChartHeight) / 2) * 0.8;
  const calculatedMaxValue =
    maxValue || Math.max(...data.flatMap((series) => series.dataPoints.map((dp) => dp.value)));

  const legendStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    padding: typeof legend.padding === 'number' ? `${legend.padding}px` : legend.padding,
    fontFamily: legend.itemFontFamily,
    fontSize: legend.itemFontSize,
    colors: legend.itemColor || (tooltip.textColor === '#FFFFFF' ? '#333' : '#FFF'), // Basic auto-colors
  };

  const getFlexDirection = () => {
    switch (legend.position) {
      case 'top':
        return 'column-reverse';
      case 'bottom':
        return 'column';
      case 'left':
        return 'row-reverse';
      case 'right':
        return 'row';
      default:
        return 'column';
    }
  };

  const legendAreaStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: legend.position === 'top' || legend.position === 'bottom' ? 'column' : 'row',
    alignItems: 'center',
    gap: `${legend.gap}px`,
  };

  if (legend.position === 'right' || legend.position === 'left') {
    legendAreaStyle.flexDirection = 'column';
    legendAreaStyle.alignItems = legend.position === 'left' ? 'flex-end' : 'flex-start';
    legendAreaStyle.justifyContent = 'center';
    legendAreaStyle.height = '100%';
    legendAreaStyle.padding = `0 ${typeof legend.padding === 'number' ? `${legend.padding}px` : legend.padding}`;
  } else {
    legendAreaStyle.width = '100%';
    legendAreaStyle.justifyContent = 'center';
    legendAreaStyle.padding = `${typeof legend.padding === 'number' ? `${legend.padding}px` : legend.padding} 0`;
  }

  const renderLegend = () => (
    <div
      style={{
        ...legendAreaStyle,
        marginTop: legend.position === 'top' ? 'auto' : 0,
        marginBottom: legend.position === 'bottom' ? 'auto' : 0,
        marginLeft: legend.position === 'left' ? 'auto' : 0,
        marginRight: legend.position === 'right' ? 'auto' : 0,
      }}
    >
      {legend.title && (
        <h4
          style={{
            colors: legend.titleColor || (tooltip.textColor === '#FFFFFF' ? '#333' : '#FFF'),
            fontSize: legend.titleFontSize,
            fontFamily: legend.titleFontFamily,
            marginBottom: '8px',
          }}
        >
          {legend.title}
        </h4>
      )}
      <div
        style={{
          display: 'flex',
          flexDirection: legend.position === 'top' || legend.position === 'bottom' ? 'row' : 'column',
          flexWrap: 'wrap', // Allow wrapping for horizontal legends
          justifyContent: 'center',
          gap: legend.gap,
        }}
      >
        {data.map((series, index) => (
          <div
            key={series.name}
            onClick={() => {
              if (!legend.clickable) return;
              const newSelectedName = selectedSeriesName === series.name ? null : series.name;
              setSelectedSeriesName(newSelectedName);
              if (legend.onItemClick) {
                legend.onItemClick(newSelectedName);
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              marginRight:
                legend.position === 'top' || legend.position === 'bottom' ? `${legend.gap}px` : '0',
              marginBottom:
                legend.position === 'left' || legend.position === 'right' ? `${legend.gap}px` : '0',
              cursor: legend.clickable ? 'pointer' : 'default',
              padding: '2px 4px', // Add some padding for better click target and visual feedback
              borderRadius: '3px',
              backgroundColor:
                legend.clickable && selectedSeriesName === series.name
                  ? tooltip.textColor === '#FFFFFF'
                    ? 'rgba(255,255,255,0.2)'
                    : 'rgba(0,0,0,0.07)'
                  : 'transparent',
              transition: 'background-colors 0.15s ease-in-out',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: `${legend.swatchSize}px`,
                height: `${legend.swatchSize}px`,
                borderRadius: '50%',
                backgroundColor: series.colors || `hsl(${(index * 360) / data.length}, 70%, 50%)`,
                border: `${legend.swatchBorderWidth}px solid ${legend.swatchBorderColor}`,
                marginRight: '8px',
              }}
            ></span>
            <span style={legendStyle}>{series.name}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const chartAreaContainerStyle: React.CSSProperties = {
    position: 'relative',
    width: adjustedChartWidth,
    height: adjustedChartHeight,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };

  return (
    <div
      ref={chartRef}
      data-testid="radar-chart-container"
      className={`relative ${className}`}
      style={{
        width: responsive ? '100%' : size,
        height: responsive ? '100%' : size,
        display: 'flex',
        flexDirection: getFlexDirection(),
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {(legend.position === 'top' || legend.position === 'left') && showLegend && (
        <div ref={legendRef}>{renderLegend()}</div>
      )}
      <div style={chartAreaContainerStyle}>
        <svg
          ref={svgRef}
          width={adjustedChartWidth}
          height={adjustedChartHeight}
          className={`radar-chart-svg ${className}`}
          role="graphics-document"
          aria-label="radar chart"
        >
          <defs>
            {enableSeriesShadow && (
              <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow
                  dx={seriesShadowOffsetX}
                  dy={seriesShadowOffsetY}
                  stdDeviation={seriesShadowBlur}
                  floodColor={seriesShadowColor}
                  floodOpacity="1"
                />
              </filter>
            )}
            {enableSeriesGlow && (
              <filter id={glowFilterId} x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow
                  dx={seriesGlowOffsetX}
                  dy={seriesGlowOffsetY}
                  stdDeviation={seriesGlowBlur}
                  floodColor={seriesGlowColor || 'currentColor'} // Use seriesGlowColor, fallback to currentColor (though series colors is better handled in renderer)
                  floodOpacity={seriesGlowOpacity}
                  result="coloredGlowBase"
                />
                <feMerge>
                  <feMergeNode in="coloredGlowBase" />
                  <feMergeNode in="SourceGraphic" />{' '}
                </feMerge>
              </filter>
            )}
          </defs>
          <g transform={`translate(${adjustedChartWidth / 2}, ${adjustedChartHeight / 2})`}>
            <RadarChartRenderer
              chartRef={chartRef}
              data={data}
              radius={radius}
              levels={levels}
              axesLabels={axesLabels}
              calculatedMaxValue={calculatedMaxValue}
              angleSlice={(Math.PI * 2) / numAxes}
              showGrid={showGrid}
              showAxesLabels={showAxesLabels}
              gridStrokeColor={gridStrokeColor}
              gridStrokeWidth={gridStrokeWidth}
              gridLineStyle={gridLineStyle}
              axisLineColor={axisLineColor}
              axisLineWidth={axisLineWidth}
              axisLabelFontFamily={axisLabelFontFamily}
              axisLabelFontSize={axisLabelFontSize}
              axisLabelColor={axisLabelColor}
              axisLabelOffset={axisLabelOffset}
              seriesFillOpacity={seriesFillOpacity}
              seriesStrokeWidth={seriesStrokeWidth}
              seriesHoverStrokeWidth={seriesHoverStrokeWidth}
              enableSeriesShadow={enableSeriesShadow}
              filterId={filterId}
              hoverTargetRadius={hoverTargetRadius}
              enableSeriesGlow={enableSeriesGlow}
              seriesGlowColor={seriesGlowColor}
              seriesGlowBlur={seriesGlowBlur}
              seriesGlowOffsetX={seriesGlowOffsetX}
              seriesGlowOffsetY={seriesGlowOffsetY}
              seriesGlowOpacity={seriesGlowOpacity}
              glowFilterId={glowFilterId}
              showAxisLines={showAxisLines}
              hoveredData={hoveredData}
              setHoveredData={handleSetHoveredData}
              showHoverPoints={showHoverPoints}
              hoverPointRadius={hoverPointRadius}
              hoverPointFill={hoverPointFill}
              hoverPointStroke={hoverPointStroke}
              hoverPointStrokeWidth={hoverPointStrokeWidth}
              selectedSeriesName={selectedSeriesName}
              selectedSeriesFillOpacity={selectedSeriesFillOpacity}
              selectedSeriesStrokeWidth={selectedSeriesStrokeWidth}
              deselectedSeriesFillOpacity={deselectedSeriesFillOpacity}
              deselectedSeriesStrokeWidth={deselectedSeriesStrokeWidth}
            />
          </g>
        </svg>
        {showTooltips && (
          <div
            ref={tooltipRef}
            className="chart-tooltip"
            style={{
              position: 'absolute',
              opacity: 0,
              pointerEvents: 'none',
              zIndex: 1000,
              transition: 'opacity 0.2s ease-in-out, transform 0.2s ease-in-out',
            }}
          />
        )}
      </div>
      {(legend.position === 'bottom' || legend.position === 'right') && showLegend && (
        <div ref={legendRef}>{renderLegend()}</div>
      )}
    </div>
  );
};

export default RadarChart;
