import React from 'react';
import type { BandScale, LinearScale } from '../math/scales';

interface XAxisProps {
  scale: BandScale | LinearScale;
  innerHeight: number;
  ticks?: Array<string | number>;
  textColor?: string;
  lineColor?: string;
  fontSize?: number;
}

interface YAxisProps {
  scale: LinearScale;
  innerWidth: number;
  tickCount?: number;
  textColor?: string;
  lineColor?: string;
  fontSize?: number;
}

export function XAxis({
  scale,
  innerHeight,
  ticks,
  textColor = '#666',
  lineColor = '#ccc',
  fontSize = 12,
}: XAxisProps) {
  const isBand = 'bandwidth' in scale;
  const tickValues = ticks ?? (isBand ? (scale as BandScale).domain() : (scale as LinearScale).ticks(5));
  const rangeEnd = scale.range()[1];

  return (
    <g transform={`translate(0,${innerHeight})`}>
      <line x1={0} x2={rangeEnd} stroke={lineColor} />
      {tickValues.map((tick, i) => {
        const x = isBand
          ? (scale as BandScale)(String(tick)) + (scale as BandScale).bandwidth() / 2
          : (scale as LinearScale)(Number(tick));
        return (
          <g key={i} transform={`translate(${x},0)`}>
            <line y2={6} stroke={lineColor} />
            <text y={20} textAnchor="middle" fill={textColor} fontSize={fontSize}>
              {String(tick)}
            </text>
          </g>
        );
      })}
    </g>
  );
}

export function YAxis({
  scale,
  innerWidth,
  tickCount = 5,
  textColor = '#666',
  lineColor = '#ccc',
  fontSize = 12,
}: YAxisProps) {
  const tickValues = scale.ticks(tickCount);
  return (
    <g>
      <line y1={scale.range()[0]} y2={scale.range()[1]} stroke={lineColor} />
      {tickValues.map((tick, i) => (
        <g key={i} transform={`translate(0,${scale(tick)})`}>
          <line x1={-6} x2={innerWidth} stroke={lineColor} strokeOpacity={0.3} />
          <text x={-10} textAnchor="end" dominantBaseline="middle" fill={textColor} fontSize={fontSize}>
            {tick}
          </text>
        </g>
      ))}
    </g>
  );
}
