const fs = require('fs');
const path = require('path');

// Files to process
const files = [
  'packages/apus-charts/src/LineChart/LineChart.tsx',
  'packages/apus-charts/src/LineChart/LineChartRenderer.tsx',
  'packages/apus-charts/src/ScatterChart/ScatterChart.tsx',
  'packages/apus-charts/src/ScatterChart/ScatterChartRenderer.tsx',
  'packages/apus-charts/src/RadarChart/RadarChart.tsx',
  'packages/apus-charts/src/RadarChart/RadarChartRenderer.tsx',
  'packages/apus-charts/src/RangeChart/RangeChart.tsx',
  'packages/apus-charts/src/RangeChart/RangeChartRenderer.tsx',
  'packages/apus-charts/src/GaugeDonutChart/GaugeDonutChart.tsx',
  'packages/apus-charts/src/GaugeDonutChart/GaugeDonutChartRenderer.tsx',
  'packages/apus-charts/src/NestedDonutChart/NestedDonutChart.tsx',
  'packages/apus-charts/src/NestedDonutChart/NestedDonutChartRenderer.tsx',
  'packages/apus-charts/src/StackedBarChart/StackedBarChart.tsx',
  'packages/apus-charts/src/StackedBarChart/StackedBarChartRenderer.tsx',
];

let totalChanges = 0;

files.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`Skipping non-existent: ${fullPath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let changes = 0;

  // Replace old tooltip prop names with new config
  const replacements = [
    // Tooltip props
    [/\btooltipBackgroundColor\b/g, 'tooltip.backgroundColor'],
    [/\btooltipTextColor\b/g, 'tooltip.textColor'],
    [/\btooltipPadding\b/g, 'tooltip.padding'],
    [/\btooltipBorderRadius\b/g, 'tooltip.borderRadius'],
    [/\btooltipFontSize\b/g, 'tooltip.fontSize'],
    [/\btooltipOffsetX\b/g, 'tooltip.offsetX'],
    [/\btooltipOffsetY\b/g, 'tooltip.offsetY'],
    // Legend props
    [/\blegendPosition\b/g, 'legend.position'],
    [/\blegendFontSize\b/g, 'legend.itemFontSize'],
    [/\blegendFontColor\b/g, 'legend.itemColor'],
    [/\blegendTitle\b/g, 'legend.title'],
    [/\blegendTitleColor\b/g, 'legend.titleColor'],
    [/\blegendTitleFontSize\b/g, 'legend.titleFontSize'],
    [/\blegendTitleFontFamily\b/g, 'legend.titleFontFamily'],
    [/\blegendItemColor\b/g, 'legend.itemColor'],
    [/\blegendItemFontSize\b/g, 'legend.itemFontSize'],
    [/\blegendItemFontFamily\b/g, 'legend.itemFontFamily'],
    [/\blegendSwatchSize\b/g, 'legend.swatchSize'],
    [/\blegendSwatchBorderWidth\b/g, 'legend.swatchBorderWidth'],
    [/\blegendSwatchBorderColor\b/g, 'legend.swatchBorderColor'],
    [/\blegendGap\b/g, 'legend.gap'],
    [/\blegendPadding\b/g, 'legend.padding'],
    [/\bclickableLegend\b/g, 'legend.clickable'],
    [/\bonLegendItemClick\b/g, 'legend.onItemClick'],
    // Color props
    [/\bcolor\b(?!\s*:\s*string)/g, 'colors'],
    [/\bcolor1\b/g, 'colors[0]'],
    [/\bcolor2\b/g, 'colors[1]'],
    // LineChart specific
    [/\blineColors\b/g, 'colors'],
    [/\blineGradientColors\b/g, 'lineGradientColors'],
    [/\bareaGradientColors\b/g, 'areaGradientColors'],
    // Remove old legendLabels prop
    [/\blegendLabels\b/g, 'legendLabels'],
  ];

  replacements.forEach(([pattern, replacement]) => {
    const before = content;
    content = content.replace(pattern, replacement);
    if (content !== before) changes++;
  });

  if (changes > 0) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Fixed ${changes} issues in ${filePath}`);
    totalChanges += changes;
  } else {
    console.log(`No changes needed in ${filePath}`);
  }
});

console.log(`\nTotal changes: ${totalChanges}`);
