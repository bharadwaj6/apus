import React, { useState, FC } from 'react';
import { RendererProps, ScatterDataPoint } from './types';
import {
  extentOf,
  linearScale,
  timeScale,
  sqrtScale,
  logScale,
  ordinalScale,
  CATEGORY_10,
  SET_2,
  TABLEAU_10,
} from '../math';
import { linearRegression } from '../math/regression';

const DEFAULT_COLORS = CATEGORY_10;

// Helper to get numeric x value (timestamp for dates)
const getXNumeric = (d: ScatterDataPoint): number =>
  d.x instanceof Date ? d.x.getTime() : (d.x as number);

export const ScatterChartRenderer: FC<RendererProps> = ({
  data,
  series,
  width,
  height,
  colors = DEFAULT_COLORS,
  xAxis = {},
  yAxis = {},
  grid = { horizontal: false, vertical: false },
  showLegend = true,
  legend = {},
  trendLine,
  pointSize = 6,
  bubbleChart = {},
  errorBars = {},
  selectedCategory,
  selectedSeries,
  visibleSeries = {},
  onShowTooltip,
  onHideTooltip,
  onLegendItemClick,
  onSeriesToggle,
  onPointClick,
  tooltipFormat,
}) => {
  // Local state for hover highlight (replaces d3.select mutation for stroke/radius)
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  // Process data from either single dataset or multiple series (pure computation)
  const allData: Array<ScatterDataPoint & { seriesId?: string; seriesName?: string }> = [];
  const seriesList: Array<{ id: string; name: string; color?: string }> = [];

  if (series && series.length > 0) {
    // Multiple series mode
    series.forEach((s) => {
      const isVisible = s.visible !== false && (!visibleSeries[s.id] || visibleSeries[s.id]);
      if (isVisible) {
        s.data.forEach((d) => {
          allData.push({
            ...d,
            seriesId: s.id,
            seriesName: s.name || s.id,
          });
        });
        seriesList.push({
          id: s.id,
          name: s.name || s.id,
          color: typeof s.colors === 'string' ? s.colors : undefined,
        });
      }
    });
  } else if (data && data.length > 0) {
    // Single dataset mode
    allData.push(...data);
  }

  if (allData.length === 0 || width === 0 || height === 0) {
    return <svg width={width} height={height} />;
  }

  // Margins (pure calc, legend may expand)
  const margin = { top: 40, right: 40, bottom: 50, left: 60 };

  // Get unique categories across all series
  const categories = [...new Set(allData.map((d) => d.category))];

  // Color handling using math ordinal + constants (replaces d3.scaleOrdinal + schemes)
  let colorValues: string[] = Array.isArray(colors) ? colors : CATEGORY_10;
  if (typeof colors === 'object' && colors !== null && !Array.isArray(colors)) {
    colorValues = Object.values(colors as Record<string, string>);
  }
  const categoryColorScale = ordinalScale(
    categories,
    colorValues.length ? colorValues : CATEGORY_10,
  );

  // series color scale fallback
  const seriesColorScale = ordinalScale(
    seriesList.map((s) => s.id),
    CATEGORY_10,
  );

  // Helper to get point color (pure)
  const getPointColor = (
    d: ScatterDataPoint & { seriesId?: string; seriesName?: string },
  ): string => {
    if (series && series.length > 0 && d.seriesId) {
      const seriesConfig = series.find((s) => s.id === d.seriesId);
      if (seriesConfig && typeof seriesConfig.colors === 'string') {
        return seriesConfig.colors;
      }
      if (seriesConfig && Array.isArray(seriesConfig.colors) && seriesConfig.colors.length) {
        return seriesConfig.colors[0];
      }
      return seriesColorScale(d.seriesId);
    }
    return d.category ? categoryColorScale(d.category) : CATEGORY_10[0];
  };

  // Adjust margins for legend (pure)
  if (showLegend) {
    const legendPadding = 10;
    const legendItemHeight = 20;
    const legendWidth = 120;
    if (legend.position === 'right') margin.right += legendWidth;
    else if (legend.position === 'left') margin.left += legendWidth;
    else if (legend.position === 'top')
      margin.top += Math.max(1, categories.length) * legendItemHeight + legendPadding;
    else if (legend.position === 'bottom')
      margin.bottom += Math.max(1, categories.length) * legendItemHeight + legendPadding;
  }

  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  if (chartWidth <= 0 || chartHeight <= 0) {
    return <svg width={width} height={height} />;
  }

  // X/Y domains using extentOf (replaces d3.extent)
  const xIsDate = allData.length > 0 && allData[0]?.x instanceof Date;
  const xNumValues = allData.map((d) => getXNumeric(d));
  const xDomain: [number, number] = xNumValues.length
    ? extentOf(
        xNumValues.map((v) => ({ v })),
        (dd) => dd.v,
      )
    : [0, 1];
  const yDomain: [number, number] = allData.length ? extentOf(allData, (d) => d.y) : [0, 1];

  // Scales using math equivalents (linear / time / no d3.scale*)
  const xScale = xIsDate
    ? timeScale([new Date(xDomain[0]), new Date(xDomain[1])], [0, chartWidth])
    : linearScale(xDomain, [0, chartWidth]);
  const yScale = linearScale([yDomain[0], yDomain[1]], [chartHeight, 0]);

  // Bubble size scale (pure math sqrt/log/linear)
  const bubbleEnabled = !!bubbleChart.enabled;
  const valueField = bubbleChart.valueField || 'size';
  const minSize = bubbleChart.minSize || pointSize;
  const maxSize = bubbleChart.maxSize || pointSize * 3;
  const sizeScaleType = bubbleChart.sizeScale || 'linear';

  let pointSizeScaleFn: ((val: number) => number) | null = null;
  if (bubbleEnabled) {
    const sizeVals: number[] = [];
    const sourceData = data && data.length ? data : allData;
    sourceData.forEach((d) => {
      const sv = (d as any)[valueField];
      if (typeof sv === 'number') sizeVals.push(sv);
    });
    const sizeExt: [number, number] = sizeVals.length
      ? extentOf(
          sizeVals.map((v) => ({ v })),
          (dd) => dd.v,
        )
      : [1, 10];

    if (sizeScaleType === 'sqrt') {
      const sc = sqrtScale(sizeExt, [minSize, maxSize]);
      pointSizeScaleFn = (v: number) => sc(v);
    } else if (sizeScaleType === 'log') {
      const logDom: [number, number] = [Math.max(0.1, sizeExt[0]), sizeExt[1]];
      const sc = logScale(logDom, [minSize, maxSize]);
      pointSizeScaleFn = (v: number) => sc(v);
    } else {
      const sc = linearScale(sizeExt, [minSize, maxSize]);
      pointSizeScaleFn = (v: number) => sc(v);
    }
  }

  // Radius calculator (pure fn, replaces duplicated d3 attr fns)
  const getRadius = (d: any, hoverMultiplier = 1): number => {
    let base = pointSize;
    if (d.seriesId) {
      const sItem = series?.find((s) => s.id === d.seriesId);
      if (sItem?.pointSize) base = sItem.pointSize;
      if (sItem?.bubbleChart?.enabled && pointSizeScaleFn) {
        const vf = sItem.bubbleChart.valueField || valueField;
        const sv = (d as any)[vf];
        base = typeof sv === 'number' ? pointSizeScaleFn(sv) : base;
      }
    } else if (bubbleEnabled && pointSizeScaleFn) {
      const sv = (d as any)[valueField];
      base = typeof sv === 'number' ? pointSizeScaleFn(sv) : base;
    }
    return base * hoverMultiplier;
  };

  // Trend line using linearRegression -> <line> (replaces d3-regression + d3.line path)
  let trendX1 = 0,
    trendY1 = 0,
    trendX2 = 0,
    trendY2 = 0,
    hasTrend = false;
  const tColor = trendLine?.color || trendLine?.colors || 'steelblue';
  const tWidth = trendLine?.strokeWidth || 2;
  const tDash = trendLine?.strokeDasharray || '6,2';
  if (trendLine?.show && allData.length >= 2) {
    const regPoints: [number, number][] = allData.map((d) => [getXNumeric(d), d.y]);
    const xExtReg: [number, number] = xDomain;
    const reg = linearRegression(regPoints, xExtReg);
    if (reg.points && reg.points.length === 2) {
      const [p0, p1] = reg.points;
      trendX1 = xScale(p0[0]);
      trendY1 = yScale(p0[1]);
      trendX2 = xScale(p1[0]);
      trendY2 = yScale(p1[1]);
      hasTrend = true;
    }
  }

  // Grid ticks (computed, no d3.axis generators)
  const yTickCount = 5;
  const yTicks = yScale.ticks ? yScale.ticks(yTickCount) : [yDomain[0], yDomain[1]];
  const xTickCount = 5;
  const xTicksRaw = xScale.ticks ? xScale.ticks(xTickCount) : xDomain;
  const xTicks = xTicksRaw;

  // Build error bar elements (pure)
  const errorBarsEnabled = !!errorBars?.enabled;
  const errorBarColor = errorBars?.color || errorBars?.colors || '#333';
  const errorBarStrokeWidth = errorBars?.strokeWidth || 1;
  const errorBarCapWidth = errorBars?.capWidth || 6;
  const errorBarOpacity = errorBars?.opacity || 0.6;
  const showXErr = errorBars?.xAxis !== false;
  const showYErr = errorBars?.yAxis !== false;
  const showErrCaps = errorBars?.showCaps !== false;

  const errorBarElements: React.ReactNode[] = [];
  if (errorBarsEnabled) {
    allData.forEach((d, idx) => {
      if (selectedCategory && d.category !== selectedCategory) return;
      if (selectedSeries && d.seriesId !== selectedSeries) return;

      let eColor = errorBarColor;
      let eWidth = errorBarStrokeWidth;
      let eOp = errorBarOpacity;
      if (d.seriesId) {
        const sItem = series?.find((s) => s.id === d.seriesId);
        if (sItem?.errorBars) {
          eColor = sItem.errorBars.color || sItem.errorBars.colors || eColor;
          eWidth = sItem.errorBars.strokeWidth || eWidth;
          eOp = sItem.errorBars.opacity || eOp;
        }
      }
      const ptColor = getPointColor(d);

      // X error
      if (showXErr && d.xError !== undefined) {
        let neg = 0,
          pos = 0;
        if (Array.isArray(d.xError)) {
          neg = d.xError[0] || 0;
          pos = d.xError[1] || d.xError[0] || 0;
        } else {
          neg = pos = d.xError;
        }
        const x1 = xScale(getXNumeric(d) - neg);
        const x2 = xScale(getXNumeric(d) + pos);
        const y = yScale(d.y);
        errorBarElements.push(
          <line
            key={`ex-${idx}`}
            x1={x1}
            x2={x2}
            y1={y}
            y2={y}
            stroke={ptColor}
            strokeWidth={eWidth}
            opacity={eOp}
          />,
        );
        if (showErrCaps) {
          const cap = errorBarCapWidth / 2;
          errorBarElements.push(
            <line
              key={`exl-${idx}`}
              x1={x1}
              x2={x1}
              y1={y - cap}
              y2={y + cap}
              stroke={ptColor}
              strokeWidth={eWidth}
              opacity={eOp}
            />,
            <line
              key={`exr-${idx}`}
              x1={x2}
              x2={x2}
              y1={y - cap}
              y2={y + cap}
              stroke={ptColor}
              strokeWidth={eWidth}
              opacity={eOp}
            />,
          );
        }
      }
      // Y error
      if (showYErr && d.yError !== undefined) {
        let neg = 0,
          pos = 0;
        if (Array.isArray(d.yError)) {
          neg = d.yError[0] || 0;
          pos = d.yError[1] || d.yError[0] || 0;
        } else {
          neg = pos = d.yError;
        }
        const x = xScale(getXNumeric(d));
        const y1 = yScale(d.y - neg);
        const y2 = yScale(d.y + pos);
        errorBarElements.push(
          <line
            key={`ey-${idx}`}
            x1={x}
            x2={x}
            y1={y1}
            y2={y2}
            stroke={ptColor}
            strokeWidth={eWidth}
            opacity={eOp}
          />,
        );
        if (showErrCaps) {
          const cap = errorBarCapWidth / 2;
          errorBarElements.push(
            <line
              key={`eyt-${idx}`}
              x1={x - cap}
              x2={x + cap}
              y1={y1}
              y2={y1}
              stroke={ptColor}
              strokeWidth={eWidth}
              opacity={eOp}
            />,
            <line
              key={`eyb-${idx}`}
              x1={x - cap}
              x2={x + cap}
              y1={y2}
              y2={y2}
              stroke={ptColor}
              strokeWidth={eWidth}
              opacity={eOp}
            />,
          );
        }
      }
    });
  }

  // Legend position calc (pure)
  const legendItemHeight = 20;
  let legendX = 0,
    legendY = 0;
  if (showLegend) {
    if (legend.position === 'right') {
      legendX = chartWidth + margin.left + 20;
      legendY = margin.top + (chartHeight - categories.length * legendItemHeight) / 2;
    } else if (legend.position === 'left') {
      legendX = 10;
      legendY = margin.top + (chartHeight - categories.length * legendItemHeight) / 2;
    } else if (legend.position === 'top') {
      legendX = margin.left;
      legendY = 10;
    } else {
      legendX = margin.left;
      legendY = chartHeight + margin.top + 20;
    }
  }

  // Axis label elements
  const axisLabelEls: React.ReactNode[] = [];
  if (xAxis.label) {
    axisLabelEls.push(
      <text
        key="xlab"
        x={chartWidth / 2}
        y={chartHeight + (margin.bottom - 10)}
        textAnchor="middle"
        fill={xAxis.labelColor || '#333'}
        fontSize={xAxis.labelFontSize || 14}
      >
        {xAxis.label}
      </text>,
    );
  }
  if (yAxis.label) {
    axisLabelEls.push(
      <text
        key="ylab"
        transform={`rotate(-90)`}
        x={-chartHeight / 2}
        y={-margin.left + 20}
        textAnchor="middle"
        fill={yAxis.labelColor || '#333'}
        fontSize={yAxis.labelFontSize || 14}
      >
        {yAxis.label}
      </text>,
    );
  }

  // Custom axis rendering (supports tickFormat, dates) - replaces d3.axis + post styling
  const renderXAxis = () => {
    const tickVals = xTicks;
    return (
      <g transform={`translate(0, ${chartHeight})`}>
        <line x1={0} x2={chartWidth} stroke={xAxis.stroke || '#333'} className="domain" />
        {tickVals.map((t, i) => {
          const numT = Number(t);
          const x = xScale(numT);
          let label = String(t);
          if (xAxis.tickFormat) {
            const orig = xIsDate ? new Date(numT) : numT;
            label = xAxis.tickFormat(orig as any);
          } else if (xIsDate) {
            label = new Date(numT).toLocaleDateString();
          }
          return (
            <g key={`xt-${i}`} transform={`translate(${x}, 0)`}>
              <line y2={6} stroke={xAxis.tickColor || '#333'} />
              <text
                y={20}
                textAnchor="middle"
                fill={xAxis.tickColor || '#333'}
                fontSize={xAxis.fontSize || 12}
              >
                {label}
              </text>
            </g>
          );
        })}
      </g>
    );
  };

  const renderYAxis = () => {
    const tickVals = yTicks;
    return (
      <g>
        <line y1={0} y2={chartHeight} stroke={yAxis.stroke || '#333'} className="domain" />
        {tickVals.map((t, i) => {
          const y = yScale(Number(t));
          let label = String(t);
          if (yAxis.tickFormat) {
            label = yAxis.tickFormat(t as any);
          }
          return (
            <g key={`yt-${i}`} transform={`translate(0, ${y})`}>
              <line
                x1={-6}
                x2={chartWidth}
                stroke={yAxis.tickColor || '#333'}
                strokeOpacity={0.3}
              />
              <text
                x={-10}
                textAnchor="end"
                dominantBaseline="middle"
                fill={yAxis.tickColor || '#333'}
                fontSize={yAxis.fontSize || 12}
              >
                {label}
              </text>
            </g>
          );
        })}
      </g>
    );
  };

  // Grid lines (pure <line>)
  const gridEls: React.ReactNode[] = [];
  if (grid.horizontal) {
    yTicks.forEach((t, i) => {
      const y = yScale(Number(t));
      gridEls.push(
        <line
          key={`gh-${i}`}
          x1={0}
          x2={chartWidth}
          y1={y}
          y2={y}
          stroke={grid.stroke || '#e0e0e0'}
          strokeWidth={grid.strokeWidth || 1}
          strokeDasharray={grid.strokeDasharray || '3 3'}
        />,
      );
    });
  }
  if (grid.vertical) {
    xTicks.forEach((t, i) => {
      const x = xScale(Number(t));
      gridEls.push(
        <line
          key={`gv-${i}`}
          x1={x}
          x2={x}
          y1={0}
          y2={chartHeight}
          stroke={grid.stroke || '#e0e0e0'}
          strokeWidth={grid.strokeWidth || 1}
          strokeDasharray={grid.strokeDasharray || '3 3'}
        />,
      );
    });
  }

  // Data point + hover area elements (pure JSX, new tooltip callbacks)
  const dotEls: React.ReactNode[] = [];
  const hoverEls: React.ReactNode[] = [];

  allData.forEach((d, i) => {
    const key = `${i}-${d.category}-${getXNumeric(d)}-${d.y}`;
    const isSelected =
      (!selectedCategory || d.category === selectedCategory) &&
      (!selectedSeries || d.seriesId === selectedSeries);
    const isHovered = hoveredKey === key;
    const fill = getPointColor(d);
    const op = isSelected ? 0.85 : 0.2;
    const r = getRadius(d, isHovered ? 1.5 : 1);
    const cx = xScale(getXNumeric(d));
    const cy = yScale(d.y);

    const buildTooltipContent = (): string => {
      const hoveredForFormat: any = {
        ...d,
        eventX: 0,
        eventY: 0,
        seriesId: d.seriesId,
        seriesName: d.seriesName,
      };
      if (typeof tooltipFormat === 'function') {
        return tooltipFormat(hoveredForFormat);
      }
      const xVal = d.x instanceof Date ? d.x.toLocaleDateString() : d.x;
      return `
        <div style="display:flex;align-items:center;margin-bottom:5px;">
          <span style="width:10px;height:10px;background:${fill};border-radius:50%;margin-right:8px;"></span>
          <strong>${d.category}</strong>
        </div>
        ${d.seriesName ? `<div><strong>Series:</strong> ${d.seriesName}</div>` : ''}
        <div>X: ${xVal}</div>
        <div>Y: ${d.y}</div>
        ${d.size ? `<div>Size: ${d.size}</div>` : ''}
      `;
    };

    const onEnter = (e: React.MouseEvent<SVGCircleElement>) => {
      setHoveredKey(key);
      if (onShowTooltip) {
        const content = buildTooltipContent();
        onShowTooltip(content, e);
      }
    };
    const onLeave = () => {
      setHoveredKey(null);
      onHideTooltip?.();
    };
    const onMove = (e: React.MouseEvent<SVGCircleElement>) => {
      if (onShowTooltip) {
        const content = buildTooltipContent();
        onShowTooltip(content, e);
      }
    };
    const onClickHandler = (e: React.MouseEvent<SVGCircleElement>) => {
      if (onPointClick) {
        onPointClick(e as any, d, d.seriesId);
      }
    };

    dotEls.push(
      <circle
        key={`dot-${key}`}
        className="dot"
        cx={cx}
        cy={cy}
        r={r}
        fill={fill}
        opacity={op}
        stroke={isHovered ? '#fff' : 'none'}
        strokeWidth={isHovered ? 2 : 0}
        style={{ cursor: 'pointer' }}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        onMouseMove={onMove}
        onClick={onClickHandler}
      />,
    );

    // Hover area (larger, keeps test selectors + easier interaction)
    const hr = getRadius(d, 3);
    hoverEls.push(
      <circle
        key={`ha-${key}`}
        className="hover-area"
        cx={cx}
        cy={cy}
        r={hr}
        fill="transparent"
        style={{ pointerEvents: 'all' }}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        onMouseMove={onMove}
        onClick={onClickHandler}
      />,
    );
  });

  // Legend items (pure JSX, clickable)
  const legendItemsEls: React.ReactNode[] = [];
  if (showLegend) {
    categories.forEach((cat, idx) => {
      const isActive = !selectedCategory || selectedCategory === cat;
      const fillCol = cat ? categoryColorScale(cat) : CATEGORY_10[0];
      const handleLegendClick = () => {
        if (legend.clickable && onLegendItemClick) {
          const next = selectedCategory === cat ? null : cat;
          onLegendItemClick(next);
        }
      };
      legendItemsEls.push(
        <g
          key={`leg-${idx}`}
          transform={`translate(0, ${idx * legendItemHeight})`}
          style={{ cursor: legend.clickable ? 'pointer' : 'default' }}
          onClick={handleLegendClick}
        >
          <rect width={12} height={12} rx={6} ry={6} fill={fillCol} opacity={isActive ? 1 : 0.5} />
          <text x={18} y={9} fontSize={12} fill="#333" opacity={isActive ? 1 : 0.5}>
            {cat}
          </text>
        </g>,
      );
    });
  }

  const svgContent = (
    <g transform={`translate(${margin.left}, ${margin.top})`}>
      {/* Grids */}
      {gridEls}

      {/* Axes */}
      {renderXAxis()}
      {renderYAxis()}

      {/* Axis labels */}
      {axisLabelEls}

      {/* Error bars (below points) */}
      <g className="error-bars">{errorBarElements}</g>

      {/* Trend line as <line> (per requirements) */}
      {hasTrend && (
        <line
          className="trend-line"
          x1={trendX1}
          y1={trendY1}
          x2={trendX2}
          y2={trendY2}
          stroke={tColor}
          strokeWidth={tWidth}
          strokeDasharray={tDash}
          fill="none"
        />
      )}

      {/* Dots */}
      <g className="dots">{dotEls}</g>

      {/* Larger hover areas for interaction + test compatibility */}
      <g className="hover-areas">{hoverEls}</g>

      {/* Legend */}
      {showLegend && legendItemsEls.length > 0 && (
        <g
          className="legend"
          transform={`translate(${legendX - margin.left}, ${legendY - margin.top})`}
        >
          {legendItemsEls}
        </g>
      )}
    </g>
  );

  return (
    <svg width={width} height={height}>
      {svgContent}
    </svg>
  );
};
