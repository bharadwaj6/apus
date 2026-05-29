import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StackedBarChart } from './StackedBarChart'; // Adjust path if needed
import '@testing-library/jest-dom';

describe('StackedBarChart', () => {
  const mockData = [
    { month: 'Jan', ProductA: 100, ProductB: 50, ProductC: 20 },
    { month: 'Feb', ProductA: 120, ProductB: 60, ProductC: 25 },
    { month: 'Mar', ProductA: 150, ProductB: 70, ProductC: 30 },
  ];
  const mockKeys = ['ProductA', 'ProductB', 'ProductC'];
  const mockIndexBy = 'month';

  it('renders an SVG element', () => {
    const { container } = render(
      <StackedBarChart
        data={mockData}
        keys={mockKeys}
        indexBy={mockIndexBy}
        width={600}
        height={400}
        responsive={false}
      />,
    );
    const svgElement = container.querySelector('svg');
    expect(svgElement).toBeInTheDocument();
  });

  it('renders the correct number of bar groups (stacks)', () => {
    const { container } = render(
      <StackedBarChart
        data={mockData}
        keys={mockKeys}
        indexBy={mockIndexBy}
        width={600}
        height={400}
        responsive={false}
      />,
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    if (svg) {
      const barSeriesContainer = svg.querySelector('.bar-series-container');
      expect(barSeriesContainer).toBeInTheDocument();
      if (barSeriesContainer) {
        const seriesGroups = barSeriesContainer.querySelectorAll(':scope > g[fill]');
        expect(seriesGroups.length).toBe(mockKeys.length);
        seriesGroups.forEach((group) => {
          const rectsInGroup = group.querySelectorAll('rect');
          expect(rectsInGroup.length).toBe(mockData.length);
        });
      }
    }
  });

  it('renders axes by default', () => {
    const { container } = render(
      <StackedBarChart
        data={mockData}
        keys={mockKeys}
        indexBy={mockIndexBy}
        width={600}
        height={400}
        responsive={false}
      />,
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    if (svg) {
      const axes = svg.querySelectorAll('.x-axis, .y-axis');
      expect(axes.length).toBe(2);
    }
  });

  it('renders the legend by default', () => {
    const { container } = render(
      <StackedBarChart
        data={mockData}
        keys={mockKeys}
        indexBy={mockIndexBy}
        width={600}
        height={400}
        responsive={false}
      />,
    );
    const legend = container.querySelector('.legend');
    expect(legend).toBeInTheDocument();
  });

  it('renders the correct number of legend items', () => {
    const { container } = render(
      <StackedBarChart
        data={mockData}
        keys={mockKeys}
        indexBy={mockIndexBy}
        width={600}
        height={400}
        responsive={false}
      />,
    );
    const legendItems = container.querySelectorAll('.legend-item');
    expect(legendItems.length).toBe(mockKeys.length);
  });

  it('does not render legend when showLegend is false', () => {
    const { container } = render(
      <StackedBarChart
        data={mockData}
        keys={mockKeys}
        indexBy={mockIndexBy}
        showLegend={false}
        width={600}
        height={400}
        responsive={false}
      />,
    );
    const legend = container.querySelector('.legend');
    expect(legend).not.toBeInTheDocument();
  });

  // Add more tests: e.g., for tooltip interaction, different layouts, colors, etc.
});
