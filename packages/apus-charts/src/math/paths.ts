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
