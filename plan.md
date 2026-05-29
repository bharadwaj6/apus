# Apus: Zero-Dependency Rewrite + pnpm Migration

**This plan is designed for autonomous execution by an agent. Every step is explicit and verifiable. No human input is required.**

---

## Context and Goals

Apus is a React chart library that wraps D3.js. The goal is to:

1. **Remove all D3 dependencies** — rewrite with pure math utilities (~620 lines) replacing every D3 function used
2. **Remove `@heroicons/react`** from the chart library (it is only used in the demo app's Header)
3. **Migrate from npm to pnpm** workspace management
4. **Convert all renderers** from DOM-mutation (`useEffect + d3.select`) to computed-values (pure JSX SVG)
5. **Refactor tooltip** from D3-imperative to React state

After this: `peerDependencies: { react, react-dom }`. Zero other deps. SSR-safe. Concurrent mode safe.

---

## Repository Structure

```
/                                    ← root (monorepo)
├── package.json                     ← has npm workspaces, d3/heroicons in deps — fix this
├── package-lock.json                ← DELETE
├── .github/workflows/deploy.yml     ← UPDATE to pnpm
├── packages/
│   ├── apus-charts/                 ← the library (published as "apus")
│   │   ├── package.json             ← has d3, d3-regression, @heroicons — all wrong
│   │   ├── vite.config.ts           ← d3/@heroicons in externals — clean up
│   │   └── src/
│   │       ├── math/                ← CREATE with utility files
│   │       ├── components/          ← CREATE Axis.tsx and Tooltip.tsx
│   │       ├── hooks/useTooltip.ts  ← REWRITE
│   │       ├── utils/chartUtils.ts  ← REMOVE d3 import
│   │       └── [all chart dirs]    ← CONVERT each *Renderer.tsx
│   └── apus-demo/
│       └── package.json             ← ADD @heroicons/react here
└── fix-props.cjs                    ← leave untouched
```

---

## Pre-Flight: Read These Files Before Starting

Read all of these before writing any code:

- `packages/apus-charts/src/hooks/useTooltip.ts`
- `packages/apus-charts/src/utils/chartUtils.ts`
- `packages/apus-charts/src/BarChart/BarChartRenderer.tsx`
- `packages/apus-charts/src/LineChart/LineChartRenderer.tsx`
- `packages/apus-charts/src/DonutChart/DonutChartRenderer.tsx`
- `packages/apus-charts/src/StackedBarChart/StackedBarChartRenderer.tsx`
- `packages/apus-charts/src/RadarChart/RadarChartRenderer.tsx`
- `packages/apus-charts/src/RangeChart/RangeChartRenderer.tsx`
- `packages/apus-charts/src/GaugeDonutChart/GaugeDonutChartRenderer.tsx`
- `packages/apus-charts/src/NestedDonutChart/NestedDonutChartRenderer.tsx`
- `packages/apus-charts/src/FunnelChart/FunnelChartRenderer.tsx`
- `packages/apus-charts/src/FunnelChart/SegmentedFunnelChartRenderer.tsx`
- `packages/apus-charts/src/ScatterChart/ScatterChartRenderer.tsx`

---

## D3 Removal Inventory

Every D3 call in the codebase and its replacement:

| D3 API | Uses | Replacement |
|--------|------|-------------|
| `d3.select` | 17 | Removed — React renders SVG |
| `d3.pointer` | 16 | `event.clientX/Y` + `getBoundingClientRect()` |
| `d3.axisBottom`, `d3.axisLeft` | 4+4 | JSX `<XAxis>`, `<YAxis>` components |
| `d3.scaleBand` | 3 | `bandScale()` |
| `d3.scaleLinear` | 5 | `linearScale()` |
| `d3.scaleOrdinal` | 4 | `ordinalScale()` |
| `d3.scalePoint` | 1 | `pointScale()` |
| `d3.scaleTime` | 1 | `timeScale()` |
| `d3.scaleSqrt` | 1 | `sqrtScale()` |
| `d3.scaleLog` | 1 | `logScale()` |
| `d3.max`, `d3.min` | 10+5 | `maxOf()`, `minOf()` |
| `d3.extent` | 3 | `extentOf()` |
| `d3.sum` | 1 | `sumOf()` |
| `d3.stack` | 1 | `stackLayout()` |
| `d3.line` + curves | 1+3 | `linePath()` with monotone cubic |
| `d3.area` | 1 | `areaPath()` |
| `lineRadial + curveCardinalClosed` (d3-shape) | 1+1 | `radialLinePath()` |
| `d3.pie` | 3 | `pieLayout()` |
| `d3.arc` | (via donut renderers) | `arcPath()` |
| `d3.schemeCategory10/Set2/Tableau10` | 9 | Hardcoded constant arrays |
| `d3.color()` | 3 | `hexWithOpacity()` |
| `d3Regression.regressionLinear()` | 1 | `linearRegression()` OLS |

---

## Phase 1 — pnpm Migration

**Commit: `chore: migrate workspace from npm to pnpm`**

### 1.1 Install pnpm if not present
```bash
which pnpm || npm install -g pnpm
```

### 1.2 Create `pnpm-workspace.yaml` at repo root
```yaml
packages:
  - 'packages/*'
```

### 1.3 Update root `package.json`

Remove the `"workspaces"` field (pnpm uses `pnpm-workspace.yaml` instead).

Replace all scripts:
```json
"scripts": {
  "dev": "vite",
  "build:lib": "pnpm --filter apus run build",
  "build:app-demo": "pnpm --filter apus-demo run build",
  "dev:demo": "pnpm --filter apus-demo run styleguide",
  "build:demo": "pnpm --filter apus-demo run styleguide:build",
  "deploy:styleguide": "pnpm run build:demo && pnpm --filter apus-demo run deploy",
  "lint": "eslint .",
  "preview": "vite preview",
  "prepare": "husky",
  "test": "pnpm --filter apus run test"
}
```

Remove `"d3"` and `"@heroicons/react"` from root `dependencies`.
Remove `"d3"` from root `peerDependencies`.
Remove `"d3"` from root `keywords`.

### 1.4 Update `.github/workflows/deploy.yml`

Replace node/install steps with:
```yaml
- name: Set up Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20.x'

- name: Install pnpm
  uses: pnpm/action-setup@v4
  with:
    version: 9

- name: Install dependencies
  run: pnpm install --frozen-lockfile

- name: Build Styleguidist
  run: pnpm run build:demo
```

### 1.5 Delete `package-lock.json`
```bash
rm package-lock.json
```

### 1.6 Install with pnpm
```bash
pnpm install
```

### 1.7 Verify
```bash
pnpm run test
```
All tests must pass before continuing.

---

## Phase 2 — Math Utilities

**Commit: `feat: add zero-dep math utilities to replace D3`**

Create `packages/apus-charts/src/math/` directory with these files:

### `src/math/array.ts`

```typescript
export function maxOf<T>(arr: T[], accessor: (d: T) => number = (d) => d as unknown as number): number {
  return arr.reduce((m, d) => Math.max(m, accessor(d)), -Infinity);
}

export function minOf<T>(arr: T[], accessor: (d: T) => number = (d) => d as unknown as number): number {
  return arr.reduce((m, d) => Math.min(m, accessor(d)), Infinity);
}

export function extentOf<T>(
  arr: T[],
  accessor: (d: T) => number = (d) => d as unknown as number
): [number, number] {
  return [minOf(arr, accessor), maxOf(arr, accessor)];
}

export function sumOf<T>(arr: T[], accessor: (d: T) => number = (d) => d as unknown as number): number {
  return arr.reduce((s, d) => s + accessor(d), 0);
}

export type StackedPoint<T> = [number, number] & { data: T };
export type StackedSeries<T> = StackedPoint<T>[] & { key: string; index: number };

// Equivalent to d3.stack() — accumulates values per row across keys
export function stackLayout<T extends Record<string, unknown>>(
  keys: string[],
  data: T[]
): StackedSeries<T>[] {
  return keys.map((key, keyIndex) => {
    const series = data.map((row) => {
      const baseline = keys
        .slice(0, keyIndex)
        .reduce((sum, k) => sum + ((row[k] as number) || 0), 0);
      const value = (row[key] as number) || 0;
      const point = [baseline, baseline + value] as StackedPoint<T>;
      point.data = row;
      return point;
    });
    return Object.assign(series, { key, index: keyIndex }) as StackedSeries<T>;
  });
}
```

### `src/math/scales.ts`

```typescript
export interface BandScale {
  (value: string): number;
  bandwidth(): number;
  step(): number;
  domain(): string[];
  range(): [number, number];
}

export interface LinearScale {
  (value: number): number;
  domain(): [number, number];
  range(): [number, number];
  ticks(count?: number): number[];
  invert(value: number): number;
}

export interface OrdinalScale<T> {
  (value: string): T;
  domain(): string[];
  range(): T[];
}

// Matches D3 scaleBand behavior
export function bandScale(
  domain: string[],
  range: [number, number],
  paddingInner = 0.1,
  paddingOuter = 0.05
): BandScale {
  const n = domain.length;
  const step = (range[1] - range[0]) / Math.max(1, n - paddingInner + 2 * paddingOuter);
  const bw = step * (1 - paddingInner);
  const positions = new Map(domain.map((d, i) => [d, range[0] + step * (paddingOuter + i)]));
  const fn = (value: string) => positions.get(value) ?? 0;
  fn.bandwidth = () => bw;
  fn.step = () => step;
  fn.domain = () => [...domain];
  fn.range = () => [...range] as [number, number];
  return fn as BandScale;
}

export function linearScale(domain: [number, number], range: [number, number]): LinearScale {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const factor = d1 === d0 ? 0 : (r1 - r0) / (d1 - d0);
  const fn = (value: number) => r0 + (value - d0) * factor;
  fn.domain = () => [...domain] as [number, number];
  fn.range = () => [...range] as [number, number];
  fn.invert = (output: number) => (factor === 0 ? d0 : d0 + (output - r0) / factor);
  fn.ticks = (count = 5): number[] => {
    const step = (d1 - d0) / count;
    return Array.from({ length: count + 1 }, (_, i) => d0 + i * step);
  };
  return fn as LinearScale;
}

export function ordinalScale<T>(domain: string[], range: T[]): OrdinalScale<T> {
  const map = new Map(domain.map((d, i) => [d, range[i % range.length]]));
  const fn = (value: string): T => map.get(value) ?? range[0];
  fn.domain = () => [...domain];
  fn.range = () => [...range];
  return fn as OrdinalScale<T>;
}

// Point scale — bandwidth is 0, used for line/scatter x-axes
export function pointScale(domain: string[], range: [number, number], padding = 0.5): BandScale {
  const n = domain.length;
  const step = n <= 1 ? 0 : (range[1] - range[0]) / (n - 1 + 2 * padding);
  const positions = new Map(
    domain.map((d, i) => [d, n <= 1 ? (range[0] + range[1]) / 2 : range[0] + step * (padding + i)])
  );
  const fn = (value: string) => positions.get(value) ?? 0;
  fn.bandwidth = () => 0;
  fn.step = () => step;
  fn.domain = () => [...domain];
  fn.range = () => [...range] as [number, number];
  return fn as BandScale;
}

// Time scale — pass date.getTime() as input values
export function timeScale(domain: [Date, Date], range: [number, number]): LinearScale {
  return linearScale([domain[0].getTime(), domain[1].getTime()], range);
}

export function sqrtScale(domain: [number, number], range: [number, number]): LinearScale {
  const linear = linearScale(
    [Math.sqrt(Math.max(0, domain[0])), Math.sqrt(Math.max(0, domain[1]))],
    range
  );
  const fn = (value: number) => linear(Math.sqrt(Math.max(0, value)));
  fn.domain = linear.domain;
  fn.range = linear.range;
  fn.invert = (output: number) => Math.pow(linear.invert(output), 2);
  fn.ticks = (count = 5) => linear.ticks(count).map((t) => t * t);
  return fn as LinearScale;
}

export function logScale(
  domain: [number, number],
  range: [number, number],
  base = 10
): LinearScale {
  const logBase = Math.log(base);
  const log = (v: number) => Math.log(Math.max(1e-10, v)) / logBase;
  const linear = linearScale([log(domain[0]), log(domain[1])], range);
  const fn = (value: number) => linear(log(value));
  fn.domain = linear.domain;
  fn.range = linear.range;
  fn.invert = (output: number) => Math.pow(base, linear.invert(output));
  fn.ticks = (count = 5): number[] => {
    const ticks: number[] = [];
    for (let p = Math.ceil(log(domain[0])); p <= Math.floor(log(domain[1])); p++) {
      ticks.push(Math.pow(base, p));
    }
    return ticks.length > 0 ? ticks : linear.ticks(count).map((t) => Math.pow(base, t));
  };
  return fn as LinearScale;
}
```

### `src/math/colors.ts`

```typescript
export const CATEGORY_10 = [
  '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
  '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
];

export const TABLEAU_10 = [
  '#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f',
  '#edc948', '#b07aa1', '#ff9da7', '#9c755f', '#bab0ac',
];

export const SET_2 = [
  '#66c2a5', '#fc8d62', '#8da0cb', '#e78ac3',
  '#a6d854', '#ffd92f', '#e5c494', '#b3b3b3',
];

export function hexWithOpacity(hex: string, opacity: number): string {
  const clean = hex.startsWith('#') ? hex.slice(1) : hex;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}
```

### `src/math/regression.ts`

```typescript
export interface RegressionResult {
  slope: number;
  intercept: number;
  rSquared: number;
  predict: (x: number) => number;
  points: [number, number][]; // [x, predicted_y] pairs spanning the data extent
}

export function linearRegression(
  data: [number, number][],
  xExtent?: [number, number]
): RegressionResult {
  const n = data.length;
  if (n < 2) {
    return { slope: 0, intercept: 0, rSquared: 0, predict: () => 0, points: [] };
  }

  const sumX = data.reduce((s, [x]) => s + x, 0);
  const sumY = data.reduce((s, [, y]) => s + y, 0);
  const sumXY = data.reduce((s, [x, y]) => s + x * y, 0);
  const sumXX = data.reduce((s, [x]) => s + x * x, 0);
  const meanY = sumY / n;

  const denom = n * sumXX - sumX * sumX;
  const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  const predict = (x: number) => slope * x + intercept;

  const ssTot = data.reduce((s, [, y]) => s + Math.pow(y - meanY, 2), 0);
  const ssRes = data.reduce((s, [x, y]) => s + Math.pow(y - predict(x), 2), 0);
  const rSquared = ssTot === 0 ? 1 : 1 - ssRes / ssTot;

  const x0 = xExtent?.[0] ?? data[0][0];
  const x1 = xExtent?.[1] ?? data[n - 1][0];
  const points: [number, number][] = [
    [x0, predict(x0)],
    [x1, predict(x1)],
  ];

  return { slope, intercept, rSquared, predict, points };
}
```

### `src/math/paths.ts`

```typescript
type Point = [number, number];

function linearPathStr(points: Point[]): string {
  if (points.length === 0) return '';
  return 'M' + points[0].join(',') + points.slice(1).map((p) => 'L' + p.join(',')).join('');
}

// Fritsch-Carlson monotone cubic spline (matches d3.curveMonotoneX)
function monotoneCubicPath(points: Point[]): string {
  const n = points.length;
  if (n < 2) return points.length === 1 ? `M${points[0].join(',')}` : '';
  if (n === 2) return linearPathStr(points);

  const dx = points.map((p, i) => (i < n - 1 ? points[i + 1][0] - p[0] : 0));
  const dy = points.map((p, i) => (i < n - 1 ? points[i + 1][1] - p[1] : 0));
  const slopes = dx.map((d, i) => (d === 0 ? 0 : dy[i] / d));

  const m: number[] = new Array(n);
  m[0] = slopes[0];
  m[n - 1] = slopes[n - 2];

  for (let i = 1; i < n - 1; i++) {
    if (slopes[i - 1] * slopes[i] <= 0) {
      m[i] = 0;
    } else {
      const h0 = dx[i - 1];
      const h1 = dx[i];
      const w = (2 * h1 + h0) / (3 * (h1 + h0));
      m[i] = 1 / (w / slopes[i - 1] + (1 - w) / slopes[i]);
    }
  }

  for (let i = 0; i < n - 1; i++) {
    const s = slopes[i];
    if (s === 0) {
      m[i] = m[i + 1] = 0;
      continue;
    }
    const a = m[i] / s;
    const b = m[i + 1] / s;
    if (a * a + b * b > 9) {
      const tau = 3 / Math.sqrt(a * a + b * b);
      m[i] = tau * a * s;
      m[i + 1] = tau * b * s;
    }
  }

  let path = `M${points[0].join(',')}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const h = dx[i];
    path += `C${x0 + h / 3},${y0 + (m[i] * h) / 3},${x1 - h / 3},${y1 - (m[i + 1] * h) / 3},${x1},${y1}`;
  }
  return path;
}

