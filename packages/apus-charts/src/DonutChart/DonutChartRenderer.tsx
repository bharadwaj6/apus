/**
 * @file DonutChartRenderer.tsx
 * @description Renderer component for the DonutChart
 */
import React, { useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import { DonutChartData } from './types';
import { useTooltip } from '../hooks/useTooltip';
import type { LegendConfig, TooltipConfig } from '../types';

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

  const { showTooltip: showT, hideTooltip, applyTooltipStyles } = useTooltip(tooltipRef, tooltip || {});

  useEffect(() => {
    applyTooltipStyles();
  }, [applyTooltipStyles]);

  const arc = useMemo(
    () =>
      d3
        .arc<d3.PieArcDatum<DonutChartData>>()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius)
        .cornerRadius(12)
        .padAngle(0.025),
    [innerRadius, outerRadius],
  );

  const hoverArc = useMemo(
    () =>
      d3
        .arc<d3.PieArcDatum<DonutChartData>>()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius * 1.06)
        .cornerRadius(12)
        .padAngle(0.025),
    [innerRadius, outerRadius],
  );

  const outerArc = useMemo(
    () =>
      d3
        .arc<d3.PieArcDatum<DonutChartData>>()
        .innerRadius(outerRadius * 0.9)
        .outerRadius(outerRadius * 0.9),
    [outerRadius],
  );

  const labelArc = useMemo(
    () =>
      d3
        .arc<d3.PieArcDatum<DonutChartData>>()
        .innerRadius(outerRadius * 1.1)
        .outerRadius(outerRadius * 1.1),
    [outerRadius],
  );

  const polylineGenerator = useMemo(() => d3.line<[number, number]>().curve(d3.curveNatural), []);

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

      {/* Donut Arcs (Slices) */}
      {arcData.map((d) => {
        const percent = total > 0 ? ((d.data.value / total) * 100).toFixed(1) : '0.0';
        const isVisible = visibleLabels.includes(d.data.label);

        return (
          <path
            key={d.data.label}
            d={arc(d) || undefined}
            fill={d.data.color || 'steelblue'}
            stroke="#fff"
            strokeWidth={3}
            cursor={onSliceClick || showTooltip ? 'pointer' : 'default'}
            pointerEvents="all"
            onMouseOver={
              showTooltip
                ? (e) => {
                    const [pointerX, pointerY] = d3.pointer(e);
                    showT(
                      `<div style="min-width:120px"><strong>${d.data.label}</strong><div style="margin-top:4px">Value: ${d.data.value}<br/>${percent}%</div></div>`,
                      pointerX,
                      pointerY - 10,
                    );
                  }
                : undefined
            }
            onMouseOut={showTooltip ? () => hideTooltip() : undefined}
            onClick={onSliceClick ? () => onSliceClick(d.data) : undefined}
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

      {/* Polylines and Labels (if legend is not shown) */}
      {!legend?.show &&
        arcData.map((d) => {
          const [arcX, arcY] = labelArc.centroid(d);
          const midangle = d.startAngle + (d.endAngle - d.startAngle) / 2;
          const textAnchor = midangle < Math.PI ? 'start' : 'end';
          const polylinePoints: [number, number][] = [
            arc.centroid(d) as [number, number],
            outerArc.centroid(d) as [number, number],
            [arcX + (midangle < Math.PI ? 40 : -40), arcY],
          ];
          const labelX = arcX + (midangle < Math.PI ? 45 : -45);
          const labelY = arcY;
          return (
            <g key={`label-${d.data.label}`}>
              <polyline
                points={polylineGenerator(polylinePoints) || undefined}
                style={{
                  fill: 'none',
                  stroke: legend?.itemColor || '#666',
                  strokeWidth: 1,
                }}
              />
              <text
                transform={`translate(${labelX},${labelY})`}
                textAnchor={textAnchor}
                dominantBaseline="middle"
                style={{ fontSize: legend?.itemFontSize || '12px', fill: legend?.itemColor || '#333', pointerEvents: 'none' }}
              >
                {d.data.label} ({total > 0 ? ((d.data.value / total) * 100).toFixed(1) : '0.0'}%)
              </text>
            </g>
          );
        })}
    </g>
  );
};

export default DonutChartRenderer;
