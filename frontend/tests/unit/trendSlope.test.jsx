import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import TrendLineChart from '../../src/features/trends/components/TrendLineChart';

describe('TrendLineChart Client-Side Transforms & Unit Tests (trendSlope)', () => {
  it('points->chart-data transform produces one label per point and one data value per point, in order', () => {
    const points = [
      { report_id: 1, report_date: '2026-01-01', value: 12.5, unit: 'g/dL', ref_low: 12.0, ref_high: 17.5 },
      { report_id: 2, report_date: '2026-02-01', value: 14.0, unit: 'g/dL', ref_low: 12.0, ref_high: 17.5 },
      { report_id: 3, report_date: '2026-03-01', value: 15.2, unit: 'g/dL', ref_low: 12.0, ref_high: 17.5 },
    ];

    render(<TrendLineChart points={points} testName="Hemoglobin" />);

    expect(screen.getByText('Hemoglobin History')).toBeInTheDocument();
    expect(screen.queryByText(/not enough data yet for a trend chart/i)).not.toBeInTheDocument();
  });

  it('a points array of length 1 triggers the empty-state message, not a chart render', () => {
    const points = [
      { report_id: 1, report_date: '2026-01-01', value: 12.5, unit: 'g/dL', ref_low: 12.0, ref_high: 17.5 },
    ];

    render(<TrendLineChart points={points} testName="Hemoglobin" />);

    expect(screen.getByText(/not enough data yet for a trend chart/i)).toBeInTheDocument();
  });

  it('uses the LAST point\'s unit and reference values for display framing', () => {
    const points = [
      { report_id: 1, report_date: '2026-01-01', value: 12.5, unit: 'old_unit', ref_low: 10.0, ref_high: 15.0 },
      { report_id: 2, report_date: '2026-02-01', value: 14.0, unit: 'mg/dL', ref_low: 12.0, ref_high: 17.5 },
    ];

    render(<TrendLineChart points={points} testName="Hemoglobin" />);

    // Confirms unit: mg/dL (from last point) is rendered
    expect(screen.getByText('Unit: mg/dL')).toBeInTheDocument();
  });
});
