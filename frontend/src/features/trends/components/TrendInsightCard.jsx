import { TrendingUp, TrendingDown, Minus, HelpCircle, Lightbulb } from 'lucide-react';
import { colors } from '../../../theme/colors';

const DIRECTION_ICONS = {
  increasing: TrendingUp,
  decreasing: TrendingDown,
  stable: Minus,
  insufficient_data: HelpCircle,
  reference_data_unavailable: HelpCircle,
};

export default function TrendInsightCard({ insightText, direction = 'stable' }) {
  if (!insightText) return null;

  const IconComponent = DIRECTION_ICONS[direction] || HelpCircle;

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        marginTop: '20px',
        fontFamily: 'Poppins, sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: 'rgba(79, 70, 229, 0.08)',
            color: colors.primary,
            flexShrink: 0,
          }}
        >
          <Lightbulb size={22} />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
              AI Health Insight
            </h4>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: '#F1F5F9',
                color: colors.textSecondary,
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'capitalize',
              }}
            >
              <IconComponent size={13} color={colors.primary} />
              <span>{direction.replace(/_/g, ' ')}</span>
            </div>
          </div>

          <p
            style={{
              fontSize: '14px',
              color: colors.textPrimary,
              lineHeight: '1.6',
              margin: 0,
              fontWeight: 400,
            }}
          >
            {insightText}
          </p>
        </div>
      </div>
    </div>
  );
}
