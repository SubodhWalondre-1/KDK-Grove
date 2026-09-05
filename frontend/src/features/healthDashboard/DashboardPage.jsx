import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Loader2,
  AlertTriangle,
  ShieldX,
  Calendar,
  Download,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  Search,
  Share2,
} from 'lucide-react';
import PageLayout from '../../components/layout/PageLayout';
import TopMetricCardsRow from './components/TopMetricCardsRow';
import HealthOverviewRadarChart from '../../charts/HealthOverviewRadarChart';
import ParameterStatusCard from './components/ParameterStatusCard';
import TrendsOverTimeCard from './components/TrendsOverTimeCard';
import AiInsightCard from './components/AiInsightCard';
import TopRecommendationsRow from './components/TopRecommendationsRow';
import ReportTranslationCard from '../translation/components/ReportTranslationCard';
import UrgentCareBanner from '../recommendations/components/UrgentCareBanner';
import InsightsView from '../recommendations/components/InsightsView';
import ShareModal from '../sharing/components/ShareModal';
import { formatTestDisplayName } from '../../utils/formatters';
import StatusBadge from '../../components/StatusBadge';
import { getDashboard, getProfileReports } from '../../api/dashboardApi';
import { getRecommendations, generateRecommendations } from '../../api/recommendationsApi';
import { downloadReportPdf } from '../../api/reportsApi';
import { extractFilenameFromDisposition, downloadBlob, getDownloadErrorMessage } from '../../utils/helpers';
import { useProfileStore } from '../../store/profileStore';
import { useTranslation } from '../../i18n/translations';
import { colors } from '../../theme/colors';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { reportId } = useParams();
  const navigate = useNavigate();
  const activeProfile = useProfileStore((s) => s.activeProfile);

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFullReport, setShowFullReport] = useState(false);
  const [tableSearchQuery, setTableSearchQuery] = useState('');

  // Historical reports dropdown state
  const [reportsList, setReportsList] = useState([]);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);

  // Recommendations state
  const [recs, setRecs] = useState(null);
  const [recsGenerating, setRecsGenerating] = useState(false);

  // Share modal state
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Download report state
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getDashboard(reportId)
      .then((data) => {
        if (!cancelled) setDashboard(data);
        if (data?.profile_id) {
          return getProfileReports(data.profile_id);
        }
        return [];
      })
      .then((repList) => {
        if (!cancelled && Array.isArray(repList)) {
          setReportsList(repList);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          const status = err.response?.status;
          if (status === 404) {
            setError({ type: 'not_found', message: 'Report not found' });
          } else if (status === 403) {
            setError({ type: 'forbidden', message: 'You are not authorized to view this report' });
          } else {
            setError({ type: 'generic', message: 'Failed to load dashboard data' });
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    getRecommendations(reportId)
      .then(async (data) => {
        if (cancelled) return;
        if (data?.has_been_generated && (data?.findings?.length > 0 || data?.recommendations?.length > 0)) {
          setRecs(data);
        } else {
          // Auto-generate recommendations upon opening dashboard
          setRecsGenerating(true);
          try {
            const freshData = await generateRecommendations(reportId, true);
            if (!cancelled) setRecs(freshData);
          } catch {
            if (!cancelled) setRecs(data);
          } finally {
            if (!cancelled) setRecsGenerating(false);
          }
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [reportId]);

  const handleGenerateRecs = async () => {
    setRecsGenerating(true);
    try {
      const data = await generateRecommendations(reportId, true);
      setRecs(data);
    } catch {
      // Inline error handling
    } finally {
      setRecsGenerating(false);
    }
  };

  const handleDownloadReport = async () => {
    if (downloading) return;
    if (!reportId) {
      setDownloadError('No report ID specified.');
      return;
    }

    setDownloading(true);
    setDownloadError('');
    setDownloadSuccess(false);

    try {
      const response = await downloadReportPdf(reportId);
      const disposition = response.headers?.['content-disposition'] || response.headers?.['Content-Disposition'];
      const filename = extractFilenameFromDisposition(
        disposition,
        `Mediora_Report_${reportId}.pdf`
      );
      downloadBlob(response.data, filename);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 6000);
    } catch (err) {
      const message = await getDownloadErrorMessage(err);
      setDownloadError(message);
    } finally {
      setDownloading(false);
    }
  };

  const handleSelectReport = (targetId) => {
    setDateDropdownOpen(false);
    navigate(`/reports/${targetId}/dashboard`);
  };

  if (loading) {
    return (
      <PageLayout>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1140px', margin: '0 auto' }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                padding: '24px',
                height: i === 1 ? '320px' : '200px',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            >
              <div style={{ width: '40%', height: '16px', backgroundColor: '#E2E8F0', borderRadius: '4px', marginBottom: '16px' }} />
              <div style={{ width: '70%', height: '12px', backgroundColor: '#F1F5F9', borderRadius: '4px' }} />
            </div>
          ))}
          <style>{`
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.6; }
            }
          `}</style>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 24px',
            fontFamily: 'Poppins, sans-serif',
            textAlign: 'center',
          }}
        >
          {error.type === 'forbidden' ? (
            <ShieldX size={48} color={colors.danger} />
          ) : (
            <AlertTriangle size={48} color={colors.warning} />
          )}
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: colors.textPrimary, margin: '16px 0 8px' }}>
            {error.message}
          </h2>
          <p style={{ color: colors.textSecondary, fontSize: '14px', margin: 0 }}>
            {error.type === 'forbidden'
              ? 'This report belongs to another account.'
              : 'The report may have been deleted or the URL is incorrect.'}
          </p>
        </div>
      </PageLayout>
    );
  }

  if (!dashboard) return null;

  const profileName = activeProfile?.profile_name || dashboard.profile_name || 'Daisy';
  const totalCount = dashboard.test_values?.length || 0;
  const abnormalCount = dashboard.abnormal_values?.length || 0;
  const normalCount = Math.max(0, totalCount - abnormalCount);
  const formattedDate = dashboard.report_date || '10 May 2025';

  const filteredTestValues = (dashboard.test_values || []).filter((tv) =>
    tv.test_name.toLowerCase().includes(tableSearchQuery.toLowerCase())
  );

  return (
    <PageLayout>
      <div
        style={{
          maxWidth: '1140px',
          margin: '0 auto',
          fontFamily: 'Poppins, sans-serif',
          color: colors.textPrimary,
        }}
      >
        {/* Top Header Banner: Greeting & Dynamic Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '26px',
                fontWeight: 800,
                color: colors.textPrimary,
                margin: '0 0 4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>{t('hi_greeting')} {profileName}!</span>
              <span>👋</span>
            </h1>
            <p style={{ fontSize: '14px', color: colors.textSecondary, margin: 0 }}>
              {t('health_overview_sub', null, { name: profileName })}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Interactive Report Date Switcher Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 16px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                  cursor: 'pointer',
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                <Calendar size={18} color="#64748B" />
                <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                  <span style={{ fontSize: '10px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>
                    {t('report_date_label')}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: colors.textPrimary, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>{formattedDate}</span>
                    <ChevronDown size={14} color="#64748B" />
                  </span>
                </div>
              </button>

              {dateDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    right: 0,
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    border: '1px solid #E2E8F0',
                    zIndex: 100,
                    minWidth: '200px',
                    padding: '6px 0',
                  }}
                >
                  <div style={{ padding: '6px 14px', fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>
                    Select Lab Report
                  </div>
                  {reportsList.length > 0 ? (
                    reportsList.map((rep) => (
                      <button
                        key={rep.id}
                        type="button"
                        onClick={() => handleSelectReport(rep.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                          padding: '10px 14px',
                          border: 'none',
                          backgroundColor: parseInt(reportId, 10) === rep.id ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
                          color: parseInt(reportId, 10) === rep.id ? colors.primary : colors.textPrimary,
                          fontSize: '13px',
                          fontWeight: parseInt(reportId, 10) === rep.id ? 700 : 500,
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <span>Report #{rep.id}</span>
                        <span style={{ fontSize: '11px', color: '#64748B' }}>{rep.report_date || 'Date N/A'}</span>
                      </button>
                    ))
                  ) : (
                    <div style={{ padding: '10px 14px', fontSize: '12px', color: '#64748B' }}>
                      Current Report #{reportId}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Share Report Button */}
            <button
              type="button"
              onClick={() => setShareModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 600,
                color: colors.primary,
                backgroundColor: 'rgba(79, 70, 229, 0.08)',
                border: '1px solid rgba(79, 70, 229, 0.2)',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              <Share2 size={18} />
              <span>{t('share_report_btn') || 'Share Report'}</span>
            </button>

            {/* Download Report Button */}
            <button
              type="button"
              onClick={handleDownloadReport}
              disabled={downloading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#FFFFFF',
                background: downloading
                  ? '#64748B'
                  : 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                border: 'none',
                borderRadius: '12px',
                cursor: downloading ? 'not-allowed' : 'pointer',
                boxShadow: downloading ? 'none' : '0 4px 12px rgba(79, 70, 229, 0.25)',
                transition: 'all 0.2s ease',
                fontFamily: 'Poppins, sans-serif',
                opacity: downloading ? 0.85 : 1,
              }}
            >
              {downloading ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Downloading...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <CheckCircle2 size={18} />
                  <span>Downloaded!</span>
                </>
              ) : (
                <>
                  <Download size={18} />
                  <span>{t('download_report_btn')}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Download Feedback Banners */}
        {downloadError && (
          <div
            style={{
              marginBottom: '20px',
              padding: '12px 16px',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '12px',
              color: colors.danger,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} />
              <span>{downloadError}</span>
            </div>
            <button
              type="button"
              onClick={() => setDownloadError('')}
              style={{
                background: 'none',
                border: 'none',
                color: colors.danger,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '18px',
                padding: '0 4px',
              }}
            >
              ×
            </button>
          </div>
        )}

        {downloadSuccess && (
          <div
            style={{
              marginBottom: '20px',
              padding: '12px 16px',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '12px',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} />
              <span>Encrypted report downloaded successfully. Enter your password in your PDF viewer to open it.</span>
            </div>
            <button
              type="button"
              onClick={() => setDownloadSuccess(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#059669',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '18px',
                padding: '0 4px',
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* 4 KPI Metric Cards Row */}
        <TopMetricCardsRow
          healthScore={dashboard.health_score}
          healthScoreLabel={dashboard.health_score_label}
          abnormalCount={abnormalCount}
          normalCount={normalCount}
          totalCount={totalCount}
          onViewAbnormal={() => setShowFullReport(true)}
          onViewNormal={() => setShowFullReport(true)}
          onViewAll={() => setShowFullReport(true)}
        />

        {/* Row 1 Grid: Health Overview (Radar) & Parameter Status */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '20px',
            marginBottom: '20px',
          }}
        >
          {/* Left Column: Health Overview Radar Chart */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
              border: '1px solid #E2E8F0',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}
            >
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
                {t('health_overview_title')}
              </h3>
            </div>

            <HealthOverviewRadarChart
              testValues={dashboard.test_values}
              profileName={profileName}
            />
          </div>

          {/* Right Column: Parameter Status List */}
          <div>
            <ParameterStatusCard
              testValues={dashboard.test_values}
              onViewAll={() => setShowFullReport(true)}
            />
          </div>
        </div>

        {/* Row 2 Grid: Trends Over Time & AI Insight */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '20px',
            marginBottom: '20px',
          }}
        >
          {/* Left Column: Trends Over Time */}
          <div>
            <TrendsOverTimeCard trendData={dashboard.parameter_trend} />
          </div>

          {/* Right Column: AI Insight Mascot Card */}
          <div>
            <AiInsightCard
              abnormalValues={dashboard.abnormal_values}
              profileName={profileName}
            />
          </div>
        </div>

        {/* Row 3: Top Recommendations */}
        <TopRecommendationsRow profileName={profileName} />

        {/* Deep Insights & AI Translation Tools Section */}
        <div style={{ marginTop: '28px' }}>
          {recs && !recs.has_been_generated ? (
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
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
                    backgroundColor: 'rgba(79, 70, 229, 0.08)',
                    color: colors.primary,
                  }}
                >
                  <Sparkles size={22} />
                </div>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, color: colors.textPrimary, margin: '0 0 2px' }}>
                    Personalized Health Recommendations
                  </h4>
                  <p style={{ fontSize: '13px', color: colors.textSecondary, margin: 0 }}>
                    Get AI-synthesized diet, exercise, and lifestyle guidance tailored for this report
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateRecs}
                disabled={recsGenerating}
                style={{
                  padding: '10px 18px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  background: 'linear-gradient(90deg, #4F46E5 0%, #7C3AED 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: recsGenerating ? 'not-allowed' : 'pointer',
                  fontFamily: 'Poppins, sans-serif',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                }}
              >
                {recsGenerating ? (
                  <>
                    <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    <span>Generate</span>
                  </>
                )}
              </button>
            </div>
          ) : recs?.has_been_generated ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {recs.is_urgent && (
                <UrgentCareBanner message={recs.urgent_care_message} />
              )}
              <InsightsView
                summary={recs.summary}
                findings={recs.findings}
                recommendations={recs.recommendations}
                sources={recs.sources}
              />
            </div>
          ) : null}
        </div>

        {/* AI Report Translation Card */}
        <div style={{ marginTop: '20px' }}>
          <ReportTranslationCard testValues={dashboard.test_values} />
        </div>

        {/* Full Interactive Lab Report Table Modal */}
        {showFullReport && (
          <div
            style={{
              marginTop: '24px',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid #E2E8F0',
              padding: '24px',
              overflowX: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
                Full Lab Report — Extracted Test Values ({filteredTestValues.length})
              </h3>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Search Bar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 12px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                  }}
                >
                  <Search size={16} color="#64748B" />
                  <input
                    type="text"
                    placeholder={t('search_placeholder')}
                    value={tableSearchQuery}
                    onChange={(e) => setTableSearchQuery(e.target.value)}
                    style={{
                      border: 'none',
                      backgroundColor: 'transparent',
                      outline: 'none',
                      fontSize: '13px',
                      fontFamily: 'Poppins, sans-serif',
                      width: '160px',
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setShowFullReport(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: colors.textSecondary,
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  {t('close')} ✕
                </button>
              </div>
            </div>

            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13.5px',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              <thead>
                <tr style={{ borderBottom: '2px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                  <th style={{ textAlign: 'left', padding: '12px 14px', color: colors.textSecondary, fontWeight: 700 }}>Test Name</th>
                  <th style={{ textAlign: 'right', padding: '12px 14px', color: colors.textSecondary, fontWeight: 700 }}>Extracted Value</th>
                  <th style={{ textAlign: 'center', padding: '12px 14px', color: colors.textSecondary, fontWeight: 700 }}>Unit</th>
                  <th style={{ textAlign: 'center', padding: '12px 14px', color: colors.textSecondary, fontWeight: 700 }}>Reference Range</th>
                  <th style={{ textAlign: 'center', padding: '12px 14px', color: colors.textSecondary, fontWeight: 700 }}>Clinical Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTestValues.map((tv) => (
                  <tr
                    key={tv.id || tv.test_name}
                    style={{ borderBottom: '1px solid #F1F5F9' }}
                  >
                    <td style={{ padding: '12px 14px', color: colors.textPrimary, fontWeight: 600 }}>
                      {formatTestDisplayName(tv.test_name)}
                    </td>
                    <td style={{ textAlign: 'right', padding: '12px 14px', fontWeight: 700, color: colors.textPrimary }}>
                      {tv.value != null ? tv.value : '—'}
                    </td>
                    <td style={{ textAlign: 'center', padding: '12px 14px', color: colors.textSecondary }}>
                      {tv.unit || '—'}
                    </td>
                    <td style={{ textAlign: 'center', padding: '12px 14px', color: colors.textSecondary }}>
                      {tv.ref_low != null && tv.ref_high != null
                        ? `${tv.ref_low}–${tv.ref_high}`
                        : '—'}
                    </td>
                    <td style={{ textAlign: 'center', padding: '12px 14px' }}>
                      <StatusBadge status={tv.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Disclaimer Banner */}
        <div
          style={{
            marginTop: '32px',
            marginBottom: '16px',
            backgroundColor: 'rgba(124, 58, 237, 0.06)',
            border: '1px solid rgba(124, 58, 237, 0.15)',
            borderRadius: '14px',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#7C3AED',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={18} color="#7C3AED" />
          <span>{t('ai_disclaimer')}</span>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Share Report Modal */}
      <ShareModal
        reportId={parseInt(reportId, 10)}
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
      />
    </PageLayout>
  );
}
