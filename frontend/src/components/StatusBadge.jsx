import { colors } from '../theme/colors';

const STATUS_MAP = {
  green: {
    bg: 'rgba(34, 197, 94, 0.1)',
    color: colors.success,
    border: 'rgba(34, 197, 94, 0.25)',
    defaultLabel: 'Normal',
  },
  yellow: {
    bg: 'rgba(245, 158, 11, 0.1)',
    color: colors.warning,
    border: 'rgba(245, 158, 11, 0.25)',
    defaultLabel: 'Borderline',
  },
  red: {
    bg: 'rgba(239, 68, 68, 0.1)',
    color: colors.danger,
    border: 'rgba(239, 68, 68, 0.25)',
    defaultLabel: 'Abnormal',
  },
};

const UNKNOWN_STYLE = {
  bg: 'rgba(100, 116, 139, 0.1)',
  color: colors.textSecondary,
  border: 'rgba(100, 116, 139, 0.2)',
  defaultLabel: 'Unknown',
};

/**
 * StatusBadge — the ONLY place status→color mapping exists on the frontend.
 * Maps backend status strings (green/yellow/red/null) to §8 design tokens.
 * No other component should hardcode these hex values.
 */
export default function StatusBadge({ status, label }) {
  const style = STATUS_MAP[status] || UNKNOWN_STYLE;
  const displayLabel = label || style.defaultLabel;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 10px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: 600,
        fontFamily: 'Poppins, sans-serif',
        backgroundColor: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        lineHeight: '18px',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: style.color,
          flexShrink: 0,
        }}
      />
      {displayLabel}
    </span>
  );
}
