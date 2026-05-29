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
