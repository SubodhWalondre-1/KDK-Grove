import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LineTrendChart from '../../src/charts/LineTrendChart';
import { colors } from '../../src/theme/colors';

// Mock react-chartjs-2 Line component to inspect passed data & options
vi.mock('react-chartjs-2', () => ({
  Line: ({ data, options }) => (
    <div
      data-testid="mock-line-chart"
      data-datasets-count={data.datasets.length}
      data-datasets={JSON.stringify(data.datasets)}
      data-options={JSON.stringify(options)}
    >
      Mock Line Chart ({data.datasets.length} datasets)
    </div>
  ),
}));

describe('LineTrendChart component', () => {
  const sampleLabels = ['Jan 2025', 'Mar 2025', 'Jun 2025'];
  const sampleDatasets = [
    { label: 'Hemoglobin', data: [13.0, 14.5, 16.0] },
    { label: 'Blood Sugar', data: [85.0, 95.0, 110.0] },
  ];

  it('renders one Line dataset per entry in the datasets prop', () => {
    render(<LineTrendChart labels={sampleLabels} datasets={sampleDatasets} />);
    const chartEl = screen.getByTestId('mock-line-chart');
    expect(chartEl).toHaveAttribute('data-datasets-count', '2');
  });

  it("each dataset's borderColor pulls from theme/colors.js tokens", () => {
    render(<LineTrendChart labels={sampleLabels} datasets={sampleDatasets} />);
    const chartEl = screen.getByTestId('mock-line-chart');
    const datasets = JSON.parse(chartEl.getAttribute('data-datasets'));

    expect(datasets[0].borderColor).toBe(colors.primary);
    expect(datasets[1].borderColor).toBe(colors.secondary);
  });

  it('compact=true hides legend and axes', () => {
    render(<LineTrendChart labels={sampleLabels} datasets={sampleDatasets} compact={true} />);
    const chartEl = screen.getByTestId('mock-line-chart');
    const options = JSON.parse(chartEl.getAttribute('data-options'));

    expect(options.plugins.legend.display).toBe(false);
    expect(options.scales.x.display).toBe(false);
    expect(options.scales.y.display).toBe(false);
  });

  it('compact=false (default) shows legend', () => {
    render(<LineTrendChart labels={sampleLabels} datasets={sampleDatasets} compact={false} />);
    const chartEl = screen.getByTestId('mock-line-chart');
    const options = JSON.parse(chartEl.getAttribute('data-options'));

    expect(options.plugins.legend.display).toBe(true);
  });

  it('a dataset with a null value in the middle of its data array does not throw and enables spanGaps', () => {
    const datasetWithNull = [
      { label: 'Hemoglobin', data: [13.0, null, 16.0] },
    ];
    render(<LineTrendChart labels={sampleLabels} datasets={datasetWithNull} />);
    const chartEl = screen.getByTestId('mock-line-chart');
    const datasets = JSON.parse(chartEl.getAttribute('data-datasets'));

    expect(datasets[0].spanGaps).toBe(true);
    expect(datasets[0].data).toEqual([13.0, null, 16.0]);
  });
});
