/**
 * Self-contained compatibility shim for the three remaining legacy charts
 * (Bar, Line, Range) + chartUtils.
 *
 * This file contains NO external dependencies (especially no 'd3').
 * It provides just enough behavior for the old imperative renderers to
 * produce visible output in the demo and for the published package to
 * remain zero-dependency.
 *
 * Full migration of these three charts to the pure math + JSX pattern
 * will allow deleting this file entirely.
 */

function createChainable(el: any) {
  const chain: any = {
    append: (tag: string) => {
      if (el && el.appendChild) {
        const child = document.createElementNS('http://www.w3.org/2000/svg', tag);
        el.appendChild(child);
        return createChainable(child);
      }
      return chain;
    },
    attr: (name: string, value: any) => {
      if (el && el.setAttribute) el.setAttribute(name, String(value ?? ''));
      return chain;
    },
    style: (name: string, value: any) => {
      if (el && el.style) el.style[name] = value;
      return chain;
    },
    select: (sel: string) => createChainable(el ? el.querySelector(sel) : null),
    selectAll: () => chain,
    data: () => chain,
    enter: () => chain,
    exit: () => chain,
    remove: () => chain,
    call: (fn: any) => {
      fn(chain);
      return chain;
    },
    on: () => chain,
    transition: () => chain,
    duration: () => chain,
    ticks: () => chain,
    tickSize: () => chain,
    tickFormat: () => chain,
    node: () => el,
  };
  return chain;
}

export const select = (sel: any) => {
  if (typeof sel === 'string') return createChainable(document.querySelector(sel));
  if (sel && sel.nodeType) return createChainable(sel);
  return createChainable(null);
};

export const pointer = (ev: any) => (ev && ev.clientX != null ? [ev.clientX, ev.clientY] : [0, 0]);

export const max = (arr: any[], fn?: any) =>
  arr.reduce((m, d) => Math.max(m, fn ? fn(d) : d), -Infinity);
export const min = (arr: any[], fn?: any) =>
  arr.reduce((m, d) => Math.min(m, fn ? fn(d) : d), Infinity);

const makeScale = () => {
  let d: any[] = [],
    r: number[] = [0, 1];
  const s: any = (v: any) => v;
  s.domain = (x?: any[]) => {
    if (x) d = x;
    return s;
  };
  s.range = (x?: number[]) => {
    if (x) r = x;
    return s;
  };
  s.padding = () => s;
  s.bandwidth = () => (r[1] - r[0]) / Math.max(1, d.length);
  s.ticks = (n = 5) => Array.from({ length: n }, (_, i) => i);
  return s;
};

export const scaleBand = makeScale;
export const scaleLinear = makeScale;
export const scalePoint = makeScale;

const makeAxis = (s: any) => {
  const a: any = () => {};
  a.ticks = () => a;
  a.tickSize = () => a;
  return a;
};

export const axisLeft = makeAxis;
export const axisBottom = makeAxis;

export const curveMonotoneX = {};
export const curveLinear = {};

export const line = () => {
  const l: any = () => '';
  l.x = () => l;
  l.y = () => l;
  l.curve = () => l;
  return l;
};
export const area = () => {
  const a: any = () => '';
  a.x = () => a;
  a.y0 = () => a;
  a.y1 = () => a;
  a.curve = () => a;
  return a;
};

export default {
  select,
  pointer,
  max,
  min,
  scaleBand,
  scaleLinear,
  scalePoint,
  axisLeft,
  axisBottom,
  curveMonotoneX,
  line,
  area,
};
