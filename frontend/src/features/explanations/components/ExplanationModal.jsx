import React, { useState, useEffect } from 'react';
import { HelpCircle, AlertCircle, Loader2, X } from 'lucide-react';
import { getExplanation } from '../../../api/explanationsApi';
import { colors } from '../../../theme/colors';

export default function ExplanationModal({
  reportId,
  valueId,
  testName,
  open,
  onOpenChange,
}) {
  const [explanationCache, setExplanationCache] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // LAZY FETCH: only trigger fetch when open is true and valueId is present
    if (!open || !reportId || !valueId) {
      return;
    }

    // Check local session cache first
    if (explanationCache[valueId]) {
      return;
    }

    setLoading(true);
    setError('');

    getExplanation(reportId, valueId)
      .then((data) => {
        setExplanationCache((prev) => ({
          ...prev,
          [valueId]: data.explanation_text,
        }));
      })
      .catch((err) => {
        setError(err.response?.data?.detail || 'Failed to load explanation. Please try again.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [open, reportId, valueId, explanationCache]);

  if (!open) return null;

  const explanationText = valueId ? explanationCache[valueId] : null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
      onClick={() => onOpenChange(false)}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
          padding: '24px',
          fontFamily: 'Poppins, sans-serif',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'none',
            border: 'none',
            color: colors.textMuted,
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '8px',
          }}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ marginBottom: '16px' }}>
          <h3
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '18px',
              fontWeight: 700,
              color: colors.textPrimary,
              margin: '0 0 4px',
            }}
          >
            <HelpCircle size={20} color={colors.primary} />
            <span>What is {testName || 'this test'}?</span>
          </h3>
          <p style={{ fontSize: '13px', color: colors.textSecondary, margin: 0 }}>
            Plain-English breakdown of this medical lab marker
          </p>
        </div>

        {/* Body */}
        <div style={{ minHeight: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {loading && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                gap: '12px',
                color: colors.textSecondary,
              }}
            >
              <Loader2 className="animate-spin" size={28} color={colors.primary} />
              <span style={{ fontSize: '14px', fontWeight: 500 }}>Fetching explanation...</span>
            </div>
          )}

          {!loading && error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '14px 16px',
                borderRadius: '10px',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: colors.danger,
                fontSize: '13px',
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && explanationText && (
            <div
              style={{
                fontSize: '15px',
                lineHeight: '1.6',
                color: colors.textPrimary,
                backgroundColor: colors.surfaceHover,
                padding: '16px 20px',
                borderRadius: '12px',
                border: `1px solid ${colors.borderLight}`,
              }}
            >
              {explanationText}
            </div>
          )}
        </div>

        {/* ALWAYS rendered fixed disclaimer */}
        <div
          style={{
            marginTop: '20px',
            paddingTop: '14px',
            borderTop: `1px dashed ${colors.borderLight}`,
            fontSize: '12px',
            color: colors.textMuted,
            fontStyle: 'italic',
            lineHeight: '1.5',
            textAlign: 'center',
          }}
        >
          General information only — not a diagnosis. Talk to a doctor or vet about your specific results.
        </div>
      </div>
    </div>
  );
}
