import React, { useState, useCallback } from 'react';
import { GaugeDonutChartProps, GaugeDonutData } from './types';
import type { LegendConfig } from '../types/legend';
import type { TooltipConfig } from '../types/tooltip';
import { useTooltip } from '../hooks/useTooltip';
import { Tooltip } from '../components/Tooltip';
import { pieLayout, arcPath } from '../math';

export interface GaugeDonutChartRendererProps extends GaugeDonutChartProps {
  legend?: LegendConfig;
  theme?: 'light' | 'dark';
  className?: string;
  style?: React.CSSProperties;
  variant?:
    | 'full'
    | 'half-bottom'
    | 'half-top'
    | 'half-left'
    | 'half-right'
    | 'quarter-bottom-right'
    | 'quarter-top-right'
    | 'quarter-bottom-left'
    | 'quarter-top-left';
  colors?: string[];
  showTooltip?: boolean;
  tooltip?: TooltipConfig;
  tooltipFormat?: (data: GaugeDonutData, total: number, percent: string) => string;
  enableGlow?: boolean;
  glowColor?: string;
  glowBlur?: number;
}

export const GaugeDonutChartRenderer: React.FC<GaugeDonutChartRendererProps> = ({
  legend = { position: 'bottom' },
  theme = 'light',
  className = '',
  style,
  data,
  width = 400,
  height = 400,
  variant = 'full',
  centerLabel,
  centerValue,
  onSliceClick,
  colors = [
    '#1f77b4',
    '#ff7f0e',
    '#2ca02c',
    '#d62728',
    '#9467bd',
    '#8c564b',
    '#e377c2',
    '#7f7f7f',
    '#bcbd22',
    '#17becf',
  ],
  showTooltip = true,
  tooltipConfig = {
    backgroundColor: 'rgba(0,0,0,0.85)',
    textColor: '#fff',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '14px',
  },
  tooltip,
  tooltipFormat,
  enableGlow = false,
  glowColor,
  glowBlur = 5,
  innerRadius = 0.6,
  outerRadius = 0.8,
}) => {
  const [activeSlices, setActiveSlices] = useState<Set<string>>(new Set());

  const handleSliceClick = useCallback(
    (clickedData: GaugeDonutData) => {
      const newActiveSlices = new Set(activeSlices);

      if (newActiveSlices.has(clickedData.label)) {
        newActiveSlices.delete(clickedData.label);
      } else {
        newActiveSlices.add(clickedData.label);
      }

      setActiveSlices(newActiveSlices);
      onSliceClick?.(clickedData);
    },
    [activeSlices, onSliceClick],
  );

  // Compute gauge angles (no d3.pie)
  let startAngle = 0;
  let endAngle = Math.PI * 2;
  switch (variant) {
    case 'full':
      startAngle = 0;
      endAngle = Math.PI * 2;
      break;
    case 'half-left':
      startAngle = Math.PI;
      endAngle = Math.PI * 2;
      break;
    case 'half-right':
      startAngle = 0;
      endAngle = Math.PI;
      break;
    case 'half-bottom':
      startAngle = Math.PI / 2;
      endAngle = Math.PI * 1.5;
      break;
    case 'half-top':
      startAngle = Math.PI * 1.5;
      endAngle = Math.PI * 2.5;
      break;
    case 'quarter-top-left':
      startAngle = Math.PI * 1.5;
      endAngle = Math.PI * 2;
      break;
    case 'quarter-top-right':
      startAngle = 0;
      endAngle = Math.PI / 2;
      break;
    case 'quarter-bottom-left':
      startAngle = Math.PI;
      endAngle = Math.PI * 1.5;
      break;
    case 'quarter-bottom-right':
      startAngle = Math.PI / 2;
      endAngle = Math.PI;
      break;
    default:
      startAngle = 0;
      endAngle = Math.PI * 2;
  }

  const filteredData =
    activeSlices.size === 0 ? data : data.filter((d) => activeSlices.has(d.label));

  // Use pieLayout + arcPath (no d3, no useEffect mutation)
  const slices = pieLayout(filteredData, (d: GaugeDonutData) => d.value, startAngle, endAngle);
  const total = filteredData.reduce((sum, d) => sum + d.value, 0);

  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) / 2;
  const innerR = radius * (innerRadius ?? 0.6);
  const outerR = radius * (outerRadius ?? 0.8);

  // New React tooltip (client coords, no ref/d3.pointer)
  const mergedTooltip: TooltipConfig = {
    backgroundColor: 'rgba(0,0,0,0.85)',
    textColor: '#fff',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '14px',
    ...tooltipConfig,
    ...tooltip,
  };
  const { tooltipState, showTooltip: showT, hideTooltip } = useTooltip(mergedTooltip);

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: legend.position === 'right' || legend.position === 'left' ? 'row' : 'column',
    gap: '1rem',
    padding: '1rem',
    backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
    colors: theme === 'dark' ? '#ffffff' : '#000000',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    ...style,
  };

  const chartStyle: React.CSSProperties = {
    flex: '1 1 auto',
    minWidth: 0,
    minHeight: 0,
    position: 'relative',
  };

  const legendStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '0.5rem',
    backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f5f5f5',
    borderRadius: '4px',
    maxHeight: legend.position === 'right' || legend.position === 'left' ? '100%' : '200px',
    overflowY: 'auto',
  };

  // Color accessor (supports both `color` (per types) and legacy `colors`)
  const getColor = (item: GaugeDonutData, i: number) =>
    (item as any).color || (item as any).colors || colors[i % colors.length];

  return (
    <div className={`chart-container ${className}`} style={containerStyle}>
      {legend.position === 'top' && (
        <div style={legendStyle}>
          {data.map((item, idx) => {
            const isActive = activeSlices.has(item.label);
            return (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.25rem',
                  cursor: 'pointer',
                  opacity: isActive ? 1 : 0.5,
                  transition: 'opacity 0.2s',
                }}
                onClick={() => handleSliceClick(item)}
              >
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: getColor(
                      item,
                      data.indexOf(item) >= 0 ? data.indexOf(item) : idx,
                    ),
                    borderRadius: '2px',
                  }}
                />
                <span>{item.label}</span>
                <span style={{ color: theme === 'dark' ? '#aaa' : '#666' }}>({item.value})</span>
              </div>
            );
          })}
        </div>
      )}

      <div style={chartStyle}>
        <svg width={width} height={height} style={{ display: 'block' }}>
          <g transform={`translate(${cx},${cy})`}>
            <defs>
              {enableGlow && (
                <filter id="gauge-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation={glowBlur} result="coloredBlur" />
                  <feFlood floodColor={glowColor || 'currentColor'} result="glowColor" />
                  <feComposite
                    in="glowColor"
                    in2="coloredBlur"
                    operator="in"
                    result="coloredBlur"
                  />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              )}
              {filteredData.map((d, i) =>
                d.gradient ? (
                  <linearGradient
                    key={`grad-${i}`}
                    id={`gradient-${i}`}
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    {d.gradient.map((stop, j) => (
                      <stop
                        key={j}
                        offset={stop.offset}
                        stopColor={(stop as any).color || (stop as any).colors}
                        stopOpacity={stop.opacity ?? 1}
                      />
                    ))}
                  </linearGradient>
                ) : null,
              )}
            </defs>

            {/* Gauge slices using pieLayout + arcPath (pure computed JSX, no D3 mutation) */}
            {slices.map((slice, i) => {
              const d = slice.data;
              const percent = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0.0';
              const content = tooltipFormat
                ? tooltipFormat(d, total, percent)
                : `<strong>${d.label}</strong><br/>Value: ${d.value}<br/>${percent}%`;
              const fill = d.gradient
                ? `url(#gradient-${i})`
                : (d as any).color || (d as any).colors || colors[i % colors.length];
              return (
                <path
                  key={d.label}
                  d={arcPath(innerR, outerR, slice.startAngle, slice.endAngle)}
                  fill={fill}
                  stroke="#fff"
                  strokeWidth={2}
                  style={{ transition: 'opacity 0.2s' }}
                  filter={enableGlow ? 'url(#gauge-glow)' : undefined}
                  cursor={onSliceClick || showTooltip ? 'pointer' : 'default'}
                  pointerEvents="all"
                  onMouseOver={showTooltip ? (e) => showT(content, e) : undefined}
                  onMouseOut={showTooltip ? () => hideTooltip() : undefined}
                  onClick={onSliceClick ? () => handleSliceClick(d) : undefined}
                />
              );
            })}

            {/* Center text */}
            {(centerLabel || centerValue !== undefined) && (
              <g textAnchor="middle" dominantBaseline="middle" style={{ pointerEvents: 'none' }}>
                <text
                  className="text-slate-700 dark:text-slate-300"
                  style={{ fontSize: '32px', fontWeight: 'bold' }}
                >
                  {centerValue !== undefined ? centerValue : total.toFixed(0)}
                </text>
                {centerLabel && (
                  <text
                    className="text-slate-500 dark:text-slate-400"
                    y={30}
                    style={{ fontSize: '16px' }}
                  >
                    {centerLabel}
                  </text>
                )}
              </g>
            )}
          </g>
        </svg>
      </div>

      {legend.position === 'bottom' && (
        <div style={legendStyle}>
          {data.map((item, idx) => {
            const isActive = activeSlices.has(item.label);
            return (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.25rem',
                  cursor: 'pointer',
                  opacity: isActive ? 1 : 0.5,
                  transition: 'opacity 0.2s',
                }}
                onClick={() => handleSliceClick(item)}
              >
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: getColor(
                      item,
                      data.indexOf(item) >= 0 ? data.indexOf(item) : idx,
                    ),
                    borderRadius: '2px',
                  }}
                />
                <span>{item.label}</span>
                <span style={{ color: theme === 'dark' ? '#aaa' : '#666' }}>({item.value})</span>
              </div>
            );
          })}
        </div>
      )}

      {(legend.position === 'left' || legend.position === 'right') && (
        <div style={{ ...legendStyle, width: '200px' }}>
          {data.map((item, idx) => {
            const isActive = activeSlices.has(item.label);
            return (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.25rem',
                  cursor: 'pointer',
                  opacity: isActive ? 1 : 0.5,
                  transition: 'opacity 0.2s',
                }}
                onClick={() => handleSliceClick(item)}
              >
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: getColor(
                      item,
                      data.indexOf(item) >= 0 ? data.indexOf(item) : idx,
                    ),
                    borderRadius: '2px',
                  }}
                />
                <span>{item.label}</span>
                <span style={{ color: theme === 'dark' ? '#aaa' : '#666' }}>({item.value})</span>
              </div>
            );
          })}
        </div>
      )}

      <Tooltip state={tooltipState} config={mergedTooltip} />
    </div>
  );
};
