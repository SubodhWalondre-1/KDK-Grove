import { useState } from 'react';
import {
  Utensils,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  ArrowRightLeft,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Info,
  SlidersHorizontal,
  Sparkles,
  HeartPulse,
} from 'lucide-react';
import { colors } from '../../../theme/colors';

export default function DietPlanView({
  plan,
  context,
  onEditContext,
  onRegenerate,
  isGenerating = false,
}) {
  const [activeMealTab, setActiveMealTab] = useState('breakfast');
  const [showEvidence, setShowEvidence] = useState(false);
  const [expandedLimitIdx, setExpandedLimitIdx] = useState(null);

  if (!plan) return null;

  const mealOptions = plan.meal_options || { breakfast: [], lunch: [], dinner: [] };
  const currentMealList = mealOptions[activeMealTab] || [];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        fontFamily: 'Poppins, sans-serif',
        maxWidth: '960px',
        margin: '0 auto',
      }}
    >
      {/* 1. Header Banner & Context Pill */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '24px 28px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED' }}>
              <Utensils size={20} />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: colors.textPrimary, margin: 0 }}>
              Personalized Nutrition Guidance
            </h2>
          </div>
          <p style={{ fontSize: '14px', color: colors.textSecondary, margin: '4px 0 0' }}>
            Lab-driven nutrition plan customized to your report findings and personal food preferences.
          </p>
        </div>

        {/* Edit Context Button */}
        <button
          type="button"
          onClick={onEditContext}
          disabled={isGenerating}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: 600,
            color: '#7C3AED',
            backgroundColor: 'rgba(124, 58, 237, 0.08)',
            border: '1px solid rgba(124, 58, 237, 0.2)',
            borderRadius: '10px',
            cursor: 'pointer',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          <SlidersHorizontal size={16} />
          <span>Adjust Context & Preferences</span>
        </button>
      </div>

      {/* 2. 🎯 PRIMARY NUTRITION FOCUS CARD */}
      {plan.primary_focus?.length > 0 && (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            padding: '24px 28px',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            boxShadow: '0 4px 20px rgba(239, 68, 68, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <AlertTriangle size={18} color="#EF4444" />
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#B91C1C', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Primary Nutrition Focus ({plan.primary_focus.length} Findings)
            </h3>
          </div>
          <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 16px', lineHeight: '1.5' }}>
            The meal guidance below is specifically optimized to address these lab abnormalities:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
            {plan.primary_focus.map((item, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.04)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  border: '1px solid rgba(239, 68, 68, 0.15)',
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 700, color: colors.textPrimary }}>
                  {item.parameter}
                </div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#EF4444', marginTop: '2px' }}>
                  {item.value} {item.unit}
                </div>
                <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                  Report Range: {item.reference_range}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. 🥗 CLINICAL DIRECTION RATIONALE */}
      {plan.nutrition_direction && (
        <div
          style={{
            backgroundColor: 'rgba(124, 58, 237, 0.04)',
            borderRadius: '16px',
            padding: '18px 22px',
            borderLeft: '4px solid #7C3AED',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <Info size={20} color="#7C3AED" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
              Nutrition Strategy & Clinical Rationale
            </div>
            <p style={{ fontSize: '13.5px', color: '#334155', margin: 0, lineHeight: '1.6' }}>
              {plan.nutrition_direction}
            </p>
          </div>
        </div>
      )}

      {/* 4. 🍽️ MEAL OPTIONS / BUILDER */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '24px 28px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
              🍽️ Meal Options & Builder
            </h3>
            <p style={{ fontSize: '12px', color: colors.textSecondary, margin: '2px 0 0' }}>
              Choose 1 option per meal matching your preferences
            </p>
          </div>

          {/* Meal Tabs */}
          <div style={{ display: 'flex', gap: '6px', backgroundColor: '#F1F5F9', padding: '4px', borderRadius: '12px' }}>
            {['breakfast', 'lunch', 'dinner'].map((tab) => {
              const isSelected = activeMealTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveMealTab(tab)}
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? '#7C3AED' : '#64748B',
                    backgroundColor: isSelected ? '#FFFFFF' : 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    boxShadow: isSelected ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.15s ease',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>

        {/* Meal Options List */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          {currentMealList.map((opt, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: '#F8FAFC',
                borderRadius: '14px',
                padding: '18px',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#7C3AED', backgroundColor: 'rgba(124, 58, 237, 0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                    OPTION {idx + 1}
                  </span>
                </div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: colors.textPrimary, margin: '0 0 6px' }}>
                  {opt.title}
                </h4>
                <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 14px', lineHeight: '1.5' }}>
                  {opt.description}
                </p>
              </div>

              {opt.highlights?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', paddingTop: '10px', borderTop: '1px solid #E2E8F0' }}>
                  {opt.highlights.map((h, hIdx) => (
                    <span key={hIdx} style={{ fontSize: '11px', fontWeight: 600, color: '#047857', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                      ✓ {h}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 5. 🔄 SMART SWAPS */}
      {plan.smart_swaps?.length > 0 && (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            padding: '24px 28px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <ArrowRightLeft size={18} color="#7C3AED" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
              🔄 Smart Food Swaps
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {plan.smart_swaps.map((swap, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '240px' }}>
                  <div style={{ padding: '8px 12px', backgroundColor: 'rgba(239, 68, 68, 0.08)', borderRadius: '8px', color: '#B91C1C', fontSize: '13px', fontWeight: 600 }}>
                    Instead of: <strong>{swap.instead_of}</strong>
                  </div>
                  <ArrowRightLeft size={16} color="#94A3B8" />
                  <div style={{ padding: '8px 12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', color: '#047857', fontSize: '13px', fontWeight: 600 }}>
                    Consider: <strong>{swap.consider}</strong>
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: '#64748B', maxWidth: '300px', lineHeight: '1.4' }}>
                  💡 {swap.why}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. ⚠️ CONSIDER LIMITING */}
      {plan.foods_to_limit?.length > 0 && (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            padding: '24px 28px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <AlertTriangle size={18} color="#F59E0B" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
              ⚠️ Choices to Limit
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {plan.foods_to_limit.map((limit, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.04)',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#B45309' }}>
                    {limit.category}
                  </span>
                  {limit.items?.length > 0 && (
                    <span style={{ fontSize: '12px', color: '#64748B' }}>
                      {limit.items.join(', ')}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '12.5px', color: '#475569', margin: '6px 0 0', lineHeight: '1.5' }}>
                  {limit.reason}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. 💡 EVIDENCE TRAIL */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '20px 24px',
          border: '1px solid #E2E8F0',
        }}
      >
        <button
          type="button"
          onClick={() => setShowEvidence(!showEvidence)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 700, color: colors.primary }}>
            <BookOpen size={16} />
            <span>Why this nutrition plan? (Evidence Traceability)</span>
          </div>
          {showEvidence ? <ChevronUp size={16} color="#94A3B8" /> : <ChevronDown size={16} color="#94A3B8" />}
        </button>

        {showEvidence && (
          <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #E2E8F0', fontSize: '13px', color: '#475569' }}>
            <p style={{ margin: '0 0 10px' }}>
              This nutrition plan was constructed by anchoring retrieved clinical evidence against your verified report parameters and preferred diet context.
            </p>
            {plan.evidence_sources?.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {plan.evidence_sources.map((s, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                    <ShieldCheck size={14} color={colors.primary} />
                    <span><strong>{s.title}</strong> ({s.category})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 8. ℹ️ CLINICIAN DISCLAIMER & BOUNDARY */}
      <div
        style={{
          backgroundColor: 'rgba(124, 58, 237, 0.04)',
          border: '1px solid rgba(124, 58, 237, 0.15)',
          borderRadius: '16px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '12.5px',
          color: '#7C3AED',
          lineHeight: '1.5',
        }}
      >
        <ShieldCheck size={20} color="#7C3AED" style={{ flexShrink: 0 }} />
        <span>
          Mediora nutrition guidance is provided for informational and educational support based on your lab findings and preferences. It does not replace professional medical or registered dietitian consultation.
        </span>
      </div>
    </div>
  );
}
