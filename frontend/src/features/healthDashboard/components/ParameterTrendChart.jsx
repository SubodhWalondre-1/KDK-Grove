import LineTrendChart from '../../../charts/LineTrendChart';
import { colors } from '../../../theme/colors';

export default function ParameterTrendChart({ trendData }) {
  const hasData =
    trendData &&
    trendData.datasets &&
    trendData.datasets.length > 0 &&
    trendData.labels &&
    trendData.labels.length > 1 &&
    trendData.datasets.some((ds) => ds.data && ds.data.some((v) => v != null));

  if (!hasData) {
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
          borderRadius: '10px',
        }}
      >
        Trend data appears after your second report
      </div>
    );
  }

  return (
    <div>
      <h4
        style={{
          fontSize: '14px',
          fontWeight: 600,
          color: colors.textPrimary,
          margin: '0 0 12px',
          fontFamily: 'Poppins, sans-serif',
        }}
      >
        Parameter Trend
      </h4>
      <LineTrendChart
        labels={trendData.labels}
        datasets={trendData.datasets}
        compact={false}
      />
    </div>
  );
}
