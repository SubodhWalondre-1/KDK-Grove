import { useMemo, useState } from 'react';
import { Languages, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import LanguageToggle from './LanguageToggle';
import { useTranslatedLabels } from '../hooks/useTranslation';
import StatusBadge from '../../../components/StatusBadge';
import { colors } from '../../../theme/colors';

export default function ReportTranslationCard({ testValues = [] }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Prepare translation items for preview vs full list
  const translationItems = useMemo(() => {
    if (!testValues || testValues.length === 0) return [];

    const targetList = isExpanded ? testValues : testValues.slice(0, 3);
    const items = [];

    for (const tv of targetList) {
      if (tv.test_name) {
        items.push({ source_type: 'test_name', source_key: tv.test_name });
      }
      if (tv.status) {
        const statusLabel =
          tv.status === 'green' ? 'Normal' : tv.status === 'yellow' ? 'Borderline' : 'Abnormal';
        items.push({ source_type: 'status_label', source_key: statusLabel });
      }
    }

    return items;
  }, [testValues, isExpanded]);

  const { translations, isLoading, activeLanguage } = useTranslatedLabels(translationItems);
  const isEnglish = activeLanguage === 'en-IN' || activeLanguage === 'en';

  const visibleList = isExpanded ? testValues : testValues.slice(0, 3);

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
      {/* Header with Title and Language Toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'rgba(79, 70, 229, 0.1)',
              color: colors.primary,
            }}
          >
            <Languages size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: colors.textPrimary, margin: 0 }}>
              Report Translation
            </h3>
            <p style={{ fontSize: '12px', color: colors.textSecondary, margin: 0 }}>
              AI-powered translation in Indian languages
            </p>
          </div>
        </div>

        <LanguageToggle />
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px 0',
            gap: '10px',
            color: colors.primary,
          }}
        >
          <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '14px', fontWeight: 500 }}>Translating medical terms…</span>
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {visibleList.map((tv) => {
            const translatedTestName =
              translations.get(`test_name:${tv.test_name}`) || tv.test_name;
            const originalStatusLabel =
              tv.status === 'green' ? 'Normal' : tv.status === 'yellow' ? 'Borderline' : 'Abnormal';
            const translatedStatusLabel =
              translations.get(`status_label:${originalStatusLabel}`) || originalStatusLabel;

            return (
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
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: colors.textPrimary, margin: '0 0 2px' }}>
                    {translatedTestName}
                    {!isEnglish && (
                      <span style={{ fontSize: '11px', color: colors.textSecondary, marginLeft: '6px', fontWeight: 400 }}>
                        ({tv.test_name})
                      </span>
                    )}
                  </p>
                  <p style={{ fontSize: '12px', color: colors.textSecondary, margin: 0 }}>
                    {tv.value != null ? tv.value : '—'} {tv.unit || ''}
                  </p>
                </div>

                <StatusBadge status={tv.status} label={translatedStatusLabel} />
              </div>
            );
          })}
        </div>
      )}

      {/* Expand/Collapse Button (Hidden when English is selected) */}
      {!isEnglish && testValues.length > 3 && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            width: '100%',
            marginTop: '16px',
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
          <span>{isExpanded ? 'Show Preview Only' : 'Read Full Translation'}</span>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      )}
    </div>
  );
}
