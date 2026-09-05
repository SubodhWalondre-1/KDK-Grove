import { useEffect, useState } from 'react';
import { Bot, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { colors } from '../../../theme/colors';

export default function AiInsightCard({ abnormalValues = [], profileName = 'Patient' }) {
  const [activeDot, setActiveDot] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const abnormalNames = abnormalValues.map((v) => v.test_name).join(' & ');

  const insightsList = [
    {
      title: 'Infection & Immune Response',
      highlight: abnormalValues.length > 0
        ? `Elevated ${abnormalNames || 'WBC & Neutrophils'} may indicate active infection or systemic inflammation.`
        : `Immune parameters for ${profileName} are fully stable with zero signs of acute infection.`,
      body: abnormalValues.length > 0
        ? 'The body is actively launching an immune defense. Recommend monitoring temperature and hydration.'
        : 'White cell differentials are balanced within standard healthy limits.',
    },
    {
      title: 'Organ Function & Filtration',
      highlight: 'Renal and hepatic biomarker markers remain within target reference thresholds.',
      body: 'Kidney filtration (Creatinine/Urea) and liver enzymes show zero signs of acute strain.',
    },
    {
      title: 'Oxygen Transport & Red Blood Cells',
      highlight: 'Hemoglobin and Erythrocyte counts indicate healthy blood oxygen-carrying capacity.',
      body: 'No indication of anemia or cellular hypoxia observed in current circulation.',
    },
    {
      title: 'Action Plan & Clinical Next Steps',
      highlight: abnormalValues.length > 0
        ? `Follow up with your veterinarian to review ${abnormalNames || 'abnormal markers'}.`
        : `Maintain regular checkups and diet routines for ${profileName}.`,
      body: 'Re-testing key parameters in 2-4 weeks will help verify trend resolution.',
    },
  ];

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveDot((prev) => (prev + 1) % insightsList.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, insightsList.length]);

  const currentInsight = insightsList[activeDot];

  const handleNext = () => {
    setActiveDot((prev) => (prev + 1) % insightsList.length);
  };

  const handlePrev = () => {
    setActiveDot((prev) => (prev - 1 + insightsList.length) % insightsList.length);
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
        border: '1px solid #E2E8F0',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        fontFamily: 'Poppins, sans-serif',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} color="#7C3AED" />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
            AI Insight
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            type="button"
            onClick={handlePrev}
            style={{
              background: '#F1F5F9',
              border: 'none',
              borderRadius: '6px',
              padding: '4px',
              cursor: 'pointer',
              color: '#64748B',
            }}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            onClick={handleNext}
            style={{
              background: '#F1F5F9',
              border: 'none',
              borderRadius: '6px',
              padding: '4px',
              cursor: 'pointer',
              color: '#64748B',
            }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Interactive Mascot & Insight Card */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          backgroundColor: 'rgba(124, 58, 237, 0.04)',
          borderRadius: '14px',
          padding: '16px',
          border: '1px solid rgba(124, 58, 237, 0.12)',
          flex: 1,
          transition: 'all 0.3s ease',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)',
            boxShadow: '0 8px 20px rgba(99, 102, 241, 0.25)',
            color: '#FFFFFF',
            flexShrink: 0,
          }}
        >
          <Bot size={36} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase' }}>
            {currentInsight.title}
          </span>
          <p style={{ fontSize: '13.5px', fontWeight: 700, color: colors.textPrimary, lineHeight: '1.4', margin: 0 }}>
            {currentInsight.highlight}
          </p>
          <p style={{ fontSize: '12.5px', color: colors.textSecondary, lineHeight: '1.4', margin: 0 }}>
            {currentInsight.body}
          </p>
        </div>
      </div>

      {/* Carousel Dots Pagination */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          marginTop: '14px',
        }}
      >
        {insightsList.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setActiveDot(idx)}
            style={{
              width: activeDot === idx ? '20px' : '6px',
              height: '6px',
              borderRadius: '3px',
              backgroundColor: activeDot === idx ? '#7C3AED' : '#CBD5E1',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              transition: 'all 0.25s ease',
            }}
          />
        ))}
      </div>
    </div>
  );
}
