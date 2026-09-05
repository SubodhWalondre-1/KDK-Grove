import MetricMiniCard from './MetricMiniCard';
import ParameterTrendChart from './ParameterTrendChart';
import { colors } from '../../../theme/colors';

const SEVERITY_ORDER = { red: 0, yellow: 1, green: 2 };

function selectFeaturedValues(testValues, count = 4) {
  const sorted = [...testValues].sort((a, b) => {
    const aOrder = SEVERITY_ORDER[a.status] ?? 1.5;
    const bOrder = SEVERITY_ORDER[b.status] ?? 1.5;
    return aOrder - bOrder;
  });
  return sorted.slice(0, count);
}

export default function HealthOverviewCard({ testValues = [], trendData }) {
  const featured = selectFeaturedValues(testValues);

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '14px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
        padding: '24px',
        fontFamily: 'Poppins, sans-serif',
      }}
    >
      <h3
        style={{
          fontSize: '15px',
          fontWeight: 600,
          color: colors.textPrimary,
          margin: '0 0 16px',
        }}
      >
        Health Overview
      </h3>

      {/* 4 mini cards — 2x2 on mobile, 4x1 on desktop */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
          marginBottom: '24px',
        }}
        className="health-overview-grid"
      >
        {featured.map((tv) => (
          <MetricMiniCard
            key={tv.id}
            label={tv.test_name}
            value={tv.value}
            unit={tv.unit}
            status={tv.status}
          />
        ))}
      </div>

      <ParameterTrendChart trendData={trendData} />

      {/* Responsive grid breakpoint */}
      <style>{`
        @media (min-width: 768px) {
          .health-overview-grid {
            grid-template-columns: repeat(4, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
