import LineTrendChart from '../../../charts/LineTrendChart';
import { colors } from '../../../theme/colors';
import { formatTestDisplayName } from '../../../utils/formatters';

export default function TrendLineChart({ points = [], testName = 'Test Parameter' }) {
  const formattedName = formatTestDisplayName(testName);
  if (!points || points.length < 2) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '200px',
          color: colors.textSecondary,
          fontSize: '14px',
          fontFamily: 'Poppins, sans-serif',
          fontStyle: 'italic',
          backgroundColor: 'rgba(0, 0, 0, 0.02)',
          borderRadius: '12px',
          border: '1px dashed #CBD5E1',
        }}
      >
        Not enough data yet for a trend chart
      </div>
    );
  }

  const labels = points.map((p, idx) =>
    p.report_date ? p.report_date : `Report ${idx + 1}`
  );

  const datasets = [
    {
      label: testName,
      data: points.map((p) => p.value),
    },
  ];

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        fontFamily: 'Poppins, sans-serif',
      }}
    >
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h4 style={{ fontSize: '15px', fontWeight: 600, color: colors.textPrimary, margin: 0 }}>
          {formattedName} History
        </h4>
        {points[points.length - 1]?.unit && (
          <span style={{ fontSize: '12px', color: colors.textSecondary, fontWeight: 500 }}>
            Unit: {points[points.length - 1].unit}
          </span>
        )}
      </div>

      <LineTrendChart labels={labels} datasets={datasets} compact={false} />
    </div>
  );
}
