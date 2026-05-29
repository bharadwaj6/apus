import React, { useState, useCallback } from 'react';
import { NestedDonutChartProps } from './types';
import { pieLayout, arcPath } from '../math';

interface NestedDonutChartRendererProps extends NestedDonutChartProps {
  legend?: import('../types/legend').LegendConfig;
  theme?: 'light' | 'dark';
  className?: string;
  style?: React.CSSProperties;
  enableGlow?: boolean;
  glowColor?: string;
  glowBlur?: number;
  onShowTooltip?: (content: string, event: React.MouseEvent | MouseEvent) => void;
  onHideTooltip?: () => void;
}

export const NestedDonutChartRenderer: React.FC<NestedDonutChartRendererProps> = ({
  legend = { position: 'bottom' },
  theme = 'light',
  className = '',
  style,
  levels,
  width = 400,
  height = 400,
  colors,
  centerLabel,
  centerValue,
  onSliceClick,
  enableGlow = false,
  glowColor,
  glowBlur = 5,
  innerRadius: innerRadiusProp,
  outerRadius: outerRadiusProp,
  cornerRadius = 4,
  padAngle = 0.02,
  tooltip = {},
  onShowTooltip,
  onHideTooltip,
}) => {
  const [activeSlices, setActiveSlices] = useState<Set<string>>(new Set());

  const handleSliceClick = useCallback(
    (level: number, data: { label: string; value: number; colors?: string }) => {
      const sliceKey = `${level}-${data.label}`;
      const newActiveSlices = new Set(activeSlices);

      if (newActiveSlices.has(sliceKey)) {
        newActiveSlices.delete(sliceKey);
      } else {
        newActiveSlices.add(sliceKey);
      }

      setActiveSlices(newActiveSlices);
      onSliceClick?.(level, data);
    },
    [activeSlices, onSliceClick],
  );

  // Pure computed rings using pieLayout + arcPath (no D3, no mutation, no useEffect)
  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = outerRadiusProp !== undefined ? outerRadiusProp : Math.min(width, height) / 2;
  const minRadius = innerRadiusProp !== undefined ? innerRadiusProp : maxRadius / 3;
  const totalRingSpace = maxRadius - minRadius;
  const ringThickness = totalRingSpace > 0 ? totalRingSpace / levels.length : 0;

  const DEFAULT_PALETTE = [
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
  ];

  const getSliceColor = (
    levelIdx: number,
    sliceIdx: number,
    item?: { color?: string; colors?: string },
  ) => {
    if (item?.color) return item.color;
    if (item?.colors) return item.colors;
    if (colors && colors[levelIdx] && colors[levelIdx][sliceIdx]) {
      return colors[levelIdx][sliceIdx];
    }
    return DEFAULT_PALETTE[(levelIdx * 7 + sliceIdx) % DEFAULT_PALETTE.length];
  };

  const rings = levels.map((level, levelIndex) => {
    const slices = pieLayout(level, (d) => d.value);
    const outerR = maxRadius - levelIndex * ringThickness;
    const innerR = maxRadius - (levelIndex + 1) * ringThickness;
    const total = level.reduce((sum, item) => sum + item.value, 0);
    return { slices, outerR, innerR, levelIndex, total, level };
  });

  // Legend color helper (no d3)
  const getLegendColor = (levelIdx: number, item: any, itemIdx: number) =>
    getSliceColor(levelIdx, itemIdx, item);

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: legend.position === 'right' || legend.position === 'left' ? 'row' : 'column',
    gap: '1rem',
    padding: '1rem',
    backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
    color: theme === 'dark' ? '#ffffff' : '#000000',
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

  return (
    <div className={`chart-container ${className}`} style={containerStyle}>
      {legend.position === 'top' && (
        <div style={legendStyle}>
          {levels.map((level, levelIdx) => (
            <div key={levelIdx} style={{ marginBottom: '0.5rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0' }}>Level {levelIdx + 1}</h4>
              {level.map((item) => {
                const sliceKey = `${levelIdx}-${item.label}`;
                const isActive = activeSlices.has(sliceKey);
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
                    onClick={() => handleSliceClick(levelIdx, item)}
                  >
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        backgroundColor: getLegendColor(levelIdx, item, level.indexOf(item)),
                        borderRadius: '2px',
                      }}
                    />
                    <span
                      style={{
                        flex: 1,
                        fontSize: '14px',
                        color: theme === 'dark' ? '#fff' : '#000',
                      }}
                    >
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      <div style={chartStyle}>
        <svg width={width} height={height} style={{ display: 'block' }}>
          <defs>
            {enableGlow && (
              <filter id="nested-donut-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation={glowBlur} result="coloredBlur" />
                <feFlood floodColor={glowColor || 'currentColor'} result="glowColor" />
                <feComposite in="glowColor" in2="coloredBlur" operator="in" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            )}
          </defs>
          <g transform={`translate(${cx},${cy})`}>
            {rings.map((ring) => (
              <g key={ring.levelIndex}>
                {ring.slices.map((slice, i) => {
                  const dataItem = slice.data as {
                    label: string;
                    value: number;
                    color?: string;
                    colors?: string;
                  };
                  const sliceKey = `${ring.levelIndex}-${dataItem.label}`;
                  const isDimmed = activeSlices.size > 0 && !activeSlices.has(sliceKey);
                  const fillColor = getSliceColor(ring.levelIndex, i, dataItem);
                  const totalForLevel = ring.total;
                  const percent =
                    totalForLevel > 0 ? ((dataItem.value / totalForLevel) * 100).toFixed(1) : '0.0';
                  return (
                    <path
                      key={dataItem.label}
                      d={arcPath(ring.innerR, ring.outerR, slice.startAngle, slice.endAngle)}
                      fill={fillColor}
                      stroke={theme === 'dark' ? '#333' : '#fff'}
                      strokeWidth={1}
                      opacity={isDimmed ? 0.3 : 1}
                      style={{
                        transition: 'opacity 0.2s',
                        cursor: onSliceClick ? 'pointer' : 'default',
                      }}
                      onMouseOver={(e) => {
                        const content = `
                          <div style='min-width:120px'>
                            <strong>Level ${ring.levelIndex + 1}: ${dataItem.label}</strong>
                            <div style='margin-top:4px'>
                              Value: ${dataItem.value}
                              <br/>
                              ${percent}%
                            </div>
                          </div>`;
                        onShowTooltip?.(content, e);
                      }}
                      onMouseOut={() => {
                        onHideTooltip?.();
                      }}
                      onClick={() => handleSliceClick(ring.levelIndex, dataItem)}
                      filter={enableGlow ? 'url(#nested-donut-glow)' : undefined}
                    />
                  );
                })}
              </g>
            ))}
            {/* Center label/value */}
            {(centerLabel || centerValue) && (
              <g textAnchor="middle" dominantBaseline="middle" style={{ pointerEvents: 'none' }}>
                {centerValue !== undefined && (
                  <text
                    y={-8}
                    style={{
                      fontSize: 32,
                      fontWeight: 'bold',
                      fill: theme === 'dark' ? '#eee' : '#333',
                    }}
                  >
                    {centerValue}
                  </text>
                )}
                {centerLabel && (
                  <text
                    y={12}
                    style={{
                      fontSize: 16,
                      fill: theme === 'dark' ? '#ccc' : '#666',
                    }}
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
          {levels.map((level, levelIdx) => (
            <div key={levelIdx} style={{ marginBottom: '0.5rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0' }}>Level {levelIdx + 1}</h4>
              {level.map((item) => {
                const sliceKey = `${levelIdx}-${item.label}`;
                const isActive = activeSlices.has(sliceKey);
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
                    onClick={() => handleSliceClick(levelIdx, item)}
                  >
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        backgroundColor: getLegendColor(levelIdx, item, level.indexOf(item)),
                        borderRadius: '2px',
                      }}
                    />
                    <span
                      style={{
                        flex: 1,
                        fontSize: '14px',
                        color: theme === 'dark' ? '#fff' : '#000',
                      }}
                    >
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {legend.position === 'left' && (
        <div style={legendStyle}>
          {levels.map((level, levelIdx) => (
            <div key={levelIdx} style={{ marginBottom: '0.5rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0' }}>Level {levelIdx + 1}</h4>
              {level.map((item) => {
                const sliceKey = `${levelIdx}-${item.label}`;
                const isActive = activeSlices.has(sliceKey);
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
                    onClick={() => handleSliceClick(levelIdx, item)}
                  >
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        backgroundColor: getLegendColor(levelIdx, item, level.indexOf(item)),
                        borderRadius: '2px',
                      }}
                    />
                    <span
                      style={{
                        flex: 1,
                        fontSize: '14px',
                        color: theme === 'dark' ? '#fff' : '#000',
                      }}
                    >
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {legend.position === 'right' && (
        <div style={legendStyle}>
          {levels.map((level, levelIdx) => (
            <div key={levelIdx} style={{ marginBottom: '0.5rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0' }}>Level {levelIdx + 1}</h4>
              {level.map((item) => {
                const sliceKey = `${levelIdx}-${item.label}`;
                const isActive = activeSlices.has(sliceKey);
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
                    onClick={() => handleSliceClick(levelIdx, item)}
                  >
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        backgroundColor: getLegendColor(levelIdx, item, level.indexOf(item)),
                        borderRadius: '2px',
                      }}
                    />
                    <span
                      style={{
                        flex: 1,
                        fontSize: '14px',
                        color: theme === 'dark' ? '#fff' : '#000',
                      }}
                    >
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
