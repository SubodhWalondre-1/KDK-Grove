import GaugeChart from '../../../charts/GaugeChart';
import { colors } from '../../../theme/colors';

const LABEL_COLORS = {
  Excellent: colors.success,
  Good: colors.success,
  Fair: colors.warning,
  'Needs Attention': colors.danger,
  'No Data': colors.textSecondary,
};

const DESCRIPTIONS = {
  Excellent: 'Your key health markers are within a healthy range.',
  Good: 'Most of your values look good. Keep it up!',
  Fair: 'A few values need attention. Consider a follow-up.',
  'Needs Attention': 'Several values are outside normal range. Please consult your doctor.',
  'No Data': 'Not enough data to calculate a health score yet.',
};

export default function HealthScoreGauge({ healthScore, healthScoreLabel, onViewDetails }) {
  const isScored = healthScore != null;
  const labelColor = LABEL_COLORS[healthScoreLabel] || colors.textSecondary;
  const description = DESCRIPTIONS[healthScoreLabel] || '';

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '14px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
        padding: '24px',
        fontFamily: 'Poppins, sans-serif',
        textAlign: 'center',
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
        AI Health Score
      </h3>

      {isScored ? (
        <>
          <GaugeChart value={healthScore} label={`${Math.round(healthScore)}/100`} />

          <p
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: labelColor,
              margin: '12px 0 6px',
            }}
          >
            {healthScoreLabel}
          </p>

          <p
            style={{
              fontSize: '13px',
              color: colors.textSecondary,
              margin: '0 0 18px',
              lineHeight: '1.5',
            }}
          >
            {description}
          </p>
        </>
      ) : (
        <div
          style={{
            padding: '32px 0',
            color: colors.textSecondary,
            fontSize: '14px',
            fontStyle: 'italic',
          }}
        >
          <p style={{ margin: '0 0 4px', fontSize: '28px', fontWeight: 700, color: colors.textSecondary }}>
            —
          </p>
          <p style={{ margin: 0 }}>Not yet scored</p>
        </div>
      )}

      {onViewDetails && (
        <button
          onClick={onViewDetails}
          style={{
            width: '100%',
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: 600,
            color: '#FFFFFF',
            background: 'linear-gradient(90deg, #4F46E5 0%, #7C3AED 100%)',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontFamily: 'Poppins, sans-serif',
            transition: 'opacity 0.2s',
          }}
        >
          View Details
        </button>
      )}
    </div>
  );
}
