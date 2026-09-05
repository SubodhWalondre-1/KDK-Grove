import StatusBadge from '../../../components/StatusBadge';
import { colors } from '../../../theme/colors';

export default function MetricMiniCard({ label, value, unit, status }) {
  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
        padding: '16px',
        fontFamily: 'Poppins, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        minWidth: 0,
      }}
    >
      {/* Header: label + badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
        }}
      >
        <span
          style={{
            fontSize: '12px',
            fontWeight: 500,
            color: colors.textSecondary,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
        {status !== undefined && <StatusBadge status={status} />}
      </div>

      {/* Value + Unit */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        <span
          style={{
            fontSize: '22px',
            fontWeight: 700,
            color: colors.textPrimary,
            lineHeight: 1.1,
          }}
        >
          {value != null ? value : '—'}
        </span>
        {unit && (
          <span
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color: colors.textSecondary,
            }}
          >
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
