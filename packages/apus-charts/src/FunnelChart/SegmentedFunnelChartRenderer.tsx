import React, { useMemo } from 'react';
import {
  SegmentedFunnelChartProps,
  SegmentedFunnelStage,
  SegmentedFunnelSegment,
  TrendData,
  HistoricalData,
  SegmentAnalytics,
} from './types';

interface SegmentedFunnelChartRendererProps extends Omit<SegmentedFunnelChartProps, 'data'> {
  data: SegmentedFunnelStage[];
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  isDarkMode: boolean;
  tooltipBackgroundColor: string;
  tooltipTextColor: string;
  tooltipPadding: string;
  tooltipBorderRadius: string;
  tooltipFontSize: string;
  tooltipOffsetX: number;
  tooltipOffsetY: number;
  tooltipFormat?: (data: {
    stageLabel: string;
    segment: SegmentedFunnelSegment;
    totalStageValue: number;
  }) => string;
  tooltipSegmentFormat?: (data: {
    stageLabel: string;
    segment: SegmentedFunnelSegment;
    totalStageValue: number;
  }) => string;
  showTrendIndicators?: boolean;
  showMiniCharts?: boolean;
  showAnalytics?: boolean;
  miniChartHeight?: number;
  trendIndicatorSize?: number;
  analyticsDisplayMode?: 'tooltip' | 'inline' | 'both';
  // New tooltip callbacks (replaces internal D3 tooltip)
  onShowTooltip?: (content: string, event: React.MouseEvent | MouseEvent) => void;
  onHideTooltip?: () => void;
}

