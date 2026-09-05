import { AlertCircle, RefreshCw } from 'lucide-react';
import { colors } from '../../utils/constants';

export default function ErrorMessage({
  message = 'An unexpected error occurred.',
  onRetry,
  style = {},
}) {
  return (
    <div
      style={{
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        border: '1px solid rgba(239, 68, 68, 0.25)',
        borderRadius: '12px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: colors.danger,
        fontFamily: 'Poppins, sans-serif',
        gap: '12px',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <AlertCircle size={20} style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '14px', fontWeight: 500 }}>{message}</span>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#FFFFFF',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: colors.danger,
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12.5px',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          <RefreshCw size={14} />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
}
