import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  HelpCircle,
  Activity,
  LineChart as LineChartIcon,
  Loader2,
  Users,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Sparkles,
  Utensils,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  BookOpen,
  Download,
  Share2,
} from 'lucide-react';
import PageLayout from '../../components/layout/PageLayout';
import LineTrendChart from '../../charts/LineTrendChart';
import StatusBadge from '../../components/StatusBadge';
import InsightsView from '../recommendations/components/InsightsView';
import { getTrendOverview } from '../../api/trendsApi';
import { getProfileHealthScore } from '../../api/dashboardApi';
import { getRecommendations, generateRecommendations } from '../../api/recommendationsApi';
import { useProfileStore } from '../../store/profileStore';
import { useTranslation } from '../../i18n/translations';
import { colors } from '../../theme/colors';
import { formatTestDisplayName } from '../../utils/formatters';

const DIRECTION_ICONS = {
  increasing: TrendingUp,
  decreasing: TrendingDown,
  stable: Minus,
  insufficient_data: HelpCircle,
  reference_data_unavailable: HelpCircle,
};

export default function TrendsPage() {
  const { t } = useTranslation();
  const { profileId } = useParams();
  const navigate = useNavigate();

  const activeProfile = useProfileStore((s) => s.activeProfile);
  const targetProfileId = profileId ? parseInt(profileId, 10) : activeProfile?.id;

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 3-Block parameter expansion toggle
  const [showAllTests, setShowAllTests] = useState(false);

  // Recommendations state
  const [latestReportId, setLatestReportId] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [generatingRecs, setGeneratingRecs] = useState(false);
  const [recError, setRecError] = useState('');

  // Fetch trend overview data
  useEffect(() => {
    if (!targetProfileId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError('');

    getTrendOverview(targetProfileId)
      .then((data) => {
        if (!cancelled) setOverview(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.detail || 'Failed to load health trends');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [targetProfileId]);

  // Fetch latest report ID and recommendations
  useEffect(() => {
    if (!targetProfileId) return;

    let cancelled = false;
    setLoadingRecs(true);

    getProfileHealthScore(targetProfileId)
      .then((scoreData) => {
        if (cancelled) return;
        if (scoreData?.latest_report_id) {
          setLatestReportId(scoreData.latest_report_id);
          return getRecommendations(scoreData.latest_report_id);
        }
        return null;
      })
      .then((recData) => {
        if (!cancelled && recData) {
          // If recommendation hasn't been generated yet or only has urgent care row, auto-generate
          if (!recData.has_been_generated || (recData.is_urgent && (!recData.findings || recData.findings.length === 0))) {
            if (recData.report_id) {
              return generateRecommendations(recData.report_id, true);
            }
          }
          return recData;
        }
        return null;
      })
      .then((finalRecData) => {
        if (!cancelled && finalRecData) {
          setRecommendations(finalRecData);
        }
      })
      .catch((err) => {
        console.warn('Recommendations fetch info:', err);
      })
      .finally(() => {
        if (!cancelled) setLoadingRecs(false);
      });

    return () => {
      cancelled = true;
    };
  }, [targetProfileId]);

  const handleGenerateRecs = async (forceRegenerate = false) => {
    if (!latestReportId) return;
    setGeneratingRecs(true);
    setRecError('');
    try {
      const data = await generateRecommendations(latestReportId, forceRegenerate);
      setRecommendations(data);
    } catch (err) {
      setRecError(err.response?.data?.detail || 'Failed to generate recommendations');
    } finally {
      setGeneratingRecs(false);
    }
  };

  if (!targetProfileId) {
    return (
      <PageLayout>
        <div
          style={{
            fontFamily: 'Poppins, sans-serif',
            maxWidth: '560px',
            margin: '60px auto 0',
            textAlign: 'center',
            backgroundColor: '#FFFFFF',
            borderRadius: '14px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
            padding: '40px 24px',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'rgba(79, 70, 229, 0.1)',
              color: colors.primary,
              marginBottom: '16px',
            }}
          >
            <Users size={28} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: colors.textPrimary, margin: '0 0 8px' }}>
            No Active Patient Profile
          </h2>
          <p style={{ fontSize: '14px', color: colors.textSecondary, margin: '0 0 24px' }}>
            Please select a patient profile to view cross-report trend insights.
          </p>

          <Link
            to="/profiles"
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 600,
              color: '#FFFFFF',
              background: 'linear-gradient(90deg, #4F46E5 0%, #7C3AED 100%)',
              borderRadius: '10px',
              textDecoration: 'none',
            }}
          >
            Select Profile
          </Link>
        </div>
      </PageLayout>
    );
  }

  const hsTrend = overview?.health_score_trend;
  const tests = overview?.tests || [];
  const visibleTests = showAllTests ? tests : tests.slice(0, 3);
  const speciesCategory = activeProfile?.species || 'patient';

  const handleRecommendationClick = () => {
    const el = document.getElementById('recommendations-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (latestReportId) {
      navigate(`/reports/${latestReportId}/recommendations`);
    }
  };

  const handleDownloadReport = () => {
    window.print();
  };

  return (
    <PageLayout>
      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          fontFamily: 'Poppins, sans-serif',
        }}
      >
        {/* Header with Title and 4 Quick Action Options */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: colors.textPrimary,
                margin: '0 0 4px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <LineChartIcon size={24} color={colors.primary} />
              <span>Health Insights & Trends</span>
            </h1>
            <p style={{ fontSize: '14px', color: colors.textSecondary, margin: 0 }}>
              Longitudinal parameter tracking across lab reports for{' '}
              <strong>{activeProfile?.profile_name || 'Patient'}</strong>
            </p>
          </div>

          {/* 4 Action Options: Diet Plan, Recommendation, Downloads, Share Link */}
          <div
            className="no-print"
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '4px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              gap: '4px',
            }}
          >
            {/* 1. Diet Plan */}
            <button
              onClick={() => navigate(latestReportId ? `/reports/${latestReportId}/diet-plan` : '/diet-plan')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'transparent',
                color: colors.textPrimary,
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: 'Poppins, sans-serif',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(79, 70, 229, 0.08)';
                e.currentTarget.style.color = colors.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = colors.textPrimary;
              }}
              title="View personalized diet & nutrition plan"
            >
              <Utensils size={16} color={colors.primary} />
              <span>Diet Plan</span>
            </button>

            <div style={{ width: '1px', height: '20px', backgroundColor: '#E2E8F0' }} />

            {/* 2. Recommendation */}
            <button
              onClick={handleRecommendationClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'transparent',
                color: colors.textPrimary,
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: 'Poppins, sans-serif',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(79, 70, 229, 0.08)';
                e.currentTarget.style.color = colors.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = colors.textPrimary;
              }}
              title="View AI health precautions & recommendations"
            >
              <Sparkles size={16} color={colors.primary} />
              <span>Recommendation</span>
            </button>

            <div style={{ width: '1px', height: '20px', backgroundColor: '#E2E8F0' }} />

            {/* 3. Downloads */}
            <button
              onClick={handleDownloadReport}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'transparent',
                color: colors.textPrimary,
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: 'Poppins, sans-serif',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(79, 70, 229, 0.08)';
                e.currentTarget.style.color = colors.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = colors.textPrimary;
              }}
              title="Download or print health insights and trends report"
            >
              <Download size={16} color={colors.primary} />
              <span>Downloads</span>
            </button>

            <div style={{ width: '1px', height: '20px', backgroundColor: '#E2E8F0' }} />

            {/* 4. Share Link */}
            <button
              onClick={() => navigate(targetProfileId ? `/profiles/${targetProfileId}/sharing` : '/sharing')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'transparent',
                color: colors.textPrimary,
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: 'Poppins, sans-serif',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(79, 70, 229, 0.08)';
                e.currentTarget.style.color = colors.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = colors.textPrimary;
              }}
              title="Generate and manage secure shareable links"
            >
              <Share2 size={16} color={colors.primary} />
              <span>Share Link</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 0',
              color: colors.primary,
              gap: '10px',
            }}
          >
            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '15px', fontWeight: 500 }}>Loading health trends…</span>
            <style>{`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : error ? (
          <div
            style={{
              padding: '16px',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '12px',
              color: colors.danger,
              textAlign: 'center',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        ) : (
          <div>
            {/* Top Card: Overall Health Score Trend */}
            {hsTrend && (
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                  border: '1px solid #E2E8F0',
                  padding: '24px',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '20px',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <Activity size={20} color={colors.primary} />
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
                      Overall Health Score Trend
                    </h3>
                  </div>
                  <p style={{ fontSize: '13px', color: colors.textSecondary, margin: '0 0 12px' }}>
                    Based on {hsTrend.based_on_report_count} completed lab reports
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '28px', fontWeight: 700, color: colors.primary }}>
                      {hsTrend.latest_score != null ? `${hsTrend.latest_score}/100` : '—'}
                    </span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(79, 70, 229, 0.08)',
                        color: colors.primary,
                        fontSize: '12px',
                        fontWeight: 600,
                        textTransform: 'capitalize',
                      }}
                    >
                      {hsTrend.direction.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Compact Sparkline Chart */}
                {hsTrend.sparkline && hsTrend.sparkline.length > 1 && (
                  <div style={{ width: '220px', height: '60px' }}>
                    <LineTrendChart
                      labels={hsTrend.sparkline.map((_, i) => `R${i + 1}`)}
                      datasets={[{ label: 'Health Score', data: hsTrend.sparkline }]}
                      compact={true}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Parameter Cards Section (Limited to 3 blocks + Show More) */}
            {tests.length === 0 ? (
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  padding: '48px 24px',
                  textAlign: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  border: '1px solid #E2E8F0',
                  marginBottom: '24px',
                }}
              >
                <LineChartIcon size={32} color={colors.textSecondary} style={{ marginBottom: '12px' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: colors.textPrimary, margin: '0 0 8px' }}>
                  No Trend Data Available Yet
                </h3>
                <p style={{ fontSize: '14px', color: colors.textSecondary, margin: '0 0 20px' }}>
                  Upload more reports to start seeing health trends over time.
                </p>
                <Link
                  to="/upload"
                  style={{
                    display: 'inline-block',
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#FFFFFF',
                    background: 'linear-gradient(90deg, #4F46E5 0%, #7C3AED 100%)',
                    borderRadius: '10px',
                    textDecoration: 'none',
                  }}
                >
                  Upload Report
                </Link>
              </div>
            ) : (
              <div style={{ marginBottom: '28px' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '20px',
                    marginBottom: '16px',
                  }}
                >
                  {visibleTests.map((item) => {
                    const IconComp = DIRECTION_ICONS[item.direction] || HelpCircle;

                    return (
                      <div
                        key={item.test_name}
                        onClick={() =>
                          navigate(`/profiles/${targetProfileId}/trends/${encodeURIComponent(item.test_name)}`)
                        }
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: '16px',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
                          border: '1px solid #E2E8F0',
                          padding: '20px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = colors.primary;
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(79, 70, 229, 0.12)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#E2E8F0';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.08)';
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: '12px',
                            marginBottom: '12px',
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h4
                              style={{
                                fontSize: '14.5px',
                                fontWeight: 700,
                                color: colors.textPrimary,
                                margin: '0 0 4px',
                                lineHeight: '1.35',
                                wordBreak: 'break-word',
                              }}
                            >
                              {formatTestDisplayName(item.test_name)}
                            </h4>
                            <span style={{ fontSize: '13px', color: colors.textSecondary, fontWeight: 500 }}>
                              {item.latest_value != null ? `${item.latest_value} ${item.latest_unit || ''}` : '—'}
                            </span>
                          </div>
                          <div style={{ flexShrink: 0, marginLeft: '4px' }}>
                            <StatusBadge status={item.latest_status} />
                          </div>
                        </div>

                        {/* Sparkline & Direction */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px',
                            marginTop: '16px',
                          }}
                        >
                          <div style={{ flex: 1, height: '50px' }}>
                            {item.sparkline && item.sparkline.length > 1 ? (
                              <LineTrendChart
                                labels={item.sparkline.map((_, i) => `P${i + 1}`)}
                                datasets={[{ label: item.test_name, data: item.sparkline }]}
                                compact={true}
                              />
                            ) : (
                              <div style={{ fontSize: '11px', color: colors.textSecondary, fontStyle: 'italic', paddingTop: '16px' }}>
                                Single point recorded
                              </div>
                            )}
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 8px',
                              borderRadius: '8px',
                              backgroundColor: '#F8FAFC',
                              color: colors.textSecondary,
                              fontSize: '11px',
                              fontWeight: 600,
                              textTransform: 'capitalize',
                            }}
                          >
                            <IconComp size={14} color={colors.primary} />
                            <span>{item.direction.replace(/_/g, ' ')}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Show More / Show Less Toggle Button */}
                {tests.length > 3 && (
                  <div style={{ textAlign: 'center', marginTop: '12px' }}>
                    <button
                      onClick={() => setShowAllTests((prev) => !prev)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '10px 22px',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: colors.primary,
                        backgroundColor: 'rgba(79, 70, 229, 0.08)',
                        border: '1px solid rgba(79, 70, 229, 0.2)',
                        borderRadius: '24px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontFamily: 'Poppins, sans-serif',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(79, 70, 229, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(79, 70, 229, 0.08)';
                      }}
                    >
                      <span>
                        {showAllTests ? 'Show Less' : `Show More (${tests.length - 3} rest parameters)`}
                      </span>
                      {showAllTests ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* BLOCK 1: Complete Health Insight & Precautions */}
            <div
              id="recommendations-section"
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                border: '1px solid #E2E8F0',
                padding: '24px',
                marginBottom: '24px',
                scrollMarginTop: '80px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '18px',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(79, 70, 229, 0.1)',
                      color: colors.primary,
                    }}
                  >
                    <ShieldAlert size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '17px', fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
                      Complete Health Insight & Precautions
                    </h3>
                    <p style={{ fontSize: '13px', color: colors.textSecondary, margin: '2px 0 0' }}>
                      Detailed health findings and precautions tailored for {activeProfile?.profile_name || 'Patient'}
                    </p>
                  </div>
                </div>

                {latestReportId && (
                  <button
                    onClick={() => handleGenerateRecs(true)}
                    disabled={generatingRecs}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: colors.primary,
                      backgroundColor: 'rgba(79, 70, 229, 0.08)',
                      border: '1px solid rgba(79, 70, 229, 0.2)',
                      borderRadius: '10px',
                      cursor: generatingRecs ? 'not-allowed' : 'pointer',
                      fontFamily: 'Poppins, sans-serif',
                    }}
                  >
                    <RefreshCw size={14} style={{ animation: generatingRecs ? 'spin 1s linear infinite' : 'none' }} />
                    <span>{generatingRecs ? 'Synthesizing...' : 'Regenerate Insights'}</span>
                  </button>
                )}
              </div>

              {recError && (
                <div
                  style={{
                    padding: '12px',
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    borderRadius: '8px',
                    color: colors.danger,
                    fontSize: '13px',
                    marginBottom: '16px',
                  }}
                >
                  {recError}
                </div>
              )}

              {loadingRecs ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '20px 0', color: colors.primary }}>
                  <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                  <span style={{ fontSize: '14px' }}>Synthesizing comprehensive health insights…</span>
                </div>
              ) : (
                <div>
                  {/* Urgent Care Banner (if critical values present) */}
                  {recommendations?.is_urgent && (
                    <div
                      style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.06)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        borderRadius: '12px',
                        padding: '16px 18px',
                        marginBottom: '20px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#B91C1C', fontWeight: 700, marginBottom: '6px' }}>
                        <AlertTriangle size={20} />
                        <span>URGENT CARE NOTICE</span>
                      </div>
                      <p style={{ fontSize: '13.5px', color: colors.textPrimary, lineHeight: '1.6', margin: 0 }}>
                        {recommendations.urgent_care_message}
                      </p>
                    </div>
                  )}

                  {/* Detailed Health Overview / Summary */}
                  <div
                    style={{
                      backgroundColor: '#F8FAFC',
                      borderRadius: '12px',
                      padding: '18px',
                      marginBottom: '18px',
                      borderLeft: `4px solid ${colors.primary}`,
                    }}
                  >
                    <h4 style={{ fontSize: '15px', fontWeight: 700, color: colors.textPrimary, margin: '0 0 8px' }}>
                      Overall Clinical Summary & Report Findings
                    </h4>
                    <p style={{ fontSize: '14px', color: colors.textSecondary, lineHeight: '1.6', margin: 0 }}>
                      Based on current lab results for <strong>{activeProfile?.profile_name}</strong> ({speciesCategory}), 
                      the latest health score is recorded at <strong>{hsTrend?.latest_score != null ? `${hsTrend.latest_score}/100` : 'active'}</strong>. 
                      Below are the specific clinical precautions, monitoring steps, and plain-English medical term breakdowns synthesized from the report findings.
                    </p>
                  </div>

                  {/* Precautions & Action Items Section */}
                  <div
                    style={{
                      backgroundColor: 'rgba(245, 158, 11, 0.05)',
                      border: '1px solid rgba(245, 158, 11, 0.2)',
                      borderRadius: '12px',
                      padding: '18px',
                    }}
                  >
                    <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#D97706', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertTriangle size={18} color="#D97706" />
                      <span>Necessary Precautions & Action Items to be Taken</span>
                    </h4>

                    {recommendations?.lifestyle && recommendations.lifestyle.length > 0 ? (
                      <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
                        {recommendations.lifestyle.map((item, idx) => (
                          <li
                            key={idx}
                            style={{
                              fontSize: '13.5px',
                              color: colors.textPrimary,
                              lineHeight: '1.6',
                              marginBottom: '10px',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '10px',
                            }}
                          >
                            <span style={{ color: '#D97706', fontWeight: 700, fontSize: '16px', lineHeight: '1' }}>•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13.5px', color: colors.textPrimary, lineHeight: '1.6' }}>
                        <li>Schedule routine clinical checkups with your doctor or vet to monitor parameter trends.</li>
                        <li>Maintain consistent hydration, balanced exercise, and adequate sleep/rest.</li>
                        <li>Monitor for warning signs or unusual fatigue and consult medical care promptly.</li>
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* BLOCK 2: Medical Term Explanations ("Explain Each Medical Term") */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                border: '1px solid #E2E8F0',
                padding: '24px',
                marginBottom: '24px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '18px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(124, 58, 237, 0.1)',
                    color: '#7C3AED',
                  }}
                >
                  <BookOpen size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
                    Plain-English Medical Term Explanations
                  </h3>
                  <p style={{ fontSize: '13px', color: colors.textSecondary, margin: '2px 0 0' }}>
                    Understanding your lab report parameters and what each test value indicates
                  </p>
                </div>
              </div>

              {loadingRecs ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 0', color: colors.primary }}>
                  <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                  <span style={{ fontSize: '14px' }}>Loading medical term explanations…</span>
                </div>
              ) : recommendations?.medical_explanations && recommendations.medical_explanations.length > 0 ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '16px',
                  }}
                >
                  {recommendations.medical_explanations.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: '12px',
                        padding: '16px',
                      }}
                    >
                      <h4
                        style={{
                          fontSize: '14px',
                          fontWeight: 700,
                          color: '#7C3AED',
                          margin: '0 0 6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <Sparkles size={16} color="#7C3AED" />
                        <span>{item.term}</span>
                      </h4>
                      <p style={{ fontSize: '13px', color: colors.textSecondary, lineHeight: '1.6', margin: 0 }}>
                        {item.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                /* Fallback detailed medical term dictionary for tests in report */
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '16px',
                  }}
                >
                  <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#7C3AED', margin: '0 0 6px' }}>
                      Hemoglobin (Hb)
                    </h4>
                    <p style={{ fontSize: '13px', color: colors.textSecondary, lineHeight: '1.6', margin: 0 }}>
                      An iron-rich protein in red blood cells that transports oxygen from lungs to muscles and body tissues.
                    </p>
                  </div>

                  <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#7C3AED', margin: '0 0 6px' }}>
                      Total Leucocyte Count (WBC)
                    </h4>
                    <p style={{ fontSize: '13px', color: colors.textSecondary, lineHeight: '1.6', margin: 0 }}>
                      White blood cells defend against infections and pathogens. Elevated levels indicate active infection or inflammation.
                    </p>
                  </div>

                  <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#7C3AED', margin: '0 0 6px' }}>
                      Platelet Count
                    </h4>
                    <p style={{ fontSize: '13px', color: colors.textSecondary, lineHeight: '1.6', margin: 0 }}>
                      Cell fragments essential for blood clotting and wound healing to prevent internal or external bleeding.
                    </p>
                  </div>

                  <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#7C3AED', margin: '0 0 6px' }}>
                      Blood Urea & Serum Creatinine
                    </h4>
                    <p style={{ fontSize: '13px', color: colors.textSecondary, lineHeight: '1.6', margin: 0 }}>
                      Key markers evaluating kidney filtration function and waste elimination efficiency.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* BLOCK 3: AI Report Insights */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                border: '1px solid #E2E8F0',
                padding: '24px',
                marginBottom: '24px',
              }}
            >
              {loadingRecs ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 0', color: colors.primary }}>
                  <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                  <span style={{ fontSize: '14px' }}>Loading AI insights…</span>
                </div>
              ) : recommendations?.has_been_generated ? (
                <InsightsView
                  summary={recommendations.summary}
                  findings={recommendations.findings}
                  recommendations={recommendations.recommendations}
                  sources={recommendations.sources}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 0', color: colors.textSecondary, fontSize: '14px' }}>
                  No AI insights generated yet. Open a report dashboard to generate.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </PageLayout>
  );
}
