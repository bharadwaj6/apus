/**
 * @file DonutChartRenderer.tsx
 * @description Renderer component for the DonutChart
 */
import React, { useEffect, useMemo } from 'react';
import { DonutChartData } from './types';
import { useTooltip } from '../hooks/useTooltip';
import type { LegendConfig, TooltipConfig } from '../types';
import { pieLayout, arcPath } from '../math';

interface DonutChartRendererProps {
  data: d3.PieArcDatum<DonutChartData>[];
  svgRef: React.RefObject<SVGSVGElement>;
  tooltipRef: React.RefObject<HTMLDivElement>;
  width: number;
  height: number;
  innerRadius: number;
  outerRadius: number;
  showTooltip: boolean;
  tooltip?: TooltipConfig;
  legend?: LegendConfig;
  centerLabel?: string;
  centerValue?: string | number;
  centerIcon?: React.ReactNode;
  extraCenterInfo?: React.ReactNode;
  onSliceClick?: (data: DonutChartData) => void;
  visibleLabels: string[];
  enableGlow?: boolean;
  glowColor?: string;
  glowBlur?: number;
}

const DonutChartRenderer: React.FC<DonutChartRendererProps> = ({
  data: arcData,
  width,
  height,
  innerRadius,
  outerRadius,
  showTooltip,
  tooltip,
  legend,
  centerLabel,
  centerValue,
  centerIcon,
  extraCenterInfo,
  onSliceClick,
  visibleLabels,
  enableGlow = false,
  glowColor,
  glowBlur = 5,
}) => {
  const total = useMemo(() => arcData.reduce((sum, d) => sum + d.data.value, 0), [arcData]);

  // New React-state tooltip (replaces old d3 + Ref version)
  const { showTooltip: showT, hideTooltip } = useTooltip(tooltip || {});

  // Zero-dep pie + arc (replaces d3.pie + d3.arc entirely)
  const slices = useMemo(() => {
    const raw = arcData.map((d) => d.data);
    return pieLayout(raw, (d) => d.value, 0, 2 * Math.PI);
  }, [arcData]);

  const getSlicePath = (start: number, end: number, r: number) =>
    arcPath(innerRadius, r, start, end);

  return (
    <g transform={`translate(${width / 2},${height / 2})`}>
      <defs>
        <filter id="donut-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.18" />
        </filter>
        <filter id="donut-shadow-strong" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.28" />
        </filter>
        {enableGlow && (
          <filter id="donut-glow" x="-50%" y="-50%" width="200%" height="200%">
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

      {/* Donut Arcs (Slices) — pure computed JSX */}
      {slices.map((slice, i) => {
        const d = slice.data;
        const percent = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0.0';
        const isVisible = visibleLabels.includes(d.label);
        const r = isVisible ? outerRadius : outerRadius; // keep simple, hover can be added via scale later

        return (
          <path
            key={d.label}
            d={getSlicePath(slice.startAngle, slice.endAngle, r) || undefined}
            fill={d.color || 'steelblue'}
            stroke="#fff"
            strokeWidth={3}
            cursor={onSliceClick || showTooltip ? 'pointer' : 'default'}
            pointerEvents="all"
            onMouseOver={
              showTooltip
                ? (e) => {
                    // Use client coords + new hook (replaces d3.pointer)
                    showT(
                      `<div style="min-width:120px"><strong>${d.label}</strong><div style="margin-top:4px">Value: ${d.value}<br/>${percent}%</div></div>`,
                      e
                    );
                  }
                : undefined
            }
            onMouseOut={showTooltip ? () => hideTooltip() : undefined}
            onClick={onSliceClick ? () => onSliceClick(d) : undefined}
            style={{ opacity: isVisible ? 1 : 0.4 }}
            filter={enableGlow ? 'url(#donut-glow)' : isVisible ? 'url(#donut-shadow)' : undefined}
          />
        );
      })}

      {/* Center Info Display */}
      {centerLabel && (total > 0 || centerValue !== undefined) && (
        <g textAnchor="middle" dominantBaseline="middle" pointerEvents="none">
          <text
            className="text-slate-700 dark:text-slate-300"
            style={{ fontSize: '32px', fontWeight: 'bold' }}
            y={extraCenterInfo ? -10 : 0}
          >
            {centerValue !== undefined ? centerValue : total.toFixed(0)}
          </text>
          {extraCenterInfo && (
            <text
              className="text-slate-500 dark:text-slate-400"
              style={{ fontSize: '14px' }}
              y={20}
            >
              {extraCenterInfo}
            </text>
          )}
          <text
            className="text-slate-500 dark:text-slate-400"
            style={{ fontSize: '16px' }}
            y={extraCenterInfo ? 38 : 24}
          >
            {centerLabel}
          </text>
        </g>
      )}

      {/* Labels (simplified, no d3.line/centroid — if legend not shown) */}
      {!legend?.show &&
        slices.map((slice) => {
          const d = slice.data;
          const mid = (slice.startAngle + slice.endAngle) / 2;
          const r = outerRadius * 1.15;
          const lx = Math.cos(mid - Math.PI / 2) * r;
          const ly = Math.sin(mid - Math.PI / 2) * r;
          const textAnchor = mid < Math.PI ? 'start' : 'end';
          const percent = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0.0';
          return (
            <g key={`label-${d.label}`}>
              <text
                x={lx}
                y={ly}
                textAnchor={textAnchor}
                dominantBaseline="middle"
                style={{ fontSize: legend?.itemFontSize || '12px', fill: legend?.itemColor || '#333', pointerEvents: 'none' }}
              >
                {d.label} ({percent}%)
              </text>
            </g>
          );
        })}
    </g>
  );
};

export default DonutChartRenderer;