export type CurveType = 'monotone' | 'linear';

export function linePath<T>(
  data: T[],
  x: (d: T) => number,
  y: (d: T) => number,
  curve: CurveType = 'monotone',
  defined: (d: T) => boolean = () => true
): string {
  const points: Point[] = data.filter(defined).map((d) => [x(d), y(d)]);
  return curve === 'linear' ? linearPathStr(points) : monotoneCubicPath(points);
}

export function areaPath<T>(
  data: T[],
  x: (d: T) => number,
  y0: (d: T) => number,
  y1: (d: T) => number,
  curve: CurveType = 'monotone'
): string {
  if (data.length === 0) return '';
  const topPoints: Point[] = data.map((d) => [x(d), y1(d)]);
  const bottomPoints: Point[] = data.map((d) => [x(d), y0(d)]).reverse();
  const topPath = curve === 'linear' ? linearPathStr(topPoints) : monotoneCubicPath(topPoints);
  return topPath + bottomPoints.map((p) => `L${p.join(',')}`).join('') + 'Z';
}

export function arcPath(
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number
): string {
  const cos = (a: number) => Math.cos(a - Math.PI / 2);
  const sin = (a: number) => Math.sin(a - Math.PI / 2);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

  if (innerRadius <= 0) {
    return [
      `M ${outerRadius * cos(startAngle)} ${outerRadius * sin(startAngle)}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerRadius * cos(endAngle)} ${outerRadius * sin(endAngle)}`,
      'L 0 0 Z',
    ].join(' ');
  }

  return [
    `M ${outerRadius * cos(startAngle)} ${outerRadius * sin(startAngle)}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerRadius * cos(endAngle)} ${outerRadius * sin(endAngle)}`,
    `L ${innerRadius * cos(endAngle)} ${innerRadius * sin(endAngle)}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerRadius * cos(startAngle)} ${innerRadius * sin(startAngle)}`,
    'Z',
  ].join(' ');
}

