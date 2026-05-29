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
