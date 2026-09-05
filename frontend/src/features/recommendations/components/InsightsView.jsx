import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  BookOpen,
  HeartPulse,
  MessageCircle,
  CalendarClock,
  ShieldCheck,
  ArrowUp,
  ArrowDown,
  Info,
} from 'lucide-react';
import { colors } from '../../../theme/colors';
import { useTranslation } from '../../../i18n/translations';

const PRIORITY_CONFIG = {
  attention: {
    color: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.08)',
    border: 'rgba(239, 68, 68, 0.2)',
    icon: AlertTriangle,
    key: 'needs_attention',
    defaultLabel: 'Needs Attention',
    dot: '🔴',
  },
  monitoring: {
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.08)',
    border: 'rgba(245, 158, 11, 0.2)',
    icon: AlertCircle,
    key: 'needs_monitoring',
    defaultLabel: 'Needs Monitoring',
    dot: '🟡',
  },
  normal: {
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.08)',
    border: 'rgba(16, 185, 129, 0.2)',
    icon: CheckCircle2,
    key: 'within_range',
    defaultLabel: 'Within Range',
    dot: '🟢',
  },
};

function SummaryBar({ summary }) {
  const { t } = useTranslation();
  const totalAnalyzed = (summary?.attention || 0) + (summary?.monitoring || 0) + (summary?.normal || 0);
  const items = [
    { key: 'attention', count: summary?.attention || 0, ...PRIORITY_CONFIG.attention },
    { key: 'monitoring', count: summary?.monitoring || 0, ...PRIORITY_CONFIG.monitoring },
    { key: 'normal', count: summary?.normal || 0, ...PRIORITY_CONFIG.normal },
  ];

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        padding: '20px 24px',
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      <div style={{ flex: 1, minWidth: '160px' }}>
        <h3
          style={{
            fontSize: '14px',
            fontWeight: 700,
            color: colors.textSecondary,
            margin: '0 0 4px',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {t('report_summary', 'Report Summary')}
        </h3>
        <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>
          {t('parameters_analyzed', '{count} parameters analyzed', { count: totalAnalyzed })}
        </p>
      </div>

      {items.map((item) => (
        <div
          key={item.key}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 16px',
            backgroundColor: item.bg,
            border: `1px solid ${item.border}`,
            borderRadius: '12px',
            minWidth: '140px',
          }}
        >
          <span style={{ fontSize: '20px' }}>{item.dot}</span>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: item.color, lineHeight: 1 }}>
              {item.count}
            </div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: item.color }}>
              {t(item.key, item.defaultLabel)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function FindingCard({ finding, recommendation, sources, defaultExpanded = false }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [showEvidence, setShowEvidence] = useState(false);

  const config = PRIORITY_CONFIG[finding.priority] || PRIORITY_CONFIG.normal;
  const Icon = config.icon;
  const isNormal = finding.priority === 'normal';

  if (isNormal) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          backgroundColor: 'rgba(16, 185, 129, 0.04)',
          borderRadius: '10px',
          border: '1px solid rgba(16, 185, 129, 0.12)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle2 size={16} color="#10B981" />
          <span style={{ fontSize: '14px', fontWeight: 600, color: colors.textPrimary }}>
            {t(finding.parameter, finding.parameter)}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: colors.textPrimary, fontWeight: 600 }}>
            {finding.value} {finding.unit}
          </span>
          <span style={{ fontSize: '12px', color: '#94A3B8' }}>
            ({finding.reference_range})
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#10B981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              padding: '2px 8px',
              borderRadius: '6px',
            }}
          >
            ✓ {t('status_normal', 'Normal')}
          </span>
        </div>
      </div>
    );
  }

  const DirectionIcon = finding.status === 'high' ? ArrowUp : ArrowDown;
  const directionLabel = finding.status === 'high'
    ? t('above_reference_range', 'Above reference range')
    : t('below_reference_range', 'Below reference range');

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: `1px solid ${config.border}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Card Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          border: 'none',
          backgroundColor: config.bg,
          cursor: 'pointer',
          fontFamily: 'Poppins, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Icon size={20} color={config.color} />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: colors.textPrimary }}>
              {t(finding.parameter, finding.parameter)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <span style={{ fontSize: '17px', fontWeight: 800, color: config.color }}>
                {finding.value} {finding.unit}
              </span>
              <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                {t('reference', 'Reference')}: {finding.reference_range}
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              fontWeight: 600,
              color: config.color,
            }}
          >
            <DirectionIcon size={14} />
            <span>{directionLabel}</span>
          </div>
          {expanded ? (
            <ChevronUp size={18} color="#94A3B8" />
          ) : (
            <ChevronDown size={18} color="#94A3B8" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && recommendation && (
        <div style={{ padding: '20px' }}>
          {/* Why Flagged */}
          <div
            style={{
              backgroundColor: config.bg,
              borderRadius: '10px',
              padding: '14px 16px',
              marginBottom: '16px',
              borderLeft: `3px solid ${config.color}`,
            }}
          >
            <div
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: config.color,
                marginBottom: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {t('why_flagged', 'Why is this flagged?')}
            </div>
            <p style={{ fontSize: '13px', color: colors.textPrimary, margin: 0, lineHeight: '1.5' }}>
              {recommendation.why_flagged}
            </p>
          </div>

          {/* Simple Explanation */}
          {recommendation.simple_explanation && (
            <div
              style={{
                backgroundColor: '#F8FAFC',
                borderRadius: '10px',
                padding: '14px 16px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
              }}
            >
              <Info size={16} color="#64748B" style={{ flexShrink: 0, marginTop: '2px' }} />
              <p style={{ fontSize: '13px', color: '#475569', margin: 0, lineHeight: '1.5' }}>
                {recommendation.simple_explanation}
              </p>
            </div>
          )}

          {/* AI Guidance Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '14px',
            }}
          >
            <HeartPulse size={18} color={colors.primary} />
            <span style={{ fontSize: '14px', fontWeight: 700, color: colors.textPrimary }}>
              {t('ai_guidance', 'AI Guidance')}
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                color: colors.primary,
                backgroundColor: 'rgba(79, 70, 229, 0.08)',
                padding: '2px 8px',
                borderRadius: '6px',
              }}
            >
              {t('guidance_tag', 'Based on this finding and retrieved evidence')}
            </span>
          </div>

          {/* General Support */}
          {recommendation.general_support?.length > 0 && (
            <GuidanceSection
              icon={<HeartPulse size={16} color="#10B981" />}
              title={t('general_support', 'General Support')}
              items={recommendation.general_support}
              color="#10B981"
              bg="rgba(16, 185, 129, 0.06)"
            />
          )}

          {/* Discuss With Clinician */}
          {recommendation.discuss_with_clinician?.length > 0 && (
            <GuidanceSection
              icon={<MessageCircle size={16} color={colors.primary} />}
              title={t('discuss_clinician', 'Discuss With Your Clinician')}
              items={recommendation.discuss_with_clinician}
              color={colors.primary}
              bg="rgba(79, 70, 229, 0.06)"
            />
          )}

          {/* Follow-up */}
          {recommendation.follow_up?.length > 0 && (
            <GuidanceSection
              icon={<CalendarClock size={16} color="#F59E0B" />}
              title={t('follow_up', 'Follow-up')}
              items={recommendation.follow_up}
              color="#F59E0B"
              bg="rgba(245, 158, 11, 0.06)"
            />
          )}

          {/* Why This Recommendation - Evidence Trail */}
          <div style={{ marginTop: '12px' }}>
            <button
              type="button"
              onClick={() => setShowEvidence(!showEvidence)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                backgroundColor: 'rgba(79, 70, 229, 0.06)',
                border: '1px solid rgba(79, 70, 229, 0.15)',
                borderRadius: '8px',
                color: colors.primary,
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              <BookOpen size={14} />
              <span>{t('why_recommendation', 'Why this recommendation?')}</span>
              {showEvidence ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showEvidence && (
              <div
                style={{
                  marginTop: '10px',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  border: '1px solid #E2E8F0',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: colors.textSecondary, marginBottom: '10px' }}>
                  {t('recommendation_generated_from', 'Recommendation generated from:')}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <EvidenceItem label={`${finding.parameter} = ${finding.value} ${finding.unit}`} />
                  <EvidenceItem label={`Report reference = ${finding.reference_range}`} />
                  <EvidenceItem label={`Finding status = ${finding.status === 'high' ? 'Above range' : 'Below range'}`} />
                  <EvidenceItem
                    label={`Retrieved knowledge = ${recommendation.evidence_sources?.length || 0} relevant source(s)`}
                  />
                </div>

                {recommendation.evidence_sources?.length > 0 && sources?.length > 0 && (
                  <div style={{ marginTop: '12px', borderTop: '1px solid #E2E8F0', paddingTop: '10px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', marginBottom: '6px' }}>
                      {t('evidence_sources', 'EVIDENCE SOURCES')}
                    </div>
                    {sources
                      .filter((s) => recommendation.evidence_sources.includes(s.id))
                      .map((s, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '12px',
                            color: '#475569',
                            marginBottom: '4px',
                          }}
                        >
                          <ShieldCheck size={12} color={colors.primary} />
                          <span>
                            <strong>{s.title}</strong>
                            <span style={{ color: '#94A3B8' }}> — {s.category}</span>
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function GuidanceSection({ icon, title, items, color, bg }) {
  return (
    <div
      style={{
        backgroundColor: bg,
        borderRadius: '10px',
        padding: '14px 16px',
        marginBottom: '10px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '10px',
        }}
      >
        {icon}
        <span style={{ fontSize: '13px', fontWeight: 700, color }}>{title}</span>
      </div>
      <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
        {items.map((item, idx) => (
          <li
            key={idx}
            style={{
              fontSize: '13px',
              color: colors.textPrimary,
              lineHeight: '1.6',
              marginBottom: '6px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
            }}
          >
            <span style={{ color, fontWeight: 'bold', flexShrink: 0 }}>•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EvidenceItem({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569' }}>
      <CheckCircle2 size={13} color="#10B981" />
      <span>{label}</span>
    </div>
  );
}

export default function InsightsView({
  summary = {},
  findings = [],
  recommendations = [],
  sources = [],
}) {
  const { t } = useTranslation();
  const abnormalFindings = findings.filter((f) => f.priority !== 'normal');
  const normalFindings = findings.filter((f) => f.priority === 'normal');
  const [showNormal, setShowNormal] = useState(false);
  const [showAllNormal, setShowAllNormal] = useState(false);

  const visibleNormalFindings = showAllNormal ? normalFindings : normalFindings.slice(0, 5);

  const getRecForFinding = (param) =>
    recommendations.find(
      (r) => r.finding_parameter?.toLowerCase() === param?.toLowerCase()
    );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        fontFamily: 'Poppins, sans-serif',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <HeartPulse size={22} color={colors.primary} />
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: colors.textPrimary, margin: 0 }}>
          {t('ai_report_insights', 'AI Report Insights')}
        </h2>
      </div>

      {/* Summary Bar */}
      <SummaryBar summary={summary} />

      {/* Priority Findings */}
      {abnormalFindings.length > 0 && (
        <div>
          <h3
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: colors.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              margin: '8px 0 12px',
            }}
          >
            {t('priority_findings', 'Priority Findings')} ({abnormalFindings.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {abnormalFindings.map((finding, idx) => (
              <FindingCard
                key={idx}
                finding={finding}
                recommendation={getRecForFinding(finding.parameter)}
                sources={sources}
                defaultExpanded={idx === 0}
              />
            ))}
          </div>
        </div>
      )}

      {/* Normal Findings */}
      {normalFindings.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowNormal(!showNormal)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 0',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            <CheckCircle2 size={16} color="#10B981" />
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#10B981' }}>
              {t('normal_findings', 'Normal Findings')} ({normalFindings.length})
            </span>
            {showNormal ? (
              <ChevronUp size={16} color="#10B981" />
            ) : (
              <ChevronDown size={16} color="#10B981" />
            )}
          </button>
          {showNormal && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {visibleNormalFindings.map((finding, idx) => (
                <FindingCard key={idx} finding={finding} recommendation={null} sources={[]} />
              ))}
              {normalFindings.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllNormal(!showAllNormal)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    backgroundColor: '#FFFFFF',
                    color: colors.primary,
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginTop: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  {showAllNormal
                    ? t('show_less', 'Show Less')
                    : t('show_more_count', 'Show More (+{count} more)', { count: normalFindings.length - 5 })}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div
        style={{
          backgroundColor: 'rgba(124, 58, 237, 0.04)',
          border: '1px solid rgba(124, 58, 237, 0.15)',
          borderRadius: '12px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '12px',
          color: '#7C3AED',
          fontWeight: 500,
        }}
      >
        <ShieldCheck size={16} color="#7C3AED" />
        <span>
          {t('insights_disclaimer', 'AI-generated insights are for informational purposes only. All findings and recommendations should be reviewed by a qualified healthcare professional.')}
        </span>
      </div>
    </div>
  );
}
