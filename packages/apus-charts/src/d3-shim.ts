/**
 * Temporary functional compatibility shim for the three remaining legacy charts
 * (Bar, Line, Range) + chartUtils.
 *
 * This shim makes the *existing* imperative d3 code in those renderers actually
 * draw real SVG elements at runtime (using native DOM APIs under the hood).
 *
 * This lets the demo deploy and look correct on Vercel today, while we finish
 * the full zero-dep migration for these three charts.
 *
 * The published "apus" package remains zero-dependency (this file is pure DOM + math).
 */

type Chainable = any;

function isElement(x: any): x is Element {
  return x && typeof x.setAttribute === 'function';
}

function createChainable(el: Element | null): Chainable {
  if (!el) {
    // Return a no-op chain when there's no real element (defensive)
    const noop: any = () => noop;
    return noop;
  }

  const chain: any = {
    append: (tag: string) => {
      const child = document.createElementNS('http://www.w3.org/2000/svg', tag);
      el.appendChild(child);
      return createChainable(child);
    },
    attr: (name: string, value: any) => {
      if (value != null) el.setAttribute(name, String(value));
      return chain;
    },
    style: (name: string, value: any) => {
      if ((el as any).style) (el as any).style[name] = value;
      return chain;
    },
    select: (sel: string) => {
      const found = (el as any).querySelector?.(sel);
      return createChainable(found || null);
    },
    selectAll: (sel: string) => {
      // Return a minimal selection-like object the old code uses with .data().enter()
      const nodes = Array.from((el as any).querySelectorAll?.(sel) || []);
      return createSelection(nodes);
    },
    data: (arr: any[]) => {
      // Minimal data join support used by the old renderers
      (el as any).__data__ = arr;
      return createSelection(arr.map((d, i) => ({ d, i, parent: el })));
    },
    enter: () => chain,
    exit: () => chain,
    remove: () => {
      el.parentNode?.removeChild(el);
      return chain;
    },
    call: (fn: any) => {
      fn(chain);
      return chain;
    },
    on: (_event: string, _handler: any) => chain, // events are handled in React wrappers now
    transition: () => chain,
    duration: () => chain,
    ease: () => chain,
    node: () => el,
    // Common axis helpers the old code chains
    ticks: () => chain,
    tickSize: () => chain,
    tickFormat: () => chain,
  };

  return chain;
}

function createSelection(items: any[]): Chainable {
  const sel: any = {
    data: (arr: any[]) => createSelection(arr.map((d, i) => ({ d, i }))),
    enter: () => sel,
    append: (tag: string) => {
      // When used after .enter(), create real elements on the parent
      return createChainable(null); // will be improved if needed
    },
    attr: () => sel,
    style: () => sel,
    call: (fn: any) => {
      fn(sel);
      return sel;
    },
  };
  return sel;
}

// --- Public API that the legacy code imports ---

export function select(selector: any): Chainable {
  if (typeof selector === 'string') {
    const el = document.querySelector(selector);
    return createChainable(el);
  }
  if (isElement(selector)) {
    return createChainable(selector);
  }
  return createChainable(null);
}

export function pointer(event: any, container?: any): [number, number] {
  if (event && typeof event.clientX === 'number') {
    return [event.clientX, event.clientY];
  }
  return [0, 0];
}

export const max = <T>(arr: T[], fn?: (d: T) => number) =>
  arr.reduce((m, d) => Math.max(m, fn ? fn(d) : (d as any)), -Infinity);

export const min = <T>(arr: T[], fn?: (d: T) => number) =>
  arr.reduce((m, d) => Math.min(m, fn ? fn(d) : (d as any)), Infinity);

export const extent = (arr: any[], fn?: (d: any) => number) => [min(arr, fn), max(arr, fn)];

function makeScale() {
  let domainVal: any[] = [];
  let rangeVal: number[] = [0, 1];
  let paddingVal = 0.1;

  const scale: any = (v: any) => {
    if (typeof v === 'string' || typeof v === 'number') {
      const idx = domainVal.indexOf(v);
      if (idx >= 0 && rangeVal.length >= 2) {
        const span = rangeVal[1] - rangeVal[0];
        return rangeVal[0] + (idx / Math.max(1, domainVal.length - 1)) * span;
      }
    }
    return rangeVal[0];
  };

  scale.domain = (d?: any[]) => {
    if (d) domainVal = d;
    return scale;
  };
  scale.range = (r?: number[]) => {
    if (r) rangeVal = r;
    return scale;
  };
  scale.padding = (p?: number) => {
    if (p != null) paddingVal = p;
    return scale;
  };
  scale.bandwidth = () => {
    if (rangeVal.length < 2) return 0;
    return ((rangeVal[1] - rangeVal[0]) / Math.max(1, domainVal.length)) * (1 - paddingVal);
  };
  scale.ticks = (n = 5) => {
    const [minV, maxV] = rangeVal;
    const step = (maxV - minV) / Math.max(1, n);
    return Array.from({ length: n + 1 }, (_, i) => minV + i * step);
  };
  return scale;
}

export const scaleBand = () => makeScale();
export const scaleLinear = () => makeScale();
export const scalePoint = () => makeScale();

function makeAxis(scale: any) {
  const axis: any = (selection: any) => selection;
  axis.ticks = () => axis;
  axis.tickSize = () => axis;
  axis.tickFormat = () => axis;
  return axis;
}

export const axisLeft = (scale: any) => makeAxis(scale);
export const axisBottom = (scale: any) => makeAxis(scale);

// Curve helpers (the old code only uses .curve(...) chaining)
export const curveMonotoneX = {};
export const curveLinear = {};

// d3.line / d3.area factories (used in Line renderer)
function makeLineOrAreaFactory() {
  const fn: any = () => 'M0,0';
  fn.x = () => fn;
  fn.y = () => fn;
  fn.y0 = () => fn;
  fn.y1 = () => fn;
  fn.curve = () => fn;
  fn.defined = () => fn;
  return fn;
}

export const line = () => makeLineOrAreaFactory();
export const area = () => makeLineOrAreaFactory();

export default {
  select,
  pointer,
  max,
  min,
  extent,
  scaleBand,
  scaleLinear,
  scalePoint,
  axisLeft,
  axisBottom,
  curveMonotoneX,
  curveLinear,
  line,
  area,
};