export interface PieSlice<T> {
  data: T;
  value: number;
  startAngle: number;
  endAngle: number;
  index: number;
}

export function pieLayout<T>(
  data: T[],
  value: (d: T) => number,
  startAngle = 0,
  endAngle = 2 * Math.PI
): PieSlice<T>[] {
  const total = data.reduce((sum, d) => sum + value(d), 0);
  const range = endAngle - startAngle;
  let current = startAngle;
  return data.map((d, index) => {
    const v = value(d);
    const sliceAngle = total === 0 ? 0 : (v / total) * range;
    const slice = { data: d, value: v, startAngle: current, endAngle: current + sliceAngle, index };
    current += sliceAngle;
    return slice;
  });
}

// For RadarChart — [angle, radius] pairs → closed SVG polygon path
export function radialLinePath(data: Array<[number, number]>, closed = true): string {
  const cos = (a: number) => Math.cos(a - Math.PI / 2);
  const sin = (a: number) => Math.sin(a - Math.PI / 2);
  const points: Point[] = data.map(([angle, radius]) => [cos(angle) * radius, sin(angle) * radius]);
  if (points.length === 0) return '';
  const path =
    'M' + points[0].join(',') + points.slice(1).map((p) => 'L' + p.join(',')).join('');
  return closed ? path + 'Z' : path;
}
```

### `src/math/index.ts`

```typescript
export * from './array';
export * from './scales';
export * from './colors';
export * from './regression';
export * from './paths';
```

---

## Phase 3 — JSX Axis and Tooltip Components

**Commit: `feat: add JSX Axis and Tooltip components`**

### `src/components/Axis.tsx`

```tsx
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
```

### `src/components/Tooltip.tsx`

```tsx
import React from 'react';
import type { TooltipState } from '../hooks/useTooltip';
import type { TooltipConfig } from '../types/tooltip';

