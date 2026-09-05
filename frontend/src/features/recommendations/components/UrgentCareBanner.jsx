import { AlertTriangle, PhoneCall } from 'lucide-react';
import { colors } from '../../../theme/colors';

export default function UrgentCareBanner({ message }) {
  return (
    <div
      style={{
        backgroundColor: 'rgba(239, 68, 68, 0.06)',
        border: '2px solid #EF4444',
        borderRadius: '16px',
        padding: '24px',
        fontFamily: 'Poppins, sans-serif',
        boxShadow: '0 4px 14px rgba(239, 68, 68, 0.15)',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: '#EF4444',
            color: '#FFFFFF',
            flexShrink: 0,
          }}
        >
          <AlertTriangle size={28} />
        </div>

        <div style={{ flex: 1 }}>
          <h3
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#B91C1C',
              margin: '0 0 8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            Urgent Medical Consultation Recommended
          </h3>

          <p
            style={{
              fontSize: '14px',
              lineHeight: '1.6',
              color: '#7F1D1D',
              margin: '0 0 16px',
              fontWeight: 500,
            }}
          >
            {message}
          </p>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              backgroundColor: '#EF4444',
              color: '#FFFFFF',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            <PhoneCall size={16} />
            <span>Contact a Healthcare Professional or Vet Immediately</span>
          </div>
        </div>
      </div>
    </div>
  );
}
