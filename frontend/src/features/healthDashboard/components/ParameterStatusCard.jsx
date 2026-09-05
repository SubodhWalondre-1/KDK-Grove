import { useState } from 'react';
import { Droplets, Activity, Target, Atom, ChevronRight, Info, ExternalLink, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from '../../../i18n/translations';
import { colors } from '../../../theme/colors';
import { formatTestDisplayName } from '../../../utils/formatters';

const PARAM_ICONS = [
  { icon: Droplets, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' },
  { icon: Activity, color: '#7C3AED', bg: 'rgba(124, 58, 237, 0.1)' },
  { icon: Droplets, color: '#0EA5E9', bg: 'rgba(14, 165, 233, 0.1)' },
  { icon: Target, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
  { icon: Atom, color: '#6366F1', bg: 'rgba(99, 102, 241, 0.1)' },
];

export default function ParameterStatusCard({ testValues = [], onViewAll }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profileId } = useParams();

  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedParam, setSelectedParam] = useState(null);

  const filteredValues = testValues.filter((item) => {
    if (activeFilter === 'abnormal') return item.status === 'red' || item.status === 'yellow';
    if (activeFilter === 'normal') return item.status === 'green';
    return true;
  });

  const visibleItems = filteredValues.slice(0, 5);

  const handleRowClick = (item) => {
    setSelectedParam(item);
  };

  const handleGoToTrendDetail = (testName) => {
    if (profileId) {
      navigate(`/profiles/${profileId}/trends/${encodeURIComponent(testName)}`);
    } else {
      navigate(`/trends`);
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
        border: '1px solid #E2E8F0',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        fontFamily: 'Poppins, sans-serif',
      }}
    >
      {/* Header & Filter Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
          {t('parameter_status_title')}
        </h3>

        {/* Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#F1F5F9', padding: '3px', borderRadius: '8px' }}>
          {['all', 'abnormal', 'normal'].map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              style={{
                fontSize: '11px',
                fontWeight: activeFilter === filter ? 700 : 500,
                color: activeFilter === filter ? colors.primary : '#64748B',
                backgroundColor: activeFilter === filter ? '#FFFFFF' : 'transparent',
                border: 'none',
                borderRadius: '6px',
                padding: '3px 8px',
                cursor: 'pointer',
                textTransform: 'capitalize',
                boxShadow: activeFilter === filter ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              {t(filter)}
            </button>
          ))}
        </div>
      </div>

      {/* Items List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
        {visibleItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', fontSize: '13px', color: '#94A3B8' }}>
            No parameters match selected filter.
          </div>
        ) : (
          visibleItems.map((item, index) => {
            const iconConfig = PARAM_ICONS[index % PARAM_ICONS.length];
            const IconComp = iconConfig.icon;

            const isHigh = item.status === 'red' || item.status === 'yellow';
            const badgeBg = isHigh ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)';
            const badgeColor = isHigh ? '#EF4444' : '#10B981';
            const badgeText = isHigh ? t('status_high') : t('status_normal');

            return (
              <div
                key={item.id || item.test_name}
                onClick={() => handleRowClick(item)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #F1F5F9',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = colors.primary;
                  e.currentTarget.style.backgroundColor = 'rgba(79, 70, 229, 0.03)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#F1F5F9';
                  e.currentTarget.style.backgroundColor = '#F8FAFC';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '34px',
                      height: '34px',
                      borderRadius: '10px',
                      backgroundColor: iconConfig.bg,
                      color: iconConfig.color,
                    }}
                  >
                    <IconComp size={16} />
                  </div>

                  <span style={{ fontSize: '13px', fontWeight: 600, color: colors.textPrimary }}>
                    {formatTestDisplayName(item.test_name)}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: colors.textPrimary }}>
                    {item.value != null ? `${item.value} ${item.unit || ''}` : '—'}
                  </span>

                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '2px',
                      padding: '3px 8px',
                      borderRadius: '10px',
                      backgroundColor: badgeBg,
                      color: badgeColor,
                      fontSize: '11px',
                      fontWeight: 700,
                    }}
                  >
                    <span>{badgeText}</span>
                  </span>

                  <ChevronRight size={14} color="#94A3B8" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer link to view full report */}
      <div style={{ marginTop: '14px', textAlign: 'right' }}>
        <button
          type="button"
          onClick={onViewAll}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '13px',
            fontWeight: 600,
            color: colors.primary,
            cursor: 'pointer',
            padding: 0,
          }}
        >
          {t('view_all')} ({testValues.length}) ›
        </button>
      </div>

      {/* Parameter Detail Modal */}
      {selectedParam && (
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
          onClick={() => setSelectedParam(null)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '18px',
              maxWidth: '460px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
              border: '1px solid #E2E8F0',
              fontFamily: 'Poppins, sans-serif',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Info size={20} color={colors.primary} />
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
                  {formatTestDisplayName(selectedParam.test_name)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedParam(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: '#64748B' }}>Measured Value:</span>
                <span style={{ fontSize: '15px', fontWeight: 700, color: colors.textPrimary }}>
                  {selectedParam.value} {selectedParam.unit || ''}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: '#64748B' }}>Reference Range:</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: colors.textPrimary }}>
                  {selectedParam.ref_low != null && selectedParam.ref_high != null
                    ? `${selectedParam.ref_low} - ${selectedParam.ref_high} ${selectedParam.unit || ''}`
                    : 'Standard Reference Range'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#64748B' }}>Clinical Status:</span>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    backgroundColor: selectedParam.status === 'green' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: selectedParam.status === 'green' ? '#10B981' : '#EF4444',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  {selectedParam.status === 'green' ? t('status_normal') : t('status_high')}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const name = selectedParam.test_name;
                setSelectedParam(null);
                handleGoToTrendDetail(name);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#FFFFFF',
                background: 'linear-gradient(90deg, #4F46E5 0%, #7C3AED 100%)',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
              }}
            >
              <span>View Longitudinal Trend</span>
              <ExternalLink size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