interface TooltipProps {
  state: TooltipState;
  config?: TooltipConfig;
}

export function Tooltip({ state, config }: TooltipProps) {
  if (!state.visible) return null;
  return (
    <div
      style={{
        position: 'fixed',
        left: state.x + 12,
        top: state.y - 8,
        pointerEvents: 'none',
        zIndex: 9999,
        backgroundColor: config?.backgroundColor ?? 'rgba(0,0,0,0.8)',
        color: config?.textColor ?? '#fff',
        padding: config?.padding ?? '6px 10px',
        borderRadius: config?.borderRadius ?? 4,
        fontSize: config?.fontSize ?? 12,
        whiteSpace: 'nowrap',
      }}
      dangerouslySetInnerHTML={{ __html: state.content }}
    />
  );
}
```

---

## Phase 4 — Refactor useTooltip

**Commit: `refactor: replace D3 tooltip with React state tooltip`**

Rewrite `packages/apus-charts/src/hooks/useTooltip.ts`:

```typescript
import { useState, useCallback } from 'react';
import type { TooltipConfig } from '../types/tooltip';

export interface TooltipState {
  visible: boolean;
  content: string;
  x: number;
  y: number;
}

export interface TooltipHookReturn {
  tooltipState: TooltipState;
  showTooltip: (content: string, event: MouseEvent | React.MouseEvent) => void;
  hideTooltip: () => void;
}

