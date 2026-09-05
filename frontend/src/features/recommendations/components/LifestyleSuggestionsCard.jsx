import { useState } from 'react';
import { CheckSquare, Square, Sparkles, HeartHandshake } from 'lucide-react';
import { colors } from '../../../theme/colors';

export default function LifestyleSuggestionsCard({ lifestyle = [] }) {
  if (!lifestyle || lifestyle.length === 0) {
    return null;
  }

  // Local state for interactive checklist
  const [checkedItems, setCheckedItems] = useState(
    new Array(lifestyle.length).fill(false)
  );

  const toggleCheck = (index) => {
    setCheckedItems((prev) => {
      const updated = [...prev];
      updated[index] = !updated[index];
      return updated;
    });
  };

  const completedCount = checkedItems.filter(Boolean).length;

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
        border: '1px solid #E2E8F0',
        padding: '24px',
        marginTop: '20px',
        fontFamily: 'Poppins, sans-serif',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          alignItems: 'center',
        }}
      >
        {/* Left Column: Interactive Checklist */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: colors.textPrimary,
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Sparkles size={18} color="#7C3AED" />
              <span>Daily Wellness Checklist</span>
            </h3>

            <span style={{ fontSize: '12px', fontWeight: 600, color: colors.primary, backgroundColor: 'rgba(79, 70, 229, 0.08)', padding: '4px 10px', borderRadius: '12px' }}>
              {completedCount}/{lifestyle.length} Done
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {lifestyle.map((item, idx) => {
              const isChecked = checkedItems[idx];
              return (
                <div
                  key={idx}
                  onClick={() => toggleCheck(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    backgroundColor: isChecked ? 'rgba(16, 185, 129, 0.06)' : '#F8FAFC',
                    border: `1px solid ${isChecked ? 'rgba(16, 185, 129, 0.3)' : '#E2E8F0'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <button
                    type="button"
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      color: isChecked ? '#10B981' : colors.textSecondary,
                      marginTop: '2px',
                    }}
                  >
                    {isChecked ? <CheckSquare size={18} /> : <Square size={18} />}
                  </button>

                  <span
                    style={{
                      fontSize: '13px',
                      color: isChecked ? colors.textSecondary : colors.textPrimary,
                      textDecoration: isChecked ? 'line-through' : 'none',
                      lineHeight: '1.5',
                      fontWeight: 500,
                    }}
                  >
                    {item}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Meditating / Wellness Figure Illustration */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            backgroundColor: 'linear-gradient(135deg, rgba(124, 58, 237, 0.05) 0%, rgba(79, 70, 229, 0.05) 100%)',
            borderRadius: '14px',
            border: '1px dashed rgba(124, 58, 237, 0.2)',
            textAlign: 'center',
          }}
        >
          {/* Zen Meditating Icon Art */}
          <div
            style={{
              position: 'relative',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'rgba(124, 58, 237, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#7C3AED',
              marginBottom: '12px',
            }}
          >
            <HeartHandshake size={40} />
            <div
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                backgroundColor: '#10B981',
                borderRadius: '50%',
                padding: '4px',
                color: '#FFFFFF',
              }}
            >
              <Sparkles size={14} />
            </div>
          </div>

          <h4 style={{ fontSize: '14px', fontWeight: 700, color: colors.textPrimary, margin: '0 0 4px' }}>
            Mindful Routine
          </h4>
          <p style={{ fontSize: '12px', color: colors.textSecondary, margin: 0, maxWidth: '220px', lineHeight: '1.4' }}>
            Consistency in small daily habits builds long-term vitality.
          </p>
        </div>
      </div>
    </div>
  );
}
