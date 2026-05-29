// Temporary shim to allow legacy chartUtils helpers during final upstream merge + cleanup phase.
// All real usage in converted charts has been removed.
export const select = () => ({ append: () => ({}), attr: () => ({}), call: () => ({}), select: () => ({}), remove: () => ({}) });
export const axisLeft = () => ({ ticks: () => ({}), tickSize: () => ({}), tickFormat: () => ({}) });
export const axisBottom = () => ({ ticks: () => ({}), tickSize: () => ({}), tickFormat: () => ({}) });