export function useTooltip(_config?: TooltipConfig): TooltipHookReturn {
  const [tooltipState, setTooltipState] = useState<TooltipState>({
    visible: false,
    content: '',
    x: 0,
    y: 0,
  });

  const showTooltip = useCallback((content: string, event: MouseEvent | React.MouseEvent) => {
    setTooltipState({ visible: true, content, x: event.clientX, y: event.clientY });
  }, []);

  const hideTooltip = useCallback(() => {
    setTooltipState((s) => ({ ...s, visible: false }));
  }, []);

  return { tooltipState, showTooltip, hideTooltip };
}
```

---

## Phase 5 — Fix Package Dependencies

**Commit: `chore: remove D3 and heroicons from chart library deps`**

### `packages/apus-charts/package.json`

Set:
```json
"peerDependencies": { "react": "^18.0.0", "react-dom": "^18.0.0" },
"dependencies": {},
"devDependencies": {
  "typescript": "~5.8.3",
  "vite": "^6.3.5",
  "vite-plugin-dts": "^4.5.4",
  "vitest": "^3.1.4"
}
```
Remove `@types/d3` from devDependencies.
Remove `"d3"` from `keywords`.
Update `description` to remove "D3" reference.

### `packages/apus-demo/package.json`

Add `"@heroicons/react": "^2.2.0"` to `dependencies`.
Remove `"d3"` from `dependencies`.

### `packages/apus-charts/vite.config.ts`

Remove `'d3'` and `'@heroicons/react'` from `rollupOptions.external`.
Remove `d3` and `@heroicons/react` entries from `rollupOptions.output.globals`.

### Delete `packages/apus-charts/src/d3-regression.d.ts`

### Run `pnpm install` to update lockfile.

---

## Phase 6 — Convert Renderers (Computed Values Pattern)

**Mouse coordinate helper** — replace all `d3.pointer()` calls:
```typescript
const getSVGCoords = (event: React.MouseEvent<SVGElement>, svgEl: SVGSVGElement) => {
  const rect = svgEl.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
};
```

**Tooltip in each Chart wrapper** — add to every `*Chart.tsx`:
```tsx
import { useTooltip } from '../hooks/useTooltip';
import { Tooltip } from '../components/Tooltip';