const SegmentedFunnelChartRenderer: React.FC<SegmentedFunnelChartRendererProps> = ({
  data,
  width,
  height,
  margin,
  showValues,
  valueFormat,
  onSliceClick,
  tooltipBackgroundColor,
  tooltipTextColor,
  tooltipPadding,
  tooltipBorderRadius,
  tooltipFontSize,
  tooltipOffsetX,
  tooltipOffsetY,
  tooltipSegmentFormat,
  isDarkMode,
  enableGradients = false,
  gradientDirection = 'vertical',
  segmentShadowColor = 'rgba(0,0,0,0.2)',
  segmentShadowBlur = 5,
  segmentShadowOffsetX = 0,
  segmentShadowOffsetY = 5,
  showTrendIndicators = true,
  showMiniCharts = true,
  showAnalytics = true,
  miniChartHeight = 30,
  trendIndicatorSize = 12,
  analyticsDisplayMode = 'tooltip',
  onShowTooltip,
  onHideTooltip,
}) => {
  // Stable filter id for shadow (pure, no ref mutation)
  const filterId = useMemo(
    () => `segmented-funnel-shadow-${Math.random().toString(36).substring(7)}`,
    [],
  );

  // Pure helper to replace d3.color().darker()
  const getDarkerColor = (color: string | undefined): string => {
    if (!color) return '#666666';
    if (color.startsWith('#') && color.length === 7) {
      const r = Math.floor(parseInt(color.slice(1, 3), 16) * 0.5);
      const g = Math.floor(parseInt(color.slice(3, 5), 16) * 0.5);
      const b = Math.floor(parseInt(color.slice(5, 7), 16) * 0.5);
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    return color;
  };

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const stageHeight = data.length > 0 ? innerHeight / data.length : 0;

  // Pure computed stage totals (no d3.sum / scales)
  const stageTotals = data.map((stage) =>
    stage.segments.reduce((sum, s) => sum + (s.value || 0), 0),
  );

  const buildTooltipContent = (
    stage: SegmentedFunnelStage,
    segmentData: SegmentedFunnelSegment,
    totalStageValue: number,
  ): string => {
    if (tooltipSegmentFormat) {
      return tooltipSegmentFormat({
        stageLabel: stage.label,
        segment: segmentData,
        totalStageValue,
      });
    }
    const valStr = valueFormat ? valueFormat(segmentData.value) : segmentData.value.toString();
    const trendHtml = segmentData.trend
      ? `
      <div style="color: ${segmentData.trend.change >= 0 ? '#4CAF50' : '#F44336'}">
        ${segmentData.trend.change >= 0 ? '↑' : '↓'} ${Math.abs(segmentData.trend.changePercentage).toFixed(1)}%
      </div>`
      : '';
    const analyticsHtml =
      segmentData.analytics && analyticsDisplayMode !== 'inline'
        ? `
      <div style="margin-top: 8px; border-top: 1px solid ${isDarkMode ? '#4a5568' : '#e2e8f0'}; padding-top: 8px;">
        <div>Conversion Rate: ${segmentData.analytics.performance.conversionRate.toFixed(1)}%</div>
        <div>Contribution: ${segmentData.analytics.contribution.percentageOfTotal.toFixed(1)}%</div>
        <div>Correlation: ${segmentData.analytics.correlation.correlationScore.toFixed(2)}</div>
      </div>`
        : '';
    return `
      <div>
        <div style="font-weight: bold; color: ${segmentData.color || (isDarkMode ? '#a8dadc' : '#4287f5')};">${stage.label}</div>
        <div>${segmentData.channel}: <span style="font-weight: bold;">${valStr}</span></div>
        ${trendHtml}
        ${analyticsHtml}
      </div>
    `;
  };

  return (
    <div
      style={{
        width,
        height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <svg width={width} height={height} style={{ display: 'block' }}>
        <defs>
          <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow
              dx={segmentShadowOffsetX}
              dy={segmentShadowOffsetY}
              stdDeviation={segmentShadowBlur}
              floodColor={segmentShadowColor}
            />
          </filter>
          {enableGradients &&
            data.map((stage, stageIndex) =>
              stage.segments.map((segmentData, segmentIndex) => {
                if (!segmentData.color) return null;
                const gradientId = `gradient-${stage.label.replace(/[^a-zA-Z0-9-_]/g, '')}-${segmentData.channel.replace(/[^a-zA-Z0-9-_]/g, '')}-${stageIndex}-${segmentIndex}`;
                const darker = getDarkerColor(segmentData.color);
                return (
                  <linearGradient
                    key={gradientId}
                    id={gradientId}
                    x1={gradientDirection === 'horizontal' ? '0%' : '0%'}
                    y1={gradientDirection === 'horizontal' ? '0%' : '0%'}
                    x2={gradientDirection === 'horizontal' ? '100%' : '0%'}
                    y2={gradientDirection === 'horizontal' ? '0%' : '100%'}
                  >
                    <stop offset="0%" stopColor={darker} />
                    <stop offset="100%" stopColor={segmentData.color} />
                  </linearGradient>
                );
              }),
            )}
        </defs>
        <g transform={`translate(${margin.left},${margin.top})`}>
          {data.map((stage, stageIndex) => {
            const totalStageValue = stageTotals[stageIndex] || 0;
            const barY = stageIndex * stageHeight;
            let currentX = 0;
            return (
              <g key={`stage-${stageIndex}`}>
                {stage.segments.map((segmentData, segmentIndex) => {
                  const segW =
                    totalStageValue > 0 ? (segmentData.value / totalStageValue) * innerWidth : 0;
                  const fill =
                    enableGradients && segmentData.color
                      ? `url(#gradient-${stage.label.replace(/[^a-zA-Z0-9-_]/g, '')}-${segmentData.channel.replace(/[^a-zA-Z0-9-_]/g, '')}-${stageIndex}-${segmentIndex})`
                      : segmentData.color ||
                        `hsl(${(stageIndex * 50 + segmentIndex * 20) % 360}, 70%, 50%)`;

                  const tooltipContent = buildTooltipContent(stage, segmentData, totalStageValue);

                  const segChildren: React.ReactNode[] = [
                    <rect
                      key="rect"
                      x={currentX}
                      y={barY}
                      width={Math.max(0, segW)}
                      height={stageHeight}
                      fill={fill}
                      stroke="#fff"
                      strokeWidth={1}
                      style={{
                        cursor: onSliceClick ? 'pointer' : 'default',
                        filter: `url(#${filterId})`,
                      }}
                      onClick={() => {
                        if (onSliceClick) {
                          onSliceClick({
                            stageLabel: stage.label,
                            segment: segmentData,
                            totalStageValue,
                          });
                        }
                      }}
                      onMouseEnter={(e) => {
                        if (onShowTooltip) onShowTooltip(tooltipContent, e);
                      }}
                      onMouseLeave={() => {
                        if (onHideTooltip) onHideTooltip();
                      }}
                    />,
                  ];

                  // Trend indicator (JSX, replaces d3 append path/text)
                  if (showTrendIndicators && segmentData.trend) {
                    const tx = currentX + segW - trendIndicatorSize - 20;
                    const ty = barY + 5;
                    const arrowColor = segmentData.trend.change >= 0 ? '#4CAF50' : '#F44336';
                    const arrowD =
                      segmentData.trend.change >= 0
                        ? `M 0 ${trendIndicatorSize} L ${trendIndicatorSize / 2} 0 L ${trendIndicatorSize} ${trendIndicatorSize}`
                        : `M 0 0 L ${trendIndicatorSize / 2} ${trendIndicatorSize} L ${trendIndicatorSize} 0`;
                    segChildren.push(
                      <g key="trend" transform={`translate(${tx},${ty})`}>
                        <path d={arrowD} fill={arrowColor} />
                        <text
                          x={trendIndicatorSize + 4}
                          y={trendIndicatorSize / 2}
                          dominantBaseline="middle"
                          fill={arrowColor}
                          fontSize="10px"
                        >
                          {Math.abs(segmentData.trend.changePercentage).toFixed(1)}%
                        </text>
                      </g>,
                    );
                  }

                  // Mini chart: pure computed polyline (no d3.scaleTime/line)
                  if (
                    showMiniCharts &&
                    segmentData.historicalData &&
                    segmentData.historicalData.length >= 2
                  ) {
                    const hist = segmentData.historicalData;
                    const minT = Math.min(...hist.map((d) => d.timestamp));
                    const maxT = Math.max(...hist.map((d) => d.timestamp));
                    const minV = Math.min(...hist.map((d) => d.value));
                    const maxV = Math.max(...hist.map((d) => d.value));
                    const plotW = Math.max(1, segW - 10);
                    const plotH = miniChartHeight;
                    const baseX = currentX + 5;
                    const baseY = barY + stageHeight - 5 - miniChartHeight;
                    const pts = hist
                      .map((d) => {
                        const tden = maxT - minT || 1;
                        const vden = maxV - minV || 1;
                        const px = baseX + ((d.timestamp - minT) / tden) * plotW;
                        const py = baseY + plotH - ((d.value - minV) / vden) * plotH;
                        return `${px},${py}`;
                      })
                      .join(' ');
                    segChildren.push(
                      <polyline
                        key="mini"
                        points={pts}
                        fill="none"
                        stroke={isDarkMode ? '#a8dadc' : '#4287f5'}
                        strokeWidth={1.5}
                      />,
                    );
                  }

                  // Analytics inline (JSX, replaces d3 appends)
                  if (
                    showAnalytics &&
                    segmentData.analytics &&
                    analyticsDisplayMode !== 'tooltip'
                  ) {
                    const ax = currentX + 5;
                    const ay = barY + 5;
                    segChildren.push(
                      <g
                        key="analytics"
                        transform={`translate(${ax},${ay})`}
                        data-testid="analytics-group"
                      >
                        <text x={0} y={0} fill={isDarkMode ? '#e2e8f0' : '#1a202c'} fontSize="10px">
                          {`Conv: ${segmentData.analytics.performance.conversionRate.toFixed(1)}%`}
                        </text>
                        <text
                          x={0}
                          y={15}
                          fill={isDarkMode ? '#e2e8f0' : '#1a202c'}
                          fontSize="10px"
                        >
                          {`Cont: ${segmentData.analytics.contribution.percentageOfTotal.toFixed(1)}%`}
                        </text>
                        {segmentData.analytics.correlation.correlationScore > 0.7 && (
                          <circle cx={50} cy={7} r={4} fill="#4CAF50" />
                        )}
                      </g>,
                    );
                  }

                  const node = (
                    <g key={`seg-${segmentIndex}`} className="funnel-segment">
                      {segChildren}
                    </g>
                  );
                  currentX += segW;
                  return node;
                })}
                {showValues && totalStageValue > 0 && (
                  <text
                    key="label"
                    x={innerWidth / 2}
                    y={barY + stageHeight / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={isDarkMode ? '#e2e8f0' : '#1a202c'}
                    fontSize="14px"
                    pointerEvents="none"
                  >
                    {`${stage.label}: ${valueFormat ? valueFormat(totalStageValue) : totalStageValue.toLocaleString()}`}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};

export default SegmentedFunnelChartRenderer;
