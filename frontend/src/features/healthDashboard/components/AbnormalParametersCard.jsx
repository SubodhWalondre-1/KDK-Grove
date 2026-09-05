import { useState } from 'react';
import StatusBadge from '../../../components/StatusBadge';
import { colors } from '../../../theme/colors';
import { CheckCircle, HelpCircle } from 'lucide-react';
import ExplanationModal from '../../explanations/components/ExplanationModal';

export default function AbnormalParametersCard({ abnormalValues = [], onViewFullReport }) {
  const [selectedExplanation, setSelectedExplanation] = useState({ reportId: null, valueId: null, testName: '' });
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '14px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
        padding: '24px',
        fontFamily: 'Poppins, sans-serif',
      }}
    >
      <h3
        style={{
          fontSize: '15px',
          fontWeight: 600,
          color: colors.textPrimary,
          margin: '0 0 16px',
        }}
      >
        Abnormal Parameters
      </h3>

      {abnormalValues.length === 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            padding: '24px 0',
            color: colors.success,
          }}
        >
          <CheckCircle size={32} />
          <p
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: colors.success,
              margin: 0,
            }}
          >
            All your values are within normal range
          </p>
          <p
            style={{
              fontSize: '12px',
              color: colors.textSecondary,
              margin: 0,
            }}
          >
            Keep up the healthy lifestyle!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {abnormalValues.map((tv) => (
            <div
              key={tv.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                backgroundColor: '#F8FAFC',
                borderRadius: '10px',
                gap: '12px',
              }}
            >
              {/* Left: test name + ref range */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: colors.textPrimary,
                    margin: '0 0 2px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tv.test_name}
                </p>
                <p
                  style={{
                    fontSize: '11px',
                    color: colors.textSecondary,
                    margin: 0,
                  }}
                >
                  {tv.ref_low != null && tv.ref_high != null
                    ? `Normal range: ${tv.ref_low}–${tv.ref_high} ${tv.unit || ''}`
                    : 'Reference range unavailable'}
                </p>
              </div>

              {/* Center: value + unit */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <span
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: colors.textPrimary,
                  }}
                >
                  {tv.value != null ? tv.value : '—'}
                </span>
                {tv.unit && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 500,
                      color: colors.textSecondary,
                      marginLeft: '3px',
                    }}
                  >
                    {tv.unit}
                  </span>
                )}
              </div>

              {/* Right: badge + Explain button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <StatusBadge status={tv.status} />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedExplanation({
                      reportId: tv.report_id,
                      valueId: tv.id || tv.value_id,
                      testName: tv.test_name,
                    });
                    setModalOpen(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: colors.primary,
                    backgroundColor: 'rgba(79, 70, 229, 0.06)',
                    border: '1px solid rgba(79, 70, 229, 0.15)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                  title="Explain this lab marker"
                >
                  <HelpCircle size={14} />
                  <span>Explain</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {onViewFullReport && (
        <button
          onClick={onViewFullReport}
          style={{
            display: 'block',
            width: '100%',
            marginTop: '18px',
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: 600,
            color: colors.primary,
            backgroundColor: 'rgba(79, 70, 229, 0.06)',
            border: '1px solid rgba(79, 70, 229, 0.15)',
            borderRadius: '10px',
            cursor: 'pointer',
            fontFamily: 'Poppins, sans-serif',
            transition: 'background-color 0.2s',
          }}
        >
          View Full Report
        </button>
      )}

      <ExplanationModal
        reportId={selectedExplanation.reportId}
        valueId={selectedExplanation.valueId}
        testName={selectedExplanation.testName}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
