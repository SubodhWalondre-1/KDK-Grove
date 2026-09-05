import { useState } from 'react';
import {
  Utensils,
  Dumbbell,
  Sparkles,
  CheckCircle2,
  XCircle,
  Activity,
  Heart,
} from 'lucide-react';
import { colors } from '../../../theme/colors';

export default function RecommendationTabs({
  diet = [],
  foodsToAvoid = [],
  exercise = [],
  lifestyle = [],
}) {
  const [activeTab, setActiveTab] = useState('diet');

  const tabs = [
    { id: 'diet', label: 'Diet Plan', icon: Utensils },
    { id: 'exercise', label: 'Exercise', icon: Dumbbell },
    { id: 'lifestyle', label: 'Lifestyle Tips', icon: Sparkles },
  ];

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
        border: '1px solid #E2E8F0',
        padding: '24px',
        fontFamily: 'Poppins, sans-serif',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Tab Navigation Header */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid #E2E8F0',
          paddingBottom: '12px',
          marginBottom: '20px',
          overflowX: 'auto',
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: isSelected ? 600 : 500,
                color: isSelected ? colors.primary : colors.textSecondary,
                backgroundColor: isSelected ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: 'Poppins, sans-serif',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Panels */}

      {/* 1. DIET PLAN TAB */}
      {activeTab === 'diet' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
          }}
        >
          {/* Foods to Eat Column */}
          <div
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.04)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '12px',
              padding: '18px',
            }}
          >
            <h4
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: '#047857',
                margin: '0 0 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <CheckCircle2 size={20} color="#10B981" />
              <span>Foods & Nutrients to Focus On</span>
            </h4>

            {diet.length === 0 ? (
              <p style={{ fontSize: '13px', color: colors.textSecondary, fontStyle: 'italic', margin: 0 }}>
                No specific recommendations in this category.
              </p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
                {diet.map((item, idx) => (
                  <li
                    key={idx}
                    style={{
                      fontSize: '13px',
                      color: colors.textPrimary,
                      lineHeight: '1.5',
                      marginBottom: '10px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                    }}
                  >
                    <span style={{ color: '#10B981', fontWeight: 'bold' }}>•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Foods to Avoid Column */}
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.04)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '12px',
              padding: '18px',
            }}
          >
            <h4
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: '#B91C1C',
                margin: '0 0 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <XCircle size={20} color="#EF4444" />
              <span>Foods to Limit or Avoid</span>
            </h4>

            {foodsToAvoid.length === 0 ? (
              <p style={{ fontSize: '13px', color: colors.textSecondary, fontStyle: 'italic', margin: 0 }}>
                No specific restrictions in this category.
              </p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
                {foodsToAvoid.map((item, idx) => (
                  <li
                    key={idx}
                    style={{
                      fontSize: '13px',
                      color: colors.textPrimary,
                      lineHeight: '1.5',
                      marginBottom: '10px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                    }}
                  >
                    <span style={{ color: '#EF4444', fontWeight: 'bold' }}>•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* 2. EXERCISE TAB */}
      {activeTab === 'exercise' && (
        <div
          style={{
            backgroundColor: 'rgba(79, 70, 229, 0.03)',
            border: '1px solid rgba(79, 70, 229, 0.15)',
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          <h4
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: colors.primary,
              margin: '0 0 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Activity size={20} />
            <span>Physical Activity & Fitness Guidance</span>
          </h4>

          {exercise.length === 0 ? (
            <p style={{ fontSize: '13px', color: colors.textSecondary, fontStyle: 'italic', margin: 0 }}>
              No specific recommendations in this category.
            </p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
              {exercise.map((item, idx) => (
                <li
                  key={idx}
                  style={{
                    fontSize: '14px',
                    color: colors.textPrimary,
                    lineHeight: '1.6',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(79, 70, 229, 0.1)',
                      color: colors.primary,
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    <Dumbbell size={14} />
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* 3. LIFESTYLE TIPS TAB */}
      {activeTab === 'lifestyle' && (
        <div
          style={{
            backgroundColor: 'rgba(124, 58, 237, 0.03)',
            border: '1px solid rgba(124, 58, 237, 0.15)',
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          <h4
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: '#7C3AED',
              margin: '0 0 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Heart size={20} color="#7C3AED" />
            <span>Daily Habits & Preventive Wellness Tips</span>
          </h4>

          {lifestyle.length === 0 ? (
            <p style={{ fontSize: '13px', color: colors.textSecondary, fontStyle: 'italic', margin: 0 }}>
              No specific recommendations in this category.
            </p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
              {lifestyle.map((item, idx) => (
                <li
                  key={idx}
                  style={{
                    fontSize: '14px',
                    color: colors.textPrimary,
                    lineHeight: '1.6',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(124, 58, 237, 0.1)',
                      color: '#7C3AED',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    <Sparkles size={14} />
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
