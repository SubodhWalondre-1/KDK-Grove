import { Flame, ShieldCheck, ClipboardList, ChevronRight, Sparkles } from 'lucide-react';
import GaugeChart from '../../../charts/GaugeChart';
import { useTranslation } from '../../../i18n/translations';
import { colors } from '../../../theme/colors';

export default function TopMetricCardsRow({
  healthScore = 0,
  healthScoreLabel = 'Healthy',
  abnormalCount = 0,
  normalCount = 0,
  totalCount = 0,
  onViewAbnormal,
  onViewNormal,
  onViewAll,
}) {
  const { t } = useTranslation();

  const getScoreBadgeColor = (label = '') => {
    const l = label.toLowerCase();
    if (l.includes('excellent') || l.includes('healthy') || l.includes('optimal')) return '#10B981';
    if (l.includes('moderate') || l.includes('attention')) return '#F59E0B';
    return '#EF4444';
  };

  const badgeColor = getScoreBadgeColor(healthScoreLabel);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '16px',
        marginBottom: '20px',
        fontFamily: 'Poppins, sans-serif',
      }}
    >
      {/* CARD 1: AI Health Score */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h4 style={{ fontSize: '13px', fontWeight: 600, color: colors.textSecondary, margin: '0 0 8px' }}>
          {t('ai_health_score')}
        </h4>

        <GaugeChart value={healthScore} label={`${Math.round(healthScore)}/100`} />

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 12px',
            borderRadius: '20px',
            backgroundColor: `${badgeColor}12`,
            color: badgeColor,
            fontSize: '12px',
            fontWeight: 700,
            marginTop: '8px',
          }}
        >
          <Sparkles size={12} />
          <span>{healthScoreLabel}</span>
        </div>
      </div>

      {/* CARD 2: Abnormal Parameters */}
      <div
        onClick={onViewAbnormal}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          cursor: onViewAbnormal ? 'pointer' : 'default',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              color: '#F59E0B',
            }}
          >
            <Flame size={22} />
          </div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: colors.textPrimary }}>
            {t('abnormal_parameters')}
          </span>
        </div>

        <div style={{ fontSize: '32px', fontWeight: 800, color: '#EF4444', margin: '14px 0 8px' }}>
          {abnormalCount}
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#EF4444',
            }}
          >
            <span>{t('needs_attention')}</span>
            <ChevronRight size={14} />
          </span>
        </div>
      </div>

      {/* CARD 3: Normal Parameters */}
      <div
        onClick={onViewNormal}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          cursor: onViewNormal ? 'pointer' : 'default',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              color: '#10B981',
            }}
          >
            <ShieldCheck size={22} />
          </div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: colors.textPrimary }}>
            {t('normal_parameters')}
          </span>
        </div>

        <div style={{ fontSize: '32px', fontWeight: 800, color: '#10B981', margin: '14px 0 8px' }}>
          {normalCount}
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#10B981',
            }}
          >
            <span>{t('within_range')}</span>
            <ChevronRight size={14} />
          </span>
        </div>
      </div>

      {/* CARD 4: Total Parameters */}
      <div
        onClick={onViewAll}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          cursor: onViewAll ? 'pointer' : 'default',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: 'rgba(79, 70, 229, 0.12)',
              color: colors.primary,
            }}
          >
            <ClipboardList size={22} />
          </div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: colors.textPrimary }}>
            {t('total_parameters')}
          </span>
        </div>

        <div style={{ fontSize: '32px', fontWeight: 800, color: colors.primary, margin: '14px 0 8px' }}>
          {totalCount}
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              fontWeight: 600,
              color: colors.primary,
            }}
          >
            <span>{t('analyzed')}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
