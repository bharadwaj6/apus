import type { ChartTheme } from './types';

export const lightTheme: ChartTheme = {
  colors: {
    primary: ['#6a93d1', '#4a7bc8', '#2a5bbf', '#0a3b9f'],
    secondary: ['#ff6b6b', '#ffa500', '#4ecdc4', '#45b7d1'],
  },
  tooltip: {
    show: true,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    textColor: 'white',
    padding: '8px',
    borderRadius: '4px',
    fontSize: '12px',
  },
  legend: {
    show: true,
    position: 'bottom',
    itemFontSize: '12px',
    itemColor: '#333',
    swatchSize: 16,
    gap: 8,
  },
  axis: {
    textColor: '#999',
    lineColor: '#ccc',
    fontSize: '12px',
  },
  grid: {
    color: '#e0e0e0',
    opacity: 0.5,
  },
  margin: {
    top: 20,
    right: 30,
    bottom: 30,
    left: 40,
  },
};

export const darkTheme: ChartTheme = {
  colors: {
    primary: ['#6a93d1', '#4a7bc8', '#2a5bbf', '#0a3b9f'],
    secondary: ['#ff6b6b', '#ffa500', '#4ecdc4', '#45b7d1'],
  },
  tooltip: {
    show: true,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    textColor: '#e2e8f0',
    padding: '8px',
    borderRadius: '4px',
    fontSize: '12px',
  },
  legend: {
    show: true,
    position: 'bottom',
    itemFontSize: '12px',
    itemColor: '#e2e8f0',
    swatchSize: 16,
    gap: 8,
  },
  axis: {
    textColor: '#94a3b8',
    lineColor: '#475569',
    fontSize: '12px',
  },
  grid: {
    color: '#334155',
    opacity: 0.5,
  },
  margin: {
    top: 20,
    right: 30,
    bottom: 30,
    left: 40,
  },
  backgroundColor: '#0f172a',
};
