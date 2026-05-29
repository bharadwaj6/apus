import React from 'react';
import { FunnelChartProps } from './types';
import { maxOf } from '../math/array';
import { linearScale } from '../math/scales';

// Zero-dep color darken (replaces d3.color().darker()) - local to this file only
function darkenHex(color: string | undefined, factor = 0.5): string {
  if (!color) return '#555555';
  let hex = color.replace('#', '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  const num = parseInt(hex, 16);
  if (isNaN(num)) return color;
  let r = Math.floor(((num >> 16) & 255) * (1 - factor));
  let g = Math.floor(((num >> 8) & 255) * (1 - factor));
  let b = Math.floor((num & 255) * (1 - factor));
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

const FunnelChartRenderer: React.FC<
  FunnelChartProps & {
    onShowTooltip?: (content: string, event: React.MouseEvent | MouseEvent) => void;
    onHideTooltip?: () => void;
  }
> = ({
  data = [],
  width = 600,
  height = 400,
  margin = { top: 20, right: 20, bottom: 30, left: 40 },
  showValues = false,
  valueFormat = (v: number) => v.toString(),
  onSliceClick,
  tooltip = {
    backgroundColor: '#000000',
    textColor: '#FFFFFF',
    padding: '8px',
    borderRadius: '4px',
    fontSize: '12px',
    offsetX: 10,
    offsetY: 10,
  },
  tooltipFormat,
  isDarkMode = false,
  enableGradients = false,
  gradientDirection = 'vertical',
  segmentShadowColor = 'rgba(0,0,0,0.2)',
  segmentShadowBlur = 5,
  segmentShadowOffsetX = 0,
  segmentShadowOffsetY = 5,
  onShowTooltip,
  onHideTooltip,
}) => {
  const filterId = `funnel-shadow-${React.useId()}`;

  const innerWidth = Math.max(0, width - (margin?.left ?? 0) - (margin?.right ?? 0));
  const innerHeight = Math.max(0, height - (margin?.top ?? 0) - (margin?.bottom ?? 0));

  const maxValue = maxOf(data, (d) => d.value) || 0;
  const xScale = linearScale([0, maxValue], [0, innerWidth]);
  const segmentHeight = data.length > 0 ? innerHeight / data.length : 0;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        minHeight: height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <svg width={width} height={height} style={{ display: 'block' }}>
        <defs>
          {/* Pure JSX drop-shadow filter (replaces d3 filter creation) */}
          <filter
            id={filterId}
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feDropShadow
              dx={segmentShadowOffsetX}
              dy={segmentShadowOffsetY}
              stdDeviation={segmentShadowBlur}
              floodColor={segmentShadowColor}
            />
          </filter>

          {/* Pure JSX gradients per segment (replaces d3 defs append in useEffect) */}
          {enableGradients &&
            data.map((d, i) => {
              const safeLabel = (d.label || `seg${i}`).replace(/[^a-zA-Z0-9-_]/g, '');
              const gid = `gradient-${safeLabel}-${i}`;
              const darker = darkenHex(d.color, 0.5);
              const isVertical = gradientDirection === 'vertical';
              return (
                <linearGradient
                  key={gid}
                  id={gid}
                  x1="0%"
                  y1="0%"
                  x2={isVertical ? '0%' : '100%'}
                  y2={isVertical ? '100%' : '0%'}
                >
                  <stop offset="0%" stopColor={darker} />
                  <stop offset="100%" stopColor={d.color || '#888888'} />
                </linearGradient>
              );
            })}
        </defs>

        <g transform={`translate(${margin?.left ?? 0},${margin?.top ?? 0})`}>
          {data.map((d, i) => {
            const topW = xScale(d.value);
            const botW = i < data.length - 1 ? xScale(data[i + 1].value) : 0;
            const topX = (innerWidth - topW) / 2;
            const botX = (innerWidth - botW) / 2;
            const y = i * segmentHeight;

            const safeLabel = (d.label || `seg${i}`).replace(/[^a-zA-Z0-9-_]/g, '');
            const gid = `gradient-${safeLabel}-${i}`;
            const fill =
              enableGradients && d.color
                ? `url(#${gid})`
                : d.color || `hsl(${(i * 360) / Math.max(1, data.length)}, 70%, 50%)`;

            // Trapezoid: compute 4 corner points, render as <polygon> (replaces path d= M L..)
            const points = [
              `${topX},${y}`,
              `${topX + topW},${y}`,
              `${botX + botW},${y + segmentHeight}`,
              `${botX},${y + segmentHeight}`,
            ].join(' ');

            const content = tooltipFormat
              ? tooltipFormat(d)
              : `<div style="background-color: ${tooltip.backgroundColor}; color: ${tooltip.textColor}; padding: ${tooltip.padding}; border-radius: ${tooltip.borderRadius}; font-size: ${tooltip.fontSize}; box-shadow: 0 4px 12px rgba(0,0,0,0.15); text-align: center;">
                  <div style="font-weight: bold; color: ${d.color || (isDarkMode ? '#a8dadc' : '#4287f5')};">${d.label}</div>
                  <div>Value: <span style="font-weight: bold;">${valueFormat(d.value)}</span></div>
                </div>`;

            return (
              <g key={i} className="funnel-segment">
                <polygon
                  points={points}
                  fill={fill}
                  stroke="#fff"
                  strokeWidth={1}
                  style={{
                    cursor: onSliceClick ? 'pointer' : 'default',
                    filter: `url(#${filterId})`,
                  }}
                  onClick={() => onSliceClick?.(d)}
                  onMouseEnter={(e) => {
                    onShowTooltip?.(content, e);
                  }}
                  onMouseLeave={() => {
                    onHideTooltip?.();
                  }}
                />
                {showValues && (
                  <text
                    x={innerWidth / 2}
                    y={y + segmentHeight / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={isDarkMode ? '#e2e8f0' : '#1a202c'}
                    fontSize="14px"
                    pointerEvents="none"
                  >
                    {`${d.label}: ${valueFormat(d.value)}`}
                  </text>
                )}
              </g>
            );
          })}

          {/* Left labels (replaces the d3 .y-axis-label enter append) */}
          {data.map((d, i) => (
            <text
              key={`ylabel-${i}`}
              x={-10}
              y={i * segmentHeight + segmentHeight / 2}
              textAnchor="end"
              dominantBaseline="middle"
              fill={isDarkMode ? '#cbd5e0' : '#4a5568'}
              fontSize="12px"
            >
              {d.label}
            </text>
          ))}
        </g>
      </svg>
    </div>
  );
};

export default FunnelChartRenderer;
