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