// inside component:
const { tooltipState, showTooltip, hideTooltip } = useTooltip(tooltipConfig);

// in return:
return (
  <div style={{ position: 'relative' }}>
    <ChartNameRenderer
      ...existingProps
      onShowTooltip={showTooltip}
      onHideTooltip={hideTooltip}
    />
    <Tooltip state={tooltipState} config={tooltipConfig} />
  </div>
);
```

**Each renderer** receives `onShowTooltip` and `onHideTooltip` as props and calls them on `onMouseEnter`/`onMouseMove`/`onMouseLeave` of SVG elements.

### Conversion order (commit per chart):

**6.1 BarChart** — `refactor(bar-chart): remove D3, use computed values`
- Replace `d3.scaleBand` → `bandScale`
- Replace `d3.scaleLinear` → `linearScale`
- Replace `d3.max` → `maxOf`
- Replace `d3.axisBottom/Left` → `<XAxis>`, `<YAxis>`
- Replace `d3.select + useEffect rendering` → return JSX `<svg>`
- Replace `d3.schemeCategory10` → `CATEGORY_10`
- Replace `d3.color(hex).copy({opacity})` → `hexWithOpacity(hex, opacity)`
- Verify: `pnpm --filter apus test -- BarChart`

**6.2 RangeChart** — `refactor(range-chart): remove D3, use computed values`
- Same pattern as BarChart
- Verify: `pnpm --filter apus test -- RangeChart`

**6.3 LineChart** — `refactor(line-chart): remove D3, use computed values`
- Replace `d3.scalePoint` → `pointScale`
- Replace `d3.scaleLinear` → `linearScale`
- Replace `d3.line().curve(d3.curveMonotoneX)` → `linePath(data, x, y, 'monotone')`
- Replace `d3.area()` → `areaPath(data, x, y0, y1, 'monotone')`
- Replace `d3.max/min` → `maxOf/minOf`
- Verify: `pnpm --filter apus test -- LineChart`

**6.4 DonutChart** — `refactor(donut-chart): remove D3, use computed values`
- Replace `d3.pie()` → `pieLayout(data, d => d.value)`
- Replace `d3.arc()` → `arcPath(innerRadius, outerRadius, slice.startAngle, slice.endAngle)`
- Each arc becomes `<path d={arcPath(...)} />`
- Verify: `pnpm --filter apus test -- DonutChart`

**6.5 GaugeDonutChart** — `refactor(gauge-donut-chart): remove D3, use computed values`
- Uses `pieLayout` with custom `startAngle`/`endAngle` for gauge range
- SVG `<defs>` with `<linearGradient>` rendered as JSX
- Verify: `pnpm --filter apus test -- GaugeDonut`

**6.6 NestedDonutChart** — `refactor(nested-donut-chart): remove D3, use computed values`
- Multiple `pieLayout` calls (one per ring level) with computed inner/outer radii
- Verify: `pnpm --filter apus test -- NestedDonut`

**6.7 StackedBarChart** — `refactor(stacked-bar-chart): remove D3, use computed values`
- Replace `d3.stack()` → `stackLayout(keys, data)`
- Replace `d3.scaleBand` → `bandScale` (two of them: outer + inner grouping)
- Replace `d3.scaleOrdinal` → `ordinalScale`
- Replace `d3.schemeCategory10` → `CATEGORY_10`
- Verify: `pnpm --filter apus test -- StackedBarChart`

**6.8 RadarChart** — `refactor(radar-chart): remove D3 and d3-shape, use computed values`
- Remove `import { lineRadial, curveCardinalClosed } from 'd3-shape'`
- Angles: `(2 * Math.PI / numAxes) * index`
- Radius: `linearScale([0, maxValue], [0, chartRadius])(value)`
- Path: `radialLinePath([[angle0, r0], [angle1, r1], ...], true)`
- Verify: `pnpm --filter apus test -- RadarChart`

**6.9 FunnelChart** — `refactor(funnel-chart): remove D3, use computed values`
- Trapezoid shapes: compute 4 corner points, render as `<polygon points="..." />`
- SVG `<defs>` for gradients/drop-shadow rendered as JSX `<defs><linearGradient>...`
- Verify: `pnpm --filter apus test -- FunnelChart`

**6.10 SegmentedFunnelChart** — `refactor(segmented-funnel-chart): remove D3, use computed values`
- Each stage is a row of proportionally-sized rectangles
- No scales needed — widths computed as `(segmentValue / stageTotal) * stageWidth`
- Verify: `pnpm --filter apus test -- SegmentedFunnel`

**6.11 ScatterChart** — `refactor(scatter-chart): remove D3 and d3-regression, use computed values`
- Replace `d3.scaleLinear/Ordinal/Sqrt/Log/Time` → corresponding math utilities
- Replace `d3.extent` → `extentOf`
- Replace `d3.schemeCategory10/Set2/Tableau10` → `CATEGORY_10/SET_2/TABLEAU_10`
- Replace `d3Regression.regressionLinear()` → `linearRegression(points, xExtent)`
  - Trend line: render as `<line x1={...} y1={...} x2={...} y2={...} />`
- This is the largest renderer (826 lines) — read it fully before converting
- Verify: `pnpm --filter apus test -- ScatterChart`

---

## Phase 7 — Update chartUtils.ts

Read `src/utils/chartUtils.ts`. Check if any renderer still calls its exports:

```bash
grep -r "createGradient\|addGridLines\|addLegend" packages/apus-charts/src --include="*.tsx"
```

If no renderer calls them: remove the D3 import and either delete the file or leave it empty.
If still called: rewrite as pure JSX helpers returning `React.ReactElement`.

Update `src/index.ts`: remove exports for any deleted utilities.

---

## Phase 8 — Verify Zero D3 References

```bash
# Both must return empty output
grep -r "from 'd3" packages/apus-charts/src --include="*.ts" --include="*.tsx"
grep -r "import.*d3" packages/apus-charts/src --include="*.ts" --include="*.tsx"
```

---

## Phase 9 — Run Tests and Fix Failures

```bash
pnpm --filter apus run test
```

If tests fail due to D3-specific patterns:
- Tests that used `d3.select(container)` for assertions: replace with `container.querySelector`
- Tests that check `svgRef.current` mutations: now check JSX-rendered SVG element attributes
- Update snapshots: `pnpm --filter apus test -- --update-snapshots`

**Commit: `test: update test assertions for JSX renderer output`**

---

## Phase 10 — Final Build Verification

Run each command and confirm expected output:

```bash
# 1. Build library
cd packages/apus-charts && pnpm run build
# Expected: dist/ directory created with index.js, index.cjs, index.d.ts

