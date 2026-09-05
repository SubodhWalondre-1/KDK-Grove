import { useState } from 'react';
import { X, Check, Utensils, ShieldAlert, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import { colors } from '../../../theme/colors';

const FOOD_PREFERENCES = [
  { id: 'vegetarian', label: 'Vegetarian', desc: 'Plant-based diet including dairy & honey, no meat/fish' },
  { id: 'non_vegetarian', label: 'Non-Vegetarian', desc: 'Includes poultry, meat, fish, and dairy' },
  { id: 'vegan', label: 'Vegan', desc: '100% plant-based, no animal products or dairy' },
  { id: 'no_preference', label: 'No Preference', desc: 'Flexible dietary choices' },
];

const RESTRICTIONS_OPTIONS = [
  { id: 'dairy', label: 'Dairy / Lactose' },
  { id: 'gluten', label: 'Gluten' },
  { id: 'nuts', label: 'Tree Nuts & Peanuts' },
  { id: 'seafood', label: 'Seafood & Shellfish' },
  { id: 'eggs', label: 'Eggs' },
  { id: 'soy', label: 'Soy' },
];

const REGIONAL_STYLES = [
  { id: 'indian', label: 'General Indian' },
  { id: 'north_indian', label: 'North Indian' },
  { id: 'south_indian', label: 'South Indian' },
  { id: 'maharashtrian', label: 'Maharashtrian' },
  { id: 'gujarati', label: 'Gujarati' },
  { id: 'bengali', label: 'Bengali' },
  { id: 'other', label: 'Global / Continental' },
];

const ACCESSIBILITY_OPTIONS = [
  { id: 'common_household', label: 'Common Household Foods', desc: 'Everyday ingredients easily found at local markets' },
  { id: 'budget_friendly', label: 'Budget-Friendly Staples', desc: 'Economical, high-value nutritious choices' },
  { id: 'flexible', label: 'Flexible / Premium Options', desc: 'Includes specialty health foods & organic options' },
];

export default function NutritionContextModal({
  initialContext = {},
  reportFindings = [],
  onSubmit,
  onClose,
  isGenerating = false,
}) {
  const [step, setStep] = useState(1);
  const [foodPreference, setFoodPreference] = useState(initialContext.food_preference || 'vegetarian');
  const [restrictions, setRestrictions] = useState(initialContext.restrictions || []);
  const [regionalStyles, setRegionalStyles] = useState(initialContext.regional_styles || ['indian']);
  const [accessibility, setAccessibility] = useState(initialContext.accessibility || 'common_household');
  const [clinicianRestrictions, setClinicianRestrictions] = useState(initialContext.clinician_restrictions || '');

  const toggleRestriction = (id) => {
    setRestrictions((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const toggleRegionalStyle = (id) => {
    setRegionalStyles((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleFinalSubmit = () => {
    onSubmit({
      food_preference: foodPreference,
      restrictions,
      regional_styles: regionalStyles.length > 0 ? regionalStyles : ['indian'],
      accessibility,
      clinician_restrictions: clinicianRestrictions,
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '16px',
        fontFamily: 'Poppins, sans-serif',
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxWidth: '680px',
          width: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 28px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#F8FAFC',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(124, 58, 237, 0.1)',
                color: '#7C3AED',
              }}
            >
              <Utensils size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
                Nutrition Context & Preferences
              </h3>
              <p style={{ fontSize: '12px', color: colors.textSecondary, margin: 0 }}>
                Step {step} of 4 — Customize your lab-driven diet guidance
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#94A3B8',
              padding: '4px',
              borderRadius: '8px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Wizard Progress Bar */}
        <div style={{ display: 'flex', height: '4px', backgroundColor: '#E2E8F0' }}>
          <div
            style={{
              width: `${(step / 4) * 100}%`,
              backgroundColor: '#7C3AED',
              transition: 'width 0.3s ease',
            }}
          />
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>
          {/* STEP 1: Food Preference */}
          {step === 1 && (
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: colors.textPrimary, margin: '0 0 6px' }}>
                1. What type of food do you usually prefer?
              </h4>
              <p style={{ fontSize: '13px', color: colors.textSecondary, margin: '0 0 18px' }}>
                The AI planner will strictly generate meal options matching your choice.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {FOOD_PREFERENCES.map((pref) => {
                  const isSelected = foodPreference === pref.id;
                  return (
                    <div
                      key={pref.id}
                      onClick={() => setFoodPreference(pref.id)}
                      style={{
                        padding: '14px 18px',
                        borderRadius: '12px',
                        border: `1.5px solid ${isSelected ? '#7C3AED' : '#E2E8F0'}`,
                        backgroundColor: isSelected ? 'rgba(124, 58, 237, 0.04)' : '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: isSelected ? '#7C3AED' : colors.textPrimary }}>
                          {pref.label}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                          {pref.desc}
                        </div>
                      </div>
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          border: `2px solid ${isSelected ? '#7C3AED' : '#CBD5E1'}`,
                          backgroundColor: isSelected ? '#7C3AED' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFFFFF',
                        }}
                      >
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Restrictions & Allergies */}
          {step === 2 && (
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: colors.textPrimary, margin: '0 0 6px' }}>
                2. Do you have food allergies or restrictions?
              </h4>
              <p style={{ fontSize: '13px', color: colors.textSecondary, margin: '0 0 18px' }}>
                Select all ingredients to exclude from recommendations.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px', marginBottom: '20px' }}>
                {RESTRICTIONS_OPTIONS.map((res) => {
                  const isChecked = restrictions.includes(res.id);
                  return (
                    <div
                      key={res.id}
                      onClick={() => toggleRestriction(res.id)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: `1.5px solid ${isChecked ? '#7C3AED' : '#E2E8F0'}`,
                        backgroundColor: isChecked ? 'rgba(124, 58, 237, 0.06)' : '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '13px',
                        fontWeight: isChecked ? 600 : 500,
                        color: isChecked ? '#7C3AED' : colors.textPrimary,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        style={{ accentColor: '#7C3AED' }}
                      />
                      <span>{res.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Clinician restrictions input */}
              <div style={{ marginTop: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: colors.textPrimary, display: 'block', marginBottom: '6px' }}>
                  Clinician-Provided Dietary Restrictions (Optional)
                </label>
                <textarea
                  value={clinicianRestrictions}
                  onChange={(e) => setClinicianRestrictions(e.target.value)}
                  placeholder="e.g., Strict sodium < 1500mg, avoid grapefruit due to medication interactions"
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    fontFamily: 'Poppins, sans-serif',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          )}

          {/* STEP 3: Regional & Cultural Meal Style */}
          {step === 3 && (
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: colors.textPrimary, margin: '0 0 6px' }}>
                3. What regional meal style do you prefer?
              </h4>
              <p style={{ fontSize: '13px', color: colors.textSecondary, margin: '0 0 18px' }}>
                Meal options will be constructed using realistic, everyday regional staples.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px', marginBottom: '24px' }}>
                {REGIONAL_STYLES.map((style) => {
                  const isChecked = regionalStyles.includes(style.id);
                  return (
                    <div
                      key={style.id}
                      onClick={() => toggleRegionalStyle(style.id)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: `1.5px solid ${isChecked ? '#7C3AED' : '#E2E8F0'}`,
                        backgroundColor: isChecked ? 'rgba(124, 58, 237, 0.06)' : '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '13px',
                        fontWeight: isChecked ? 600 : 500,
                        color: isChecked ? '#7C3AED' : colors.textPrimary,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        style={{ accentColor: '#7C3AED' }}
                      />
                      <span>{style.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Accessibility/Budget */}
              <h5 style={{ fontSize: '14px', fontWeight: 700, color: colors.textPrimary, margin: '16px 0 8px' }}>
                Food Accessibility & Budget
              </h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {ACCESSIBILITY_OPTIONS.map((acc) => {
                  const isSelected = accessibility === acc.id;
                  return (
                    <div
                      key={acc.id}
                      onClick={() => setAccessibility(acc.id)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: `1px solid ${isSelected ? '#7C3AED' : '#E2E8F0'}`,
                        backgroundColor: isSelected ? 'rgba(124, 58, 237, 0.04)' : '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: isSelected ? '#7C3AED' : colors.textPrimary }}>
                          {acc.label}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>{acc.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Context Confirmation Summary */}
          {step === 4 && (
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: colors.textPrimary, margin: '0 0 6px' }}>
                4. Confirm Your Nutrition Context
              </h4>
              <p style={{ fontSize: '13px', color: colors.textSecondary, margin: '0 0 16px' }}>
                Review report findings and context before AI diet plan synthesis.
              </p>

              {/* Report Findings Summary Card */}
              {reportFindings.length > 0 && (
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.04)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#B91C1C', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Target Report Findings ({reportFindings.length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {reportFindings.map((f, idx) => (
                      <span key={idx} style={{ fontSize: '12px', fontWeight: 600, color: '#B91C1C', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '3px 8px', borderRadius: '6px' }}>
                        {f.parameter}: {f.value} {f.unit}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* User Context Breakdown Table */}
              <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '16px' }}>
                <SummaryRow label="Food Preference" value={FOOD_PREFERENCES.find((p) => p.id === foodPreference)?.label || foodPreference} />
                <SummaryRow label="Dietary Restrictions" value={restrictions.length > 0 ? restrictions.join(', ') : 'None reported'} />
                <SummaryRow label="Regional Styles" value={regionalStyles.join(', ')} />
                <SummaryRow label="Accessibility" value={ACCESSIBILITY_OPTIONS.find((a) => a.id === accessibility)?.label || accessibility} />
                {clinicianRestrictions && (
                  <SummaryRow label="Clinician Instructions" value={clinicianRestrictions} highlight />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div style={{ padding: '16px 28px', backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#64748B',
                backgroundColor: 'transparent',
                border: '1px solid #CBD5E1',
                borderRadius: '10px',
                cursor: 'pointer',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
          ) : <div />}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 20px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#FFFFFF',
                backgroundColor: '#7C3AED',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              <span>Next Step</span>
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={isGenerating}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#FFFFFF',
                background: 'linear-gradient(90deg, #7C3AED 0%, #9333EA 100%)',
                border: 'none',
                borderRadius: '10px',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                fontFamily: 'Poppins, sans-serif',
                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)',
              }}
            >
              <Sparkles size={16} />
              <span>{isGenerating ? 'Generating Guidance...' : 'Generate Guidance'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, highlight = false }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #E2E8F0', fontSize: '13px' }}>
      <span style={{ color: '#64748B', fontWeight: 500 }}>{label}:</span>
      <span style={{ fontWeight: 600, color: highlight ? '#B91C1C' : colors.textPrimary, textTransform: 'capitalize' }}>{value}</span>
    </div>
  );
}
