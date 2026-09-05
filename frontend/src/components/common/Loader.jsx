import { Loader2 } from 'lucide-react';
import { colors } from '../../utils/constants';

export default function Loader({
  message = 'Loading…',
  size = 24,
  style = {},
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 0',
        color: colors.primary,
        gap: '10px',
        fontFamily: 'Poppins, sans-serif',
        ...style,
      }}
    >
      <Loader2 size={size} style={{ animation: 'medioraSpin 1s linear infinite' }} />
      {message && <span style={{ fontSize: '14.5px', fontWeight: 500 }}>{message}</span>}
      <style>{`
        @keyframes medioraSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
