import { useRef, useState } from 'react';
import { Utensils, Droplets, Activity, Stethoscope, HeartPulse, ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react';
import { colors } from '../../../theme/colors';

const RECOMMENDATION_ITEMS = [
  {
    id: 'diet',
    title: 'Balanced Diet',
    description: (name) => `Provide a balanced diet rich in proteins and vitamins tailored for ${name}.`,
    details: (name) => [
      `Serve high-quality, easily digestible proteins (lean turkey, chicken breast, or boiled egg whites).`,
      `Incorporate antioxidant-rich vegetables like steam-cooked carrots and pumpkin for digestion.`,
      `Maintain consistent feeding schedules and avoid abrupt food transitions for ${name}.`,
    ],
    icon: Utensils,
    iconColor: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
  },
  {
    id: 'hydration',
    title: 'Stay Hydrated',
    description: (name) => `Ensure ${name} drinks enough fresh water throughout the day.`,
    details: (name) => [
      `Provide multiple clean water bowls around your living space.`,
      `Add low-sodium bone broth to daily meals to encourage higher fluid intake for ${name}.`,
      `Monitor daily water consumption for sudden spikes or declines.`,
    ],
    icon: Droplets,
    iconColor: '#0EA5E9',
    bgColor: 'rgba(14, 165, 233, 0.1)',
  },
  {
    id: 'exercise',
    title: 'Regular Exercise',
    description: () => 'Daily walks & playtime help maintain overall fitness and well-being.',
    details: (name) => [
      `Engage in two 20-minute low-impact walks daily.`,
      `Avoid strenuous activity during peak outdoor heat hours.`,
      `Include mental stimulation puzzles and scent games to keep ${name} active.`,
    ],
    icon: Activity,
    iconColor: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.1)',
  },
  {
    id: 'vet',
    title: 'Vet Check-up',
    description: () => 'Follow up with your vet to monitor any abnormal parameter changes.',
    details: (name) => [
      `Schedule a routine clinical follow-up within 2-3 weeks to recheck blood values.`,
      `Bring recent lab reports and trend logs for your veterinarian to review.`,
      `Discuss any subtle behavioral or appetite changes observed in ${name}.`,
    ],
    icon: Stethoscope,
    iconColor: '#7C3AED',
    bgColor: 'rgba(124, 58, 237, 0.1)',
  },
  {
    id: 'symptoms',
    title: 'Monitor Symptoms',
    description: () => 'Keep a close eye on appetite, energy levels, and daily behavior.',
    details: (name) => [
      `Record daily energy ratings, food finish rates, and stool consistency.`,
      `Watch for lethargy, excessive panting, or reluctance to move.`,
      `Log any unexpected symptoms immediately in ${name}'s digital health record.`,
    ],
    icon: HeartPulse,
    iconColor: '#EF4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
  },
];

export default function TopRecommendationsRow({ profileName = 'Patient' }) {
  const scrollContainerRef = useRef(null);
  const [selectedRec, setSelectedRec] = useState(null);

  const handleScroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'right' ? 240 : -240;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div style={{ marginTop: '24px', fontFamily: 'Poppins, sans-serif' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
          Top Recommendations for {profileName}
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => handleScroll('left')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
              border: '1px solid #E2E8F0',
              color: colors.primary,
              cursor: 'pointer',
            }}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => handleScroll('right')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
              border: '1px solid #E2E8F0',
              color: colors.primary,
              cursor: 'pointer',
            }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel */}
      <div
        ref={scrollContainerRef}
        style={{
          display: 'flex',
          gap: '16px',
          overflowX: 'auto',
          scrollBehavior: 'smooth',
          paddingBottom: '8px',
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }}
      >
        {RECOMMENDATION_ITEMS.map((item) => {
          const IconComponent = item.icon;

          return (
            <div
              key={item.id}
              onClick={() => setSelectedRec(item)}
              style={{
                minWidth: '210px',
                maxWidth: '220px',
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
                border: '1px solid #E2E8F0',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.borderColor = colors.primary;
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(79, 70, 229, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = '#E2E8F0';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.06)';
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  backgroundColor: item.bgColor,
                  color: item.iconColor,
                }}
              >
                <IconComponent size={22} />
              </div>

              <h4 style={{ fontSize: '14px', fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
                {item.title}
              </h4>

              <p style={{ fontSize: '12px', color: colors.textSecondary, lineHeight: '1.5', margin: 0 }}>
                {item.description(profileName)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Recommendation Detail Modal */}
      {selectedRec && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setSelectedRec(null)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '18px',
              maxWidth: '480px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
              border: '1px solid #E2E8F0',
              fontFamily: 'Poppins, sans-serif',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: selectedRec.bgColor,
                    color: selectedRec.iconColor,
                  }}
                >
                  <selectedRec.icon size={20} />
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
                  {selectedRec.title} Guidance
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRec(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '13.5px', color: colors.textPrimary, fontWeight: 600, marginBottom: '12px' }}>
              Actionable Instructions for {profileName}:
            </p>

            <ul style={{ paddingLeft: 0, listStyle: 'none', margin: '0 0 20px' }}>
              {selectedRec.details(profileName).map((point, idx) => (
                <li
                  key={idx}
                  style={{
                    fontSize: '13px',
                    color: colors.textSecondary,
                    lineHeight: '1.6',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                >
                  <Sparkles size={16} color={selectedRec.iconColor} style={{ flexShrink: 0, marginTop: '3px' }} />
                  <span>{point}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => setSelectedRec(null)}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '13.5px',
                fontWeight: 600,
                color: '#FFFFFF',
                backgroundColor: colors.primary,
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