# 2. Zero D3 in built output
grep -r "from 'd3\b" packages/apus-charts/dist/ 2>/dev/null | grep -v ".map"
# Expected: empty

# 3. All tests pass
pnpm --filter apus run test
# Expected: all green

# 4. Zero runtime dependencies
node -e "const p = require('./packages/apus-charts/package.json'); console.log(Object.keys(p.dependencies || {}))"
# Expected: []

# 5. pnpm lockfile present, package-lock absent
ls pnpm-lock.yaml && ! ls package-lock.json && echo "OK"
# Expected: OK

# 6. Start demo and verify visually
pnpm --filter apus-demo run dev
# Open localhost in browser, verify all 8 chart tabs render correctly
# Verify: tooltips appear on hover, dark mode toggle works, responsive resize works
```

---

## Phase 11 — Push

```bash
git push origin master
```

---

## Commit History

```
chore: migrate workspace from npm to pnpm
feat: add zero-dep math utilities to replace D3
feat: add JSX Axis and Tooltip components
refactor: replace D3 tooltip with React state tooltip
chore: remove D3 and heroicons from chart library deps
refactor(bar-chart): remove D3, use computed values
refactor(range-chart): remove D3, use computed values
refactor(line-chart): remove D3, use computed values
refactor(donut-chart): remove D3, use computed values
refactor(gauge-donut-chart): remove D3, use computed values
refactor(nested-donut-chart): remove D3, use computed values
refactor(stacked-bar-chart): remove D3, use computed values
refactor(radar-chart): remove D3 and d3-shape, use computed values
refactor(funnel-chart): remove D3, use computed values
refactor(segmented-funnel-chart): remove D3, use computed values
refactor(scatter-chart): remove D3 and d3-regression, use computed values
test: update test assertions for JSX renderer output
docs: add plan.md with architecture decisions
```

---

## Known Risks

| Risk | Mitigation |
|------|------------|
| Monotone cubic doesn't pixel-match D3 exactly | Visual correctness is sufficient; exact parity not required |
| `stackLayout` baseline wrong | Verify StackedBarChart visually — segments must stack flush |
| ScatterChart scale edge cases (log/sqrt/time) | At minimum must render without throwing; visual edge cases acceptable |
| `radialLinePath` rotated vs D3 | Adjust `Math.PI / 2` offset in `radialLinePath` if radar polygon is rotated |
| Demo's own D3 import | Run `grep -r "from 'd3" packages/apus-demo/src` — remove any found |

---

## Architecture After This Change

```
apus/
├── src/
│   ├── math/           ← pure TS math, zero deps
│   │   ├── scales.ts   ← band, linear, ordinal, point, time, sqrt, log
│   │   ├── paths.ts    ← line, area, arc, pie, radialLine (monotone cubic spline)
│   │   ├── array.ts    ← max, min, extent, sum, stack
│   │   ├── colors.ts   ← CATEGORY_10, TABLEAU_10, SET_2, hexWithOpacity
│   │   └── regression.ts ← OLS linear regression
│   ├── components/
│   │   ├── Axis.tsx    ← <XAxis>, <YAxis> — pure JSX
│   │   └── Tooltip.tsx ← <Tooltip> — fixed-position div
│   ├── hooks/
│   │   └── useTooltip.ts ← React useState, no D3
│   └── [ChartName]/
│       ├── ChartName.tsx         ← wrapper: useTooltip, renders <Tooltip>
│       └── ChartNameRenderer.tsx ← pure function → JSX <svg>
```

**peerDependencies:** `react ^18`, `react-dom ^18`. Nothing else.
