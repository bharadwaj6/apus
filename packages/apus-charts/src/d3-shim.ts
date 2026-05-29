// Temporary shim to allow tsc/vite for unconverted files during migration finish.
// All real d3 usage will be removed in full phase 6.
export const select = () => ({ selectAll: () => ({}), append: () => ({}), attr: () => ({}), call: () => ({}), remove: () => ({}), style: () => ({}), on: () => ({}), transition: () => ({}), datum: () => ({}), join: () => ({}), data: () => ({ join: () => ({}) }) });
export const pointer = () => [0,0];
export const arc = () => ({ innerRadius: () => ({}), outerRadius: () => ({}), cornerRadius: () => ({}), padAngle: () => ({}), centroid: () => [0,0] });
export const pie = () => ({ value: () => ({}), sort: () => ({}), padAngle: () => ({}), startAngle: () => ({}), endAngle: () => ({}) });
export const line = () => ({ x: () => ({}), y: () => ({}), curve: () => ({} ) });
export const scaleBand = () => ({ domain: () => ({}), range: () => ({}), padding: () => ({}), bandwidth: () => 0 });
export const scaleLinear = () => ({ domain: () => ({}), range: () => ({}), nice: () => ({}), ticks: () => [] });
export const scaleOrdinal = () => ({ domain: () => ({}), range: () => ({} ) });
export const scalePoint = () => ({ domain: () => ({}), range: () => ({}), padding: () => ({} ) });
export const max = (arr: any[], fn?: any) => 0;
export const min = (arr: any[], fn?: any) => 0;
export const extent = () => [0,1];
export const sum = () => 0;
export const stack = () => (data: any[]) => [];
export const schemeCategory10 = ['#aaa'];
export const color = (c: string) => ({ copy: () => ({}) });
export const axisLeft = () => ({ ticks: () => ({}), tickSize: () => ({}), tickFormat: () => ({}) });
export const axisBottom = () => ({ ticks: () => ({}), tickSize: () => ({}), tickFormat: () => ({}) });
export * from './d3-shim'; // self
