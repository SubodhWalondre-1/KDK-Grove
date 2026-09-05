import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  HelpCircle,
  Activity,
  Loader2,
  Users,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Utensils,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Download,
  Share2,
  Calendar,
  FileText,
  Info,
  HeartPulse,
} from 'lucide-react';
import PageLayout from '../../components/layout/PageLayout';
import InsightsView from '../recommendations/components/InsightsView';
import { getTrendOverview, getTestTrend, getTrendInsight } from '../../api/trendsApi';
import { getProfileHealthScore, getDashboard } from '../../api/dashboardApi';
import { getRecommendations, generateRecommendations } from '../../api/recommendationsApi';
import { downloadReportPdf } from '../../api/reportsApi';
import {
  extractFilenameFromDisposition,
  downloadBlob,
  getDownloadErrorMessage,
  formatDate,
} from '../../utils/helpers';
import { useProfileStore } from '../../store/profileStore';
import { useTranslation } from '../../i18n/translations';
import { formatTestDisplayName } from '../../utils/formatters';
import './HealthInsights.css';

/**
 * Semicircle SVG Gauge (Green normal arc + Red attention arc)
 */
function HealthOverviewGauge({ pct = 87, greenColor = '#6fcf6f', redColor = '#ff5c5c', label = 'Overall Health' }) {
  const w = 210;
  const h = 118;
  const cx = 105;
  const cy = 108;
  const r = 84;
  const stroke = 22;
  const clampedPct = Math.min(100, Math.max(0, Math.round(pct || 0)));
  const splitAngle = 180 - (clampedPct / 100) * 180;

  const polar = (px, py, pr, angleDeg) => {
    const a = (angleDeg * Math.PI) / 180;
    return { x: px + pr * Math.cos(a), y: py - pr * Math.sin(a) };
  };

  const arcPath = (px, py, pr, startDeg, endDeg) => {
    const s = polar(px, py, pr, startDeg);
    const e = polar(px, py, pr, endDeg);
    const largeArc = Math.abs(startDeg - endDeg) > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${pr} ${pr} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  };

  return (
    <div className="gauge-box">
      <svg viewBox={`0 0 ${w} ${h}`}>
        {/* Background track */}
        <path
          d={arcPath(cx, cy, r, 180, 0)}
          stroke="#f1f2f8"
          strokeWidth={stroke}
          fill="none"
        />
        {/* Green arc (normal) */}
        {clampedPct > 0 && (
          <path
            d={arcPath(cx, cy, r, 180, splitAngle)}
            stroke={greenColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
          />
        )}
        {/* Red arc (needs attention) */}
        {clampedPct < 100 && (
          <path
            d={arcPath(cx, cy, r, splitAngle, 0)}
            stroke={redColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
          />
        )}
      </svg>
      <div className="gauge-label">
        <div className="pct">{clampedPct}%</div>
        <div className="cap">{label}</div>
      </div>
    </div>
  );
}

/**
 * Interactive SVG Line Trend Chart with gradient fill and data points
 */
function LabTrendSvgChart({ points = [], sparkline = [] }) {
  const dataPoints = useMemo(() => {
    if (points && points.length > 0) {
      return points.map((p) => ({
        val: typeof p.value === 'number' ? p.value : parseFloat(p.value) || 0,
        label: p.report_date
          ? new Date(p.report_date).toLocaleDateString('en-US', { month: 'short' })
          : '',
      }));
    }
    if (sparkline && sparkline.length > 0) {
      return sparkline.map((val, idx) => ({
        val: typeof val === 'number' ? val : parseFloat(val) || 0,
        label: `Pt ${idx + 1}`,
      }));
    }
    return [
      { val: 14.0, label: 'Jan' },
      { val: 14.5, label: 'Feb' },
      { val: 14.2, label: 'Mar' },
      { val: 15.0, label: 'Apr' },
      { val: 14.8, label: 'May' },
      { val: 15.4, label: 'Jun' },
      { val: 15.2, label: 'Jul' },
    ];
  }, [points, sparkline]);

  const vals = dataPoints.map((p) => p.val);
  const minVal = Math.min(...vals);
  const maxVal = Math.max(...vals);
  const padding = (maxVal - minVal) * 0.25 || 2;
  const yMin = Math.max(0, Math.floor(minVal - padding));
  const yMax = Math.ceil(maxVal + padding);

  const width = 720;
  const height = 220;
  const chartLeft = 44;
  const chartRight = 700;
  const chartTop = 20;
  const chartBottom = 180;
  const chartWidth = chartRight - chartLeft;
  const chartHeight = chartBottom - chartTop;

  const getX = (idx) => {
    if (dataPoints.length <= 1) return chartLeft + chartWidth / 2;
    return chartLeft + (idx / (dataPoints.length - 1)) * chartWidth;
  };

  const getY = (val) => {
    if (yMax === yMin) return chartTop + chartHeight / 2;
    return chartBottom - ((val - yMin) / (yMax - yMin)) * chartHeight;
  };

  const coords = dataPoints.map((p, idx) => ({
    x: getX(idx),
    y: getY(p.val),
    val: p.val,
    label: p.label,
  }));

  const polylinePoints = coords.map((c) => `${c.x},${c.y}`).join(' ');
  const areaPath =
    coords.length > 0
      ? `M ${coords[0].x},${coords[0].y} ` +
        coords.slice(1).map((c) => `L ${c.x},${c.y}`).join(' ') +
        ` L ${coords[coords.length - 1].x},${chartBottom} L ${coords[0].x},${chartBottom} Z`
      : '';

  const yTicks = [0, 1, 2, 3, 4].map((i) => {
    const tickVal = yMin + (i / 4) * (yMax - yMin);
    const tickY = chartBottom - (i / 4) * chartHeight;
    return { val: Math.round(tickVal * 10) / 10, y: tickY };
  });

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height}>
        <defs>
          <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        <g stroke="#eef0f5" strokeWidth="1">
          <line x1={chartLeft} y1={chartTop} x2={chartLeft} y2={chartBottom} />
          <line x1={chartLeft} y1={chartBottom} x2={chartRight} y2={chartBottom} />
          {yTicks.slice(1).map((tick, i) => (
            <line
              key={i}
              x1={chartLeft}
              y1={tick.y}
              x2={chartRight}
              y2={tick.y}
              strokeDasharray="3 4"
            />
          ))}
        </g>
        {/* Y-axis Labels */}
        <g fontSize="11" fill="#94a3b8">
          {yTicks.map((tick, i) => (
            <text key={i} x="8" y={tick.y + 4} textAnchor="start">
              {tick.val}
            </text>
          ))}
          {/* X-axis Labels */}
          {coords.map((c, i) => (
            <text key={i} x={c.x} y={chartBottom + 20} textAnchor="middle">
              {c.label}
            </text>
          ))}
        </g>
        {/* Shaded Area */}
        {areaPath && <path d={areaPath} fill="url(#lineFill)" />}
        {/* Polyline */}
        {polylinePoints && (
          <polyline
            points={polylinePoints}
            fill="none"
            stroke="#4f46e5"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {/* Point Circles */}
        <g fill="#4f46e5">
          {coords.map((c, i) => (
            <circle key={i} cx={c.x} cy={c.y} r="4" />
          ))}
        </g>
      </svg>
    </div>
  );
}

export default function TrendsPage() {
  const { t } = useTranslation();
  const { profileId } = useParams();
  const navigate = useNavigate();

  const activeProfile = useProfileStore((s) => s.activeProfile);
  const targetProfileId = profileId ? parseInt(profileId, 10) : activeProfile?.id;

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Latest report & recommendations state
  const [latestReportId, setLatestReportId] = useState(null);
  const [latestDashboard, setLatestDashboard] = useState(null);
  const [recommendations, setRecommendations] = useState(null);

  // Parameter trend tracking state
  const [selectedTest, setSelectedTest] = useState('');
  const [testTrendSeries, setTestTrendSeries] = useState(null);
  const [trendInsight, setTrendInsight] = useState('');

  // Download state
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // List collapse / show more states
  const [showAllNeedsImprovement, setShowAllNeedsImprovement] = useState(false);
  const [showAllDoingWell, setShowAllDoingWell] = useState(false);

  // Fetch trend overview data
  useEffect(() => {
    if (!targetProfileId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError('');

    try {
      const p = getTrendOverview(targetProfileId);
      if (p && typeof p.then === 'function') {
        p.then((data) => {
          if (!cancelled) {
            setOverview(data);
            if (data?.tests?.length > 0) {
              setSelectedTest(data.tests[0].test_name);
            }
          }
        })
          .catch((err) => {
            if (!cancelled) {
              setError(err?.response?.data?.detail || 'Failed to load health trends');
            }
          })
          .finally(() => {
            if (!cancelled) setLoading(false);
          });
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [targetProfileId]);

  // Fetch latest report ID and report dashboard
  useEffect(() => {
    if (!targetProfileId) return;

    let cancelled = false;

    try {
      const pScore = getProfileHealthScore?.(targetProfileId);
      if (pScore && typeof pScore.then === 'function') {
        pScore
          .then((scoreData) => {
            if (cancelled) return null;
            if (scoreData?.latest_report_id) {
              setLatestReportId(scoreData.latest_report_id);
              try {
                const pDash = getDashboard?.(scoreData.latest_report_id);
                if (pDash && typeof pDash.then === 'function') {
                  pDash
                    .then((dash) => {
                      if (!cancelled) setLatestDashboard(dash);
                    })
                    .catch(() => {});
                }
              } catch {}
              return getRecommendations?.(scoreData.latest_report_id);
            }
            return null;
          })
          .then((recData) => {
            if (!cancelled && recData) {
              if (
                !recData.has_been_generated ||
                (recData.is_urgent && (!recData.findings || recData.findings.length === 0))
              ) {
                if (recData.report_id) {
                  return generateRecommendations?.(recData.report_id, true);
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
          .catch(() => {});
      }
    } catch {}

    return () => {
      cancelled = true;
    };
  }, [targetProfileId]);

  // Fetch single test trend series & insight when selectedTest changes
  useEffect(() => {
    if (!targetProfileId || !selectedTest) return;

    let cancelled = false;

    try {
      getTestTrend(targetProfileId, selectedTest)
        .then((series) => {
          if (!cancelled) setTestTrendSeries(series);
        })
        .catch(() => {
          if (!cancelled) setTestTrendSeries(null);
        });

      getTrendInsight(targetProfileId, selectedTest)
        .then((res) => {
          if (!cancelled) {
            setTrendInsight(res?.insight_text || res?.insight || '');
          }
        })
        .catch(() => {
          if (!cancelled) setTrendInsight('');
        });
    } catch {}

    return () => {
      cancelled = true;
    };
  }, [targetProfileId, selectedTest]);

  // Handle PDF report download
  const handleDownloadReport = async () => {
    if (downloading) return;
    if (!latestReportId) {
      setDownloadError('No completed report available to download for this profile.');
      return;
    }

    setDownloading(true);
    setDownloadError('');
    setDownloadSuccess(false);

    try {
      const response = await downloadReportPdf(latestReportId);
      const disposition =
        response.headers?.['content-disposition'] || response.headers?.['Content-Disposition'];
      const filename = extractFilenameFromDisposition(
        disposition,
        `Mediora_Report_${latestReportId}.pdf`
      );
      const hint =
        response.headers?.['x-password-hint'] ||
        response.headers?.['X-Password-Hint'] ||
        activeProfile?.profile_name?.split(' ')[0]?.toUpperCase() ||
        'YOUR NAME';
      setDownloadPassword(hint);
      downloadBlob(response.data, filename);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 12000);
    } catch (err) {
      const msg = await getDownloadErrorMessage(err);
      setDownloadError(msg);
    } finally {
      setDownloading(false);
    }
  };

  // Profile not selected
  if (!targetProfileId) {
    return (
      <PageLayout>
        <div
          style={{
            maxWidth: '560px',
            margin: '60px auto',
            textAlign: 'center',
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            padding: '40px 24px',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#EEF0FD',
              color: '#4F46E5',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            <Users size={28} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1E293B', margin: '0 0 8px' }}>
            No Active Patient Profile
          </h2>
          <p style={{ fontSize: '14px', color: '#64748B', margin: '0 0 24px' }}>
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
              background: '#4F46E5',
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

  // Loading state
  if (loading) {
    return (
      <PageLayout>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '100px 0',
            color: '#4F46E5',
            gap: '12px',
          }}
        >
          <Loader2 size={26} style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '15px', fontWeight: 600 }}>Loading health trends…</span>
        </div>
      </PageLayout>
    );
  }

  const tests = overview?.tests || [];
  const hsTrend = overview?.health_score_trend;
  const reportCount = hsTrend?.based_on_report_count || 0;

  // Calculate Needs Improvement vs Doing Well directly from report tests
  const needsImprovement = tests.filter(
    (t) =>
      t.latest_status === 'red' ||
      t.latest_status === 'yellow' ||
      t.direction === 'decreasing' ||
      t.latest_status === 'review'
  );
  const doingWell = tests.filter(
    (t) => !needsImprovement.some((n) => n.test_name === t.test_name)
  );

  // Normal vs Needs Attention percentages according to the report
  const pctNormal =
    tests.length > 0
      ? Math.round((doingWell.length / tests.length) * 100)
      : 87;
  const pctAttention = Math.max(0, 100 - pctNormal);

  // Accurately compute health score according to the report's actual parameters:
  // If backend returns a positive score, use it; otherwise use pctNormal (the % of normal parameters)
  const rawLatestScore = hsTrend?.latest_score;
  const healthScore =
    rawLatestScore != null && rawLatestScore > 0
      ? Math.round(rawLatestScore)
      : (tests.length > 0 ? pctNormal : (rawLatestScore != null ? Math.round(rawLatestScore) : 87));

  const isPet =
    activeProfile?.species &&
    activeProfile.species.toLowerCase() !== 'human' &&
    activeProfile.species.toLowerCase() !== 'patient';

  const patientTitle = activeProfile?.profile_name
    ? `${activeProfile.profile_name}${
        activeProfile?.species ? ` (${activeProfile.species})` : ''
      }`
    : isPet
    ? 'Animal Patient (dog)'
    : t('active_patient', 'Active Patient');

  // Empty state when no test parameters exist
  if (!loading && tests.length === 0) {
    return (
      <PageLayout>
        <div className="health-insights-page">
          <div className="eyebrow">{t('health_insights_eyebrow', 'HEALTH INSIGHTS')}</div>
          <div className="page-head">
            <div>
              <h1>{t('health_insights_title', 'Health Insights')}</h1>
              <p>
                {isPet
                  ? t('health_insights_sub_pet', "Understand your pet's health journey with simple insights from lab reports.")
                  : t('health_insights_sub', 'Understand your health journey with simple insights from lab reports.')}
              </p>
            </div>
          </div>

          <div
            className="card"
            style={{
              textAlign: 'center',
              padding: '60px 24px',
              maxWidth: '620px',
              margin: '30px auto',
            }}
          >
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                backgroundColor: '#EEF0FD',
                color: '#4F46E5',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <Activity size={26} />
            </div>
            <h3 style={{ fontSize: '19px', fontWeight: 700, margin: '0 0 8px' }}>
              {t('no_trend_data', 'No trend data available yet')}
            </h3>
            <p style={{ fontSize: '14px', color: '#64748B', margin: '0 0 24px' }}>
              {t('upload_more_reports_notice', 'Upload more reports to start seeing health trends and parameter trajectories over time.')}
            </p>
            <Link to="/upload" className="btn-primary" style={{ display: 'inline-flex' }}>
              {t('nav_upload', 'Upload Report')}
            </Link>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Selected test data for SVG chart
  const selectedTestObj = tests.find((t) => t.test_name === selectedTest) || tests[0];

  return (
    <PageLayout>
      <div className="health-insights-page">
        {/* EYEBROW */}
        <div className="eyebrow">{t('health_insights_eyebrow', 'HEALTH INSIGHTS')}</div>

        {/* PAGE HEADER */}
        <div className="page-head">
          <div>
            <h1>{t('health_insights_title', 'Health Insights')}</h1>
            <p>
              {isPet
                ? t('health_insights_sub_pet', "Understand your pet's health journey with simple insights from lab reports.")
                : t('health_insights_sub', 'Understand your health journey with simple insights from lab reports.')}
            </p>
          </div>

          <div className="head-actions">
            {/* Patient Select Chip */}
            <Link
              to="/profiles"
              className="patient-select"
              title="Switch or view patient profiles"
            >
              <div className="p-icon">
                <Users size={18} />
              </div>
              <div className="p-text">
                <b>{patientTitle}</b>
                <span>{t('active_patient', 'Active Patient')}</span>
              </div>
            </Link>

            {/* Download Button */}
            <button
              type="button"
              className="btn-ghost"
              onClick={handleDownloadReport}
              disabled={downloading}
              title="Download password-protected report PDF"
            >
              {downloading ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>{t('downloading', 'Downloading...')}</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <CheckCircle2 size={16} color="#3FA34D" />
                  <span style={{ color: '#3FA34D' }}>{t('downloaded', 'Downloaded!')}</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>{t('download', 'Download')}</span>
                </>
              )}
            </button>

            {/* Share Link Button */}
            <button
              type="button"
              className="btn-primary"
              onClick={() =>
                navigate(targetProfileId ? `/profiles/${targetProfileId}/sharing` : '/sharing')
              }
              title="Generate and manage secure shareable links"
            >
              <Share2 size={16} />
              <span>{t('share_link', 'Share Link')}</span>
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
              color: '#E33F3F',
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
                color: '#E33F3F',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '18px',
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
              padding: '14px 18px',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '12px',
              color: '#065F46',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '14px',
              gap: '12px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <CheckCircle2 size={20} color="#059669" />
              <span>
                <strong>PDF Downloaded!</strong> Password to open:
              </span>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontWeight: 800,
                  fontSize: '15px',
                  letterSpacing: '1px',
                  backgroundColor: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  color: '#047857',
                  padding: '2px 10px',
                  borderRadius: '6px',
                }}
              >
                {downloadPassword}
              </span>
              <span style={{ fontSize: '12px', color: '#6B7280' }}>
                (Sirf ye name enter karo PDF khul jayegi)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setDownloadSuccess(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#059669',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '20px',
                padding: '0 4px',
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* HEALTH OVERVIEW CARD */}
        <div className="card overview">
          <div className="overview-top">
            <div className="overview-title">
              <div className="icon-box">
                <Activity size={22} />
              </div>
              <div>
                <h2>{t('health_overview_title', 'Health Overview')}</h2>
                <p>
                  Based on {reportCount} completed lab report{reportCount !== 1 ? 's' : ''} • Overall Health Score Trend:{' '}
                  <b>{healthScore != null ? `${healthScore}/100` : '—'}</b>
                </p>
              </div>
            </div>
          </div>

          <div className="overview-body">
            <div className="gauge-wrap">
              <HealthOverviewGauge pct={healthScore} label={t('overall_health', 'Overall Health')} />
              <div className="gauge-legend">
                <div className="stat-widget green">
                  <div className="stat-icon">
                    <CheckCircle2 size={17} />
                  </div>
                  <div>
                    <b>{pctNormal}%</b>
                    <span>{t('parameters_normal', 'Parameters normal')}</span>
                  </div>
                </div>

                <div className="stat-widget red">
                  <div className="stat-icon">
                    <AlertTriangle size={17} />
                  </div>
                  <div>
                    <b>{pctAttention}%</b>
                    <span>{t('needs_attention', 'Needs attention')}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="overview-note">
              <p>
                {t('overall_health_stable', 'Overall health is stable, with recent parameter trajectories tracked across completed clinical reports.')}
              </p>
              <div
                className={`trend-chip ${
                  healthScore >= 70
                    ? 'green'
                    : hsTrend?.direction === 'decreasing'
                    ? 'red'
                    : hsTrend?.direction === 'increasing'
                    ? 'green'
                    : 'neutral'
                }`}
              >
                {healthScore >= 70 ? (
                  <TrendingUp size={14} />
                ) : hsTrend?.direction === 'decreasing' ? (
                  <TrendingDown size={14} />
                ) : hsTrend?.direction === 'increasing' ? (
                  <TrendingUp size={14} />
                ) : (
                  <Minus size={14} />
                )}
                <span>
                  {healthScore >= 70
                    ? t('trend_stable_healthy', 'Stable & in healthy range')
                    : hsTrend?.direction === 'decreasing'
                    ? t('trend_down', 'Trending down over recent reports')
                    : hsTrend?.direction === 'increasing'
                    ? t('trend_up', 'Trending upward and improving')
                    : t('trend_stable', 'Stable across recent reports')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* KEY FINDINGS HEADER */}
        <div className="section-head">
          <div className="section-title">
            <div className="icon-box">
              <Sparkles size={19} />
            </div>
            <div>
              <h2>{t('key_findings', 'Key Findings')}</h2>
              <p>{t('key_findings_sub', 'Most important parameters from your latest reports')}</p>
            </div>
          </div>
          <button
            type="button"
            className="btn-ghost"
            onClick={() =>
              navigate(latestReportId ? `/reports/${latestReportId}/diet-plan` : '/diet-plan')
            }
          >
            <Utensils size={16} />
            <span>{t('diet_recommendation', 'Diet Recommendation')}</span>
          </button>
        </div>

        {/* TWO COLUMN FINDINGS */}
        <div className="findings-grid">
          {/* Panel 1: Needs Improvement */}
          <div className="panel">
            <div className="panel-head">
              <div className="panel-head-left">
                <div className="panel-icon red">
                  <AlertTriangle size={18} />
                </div>
                <h3>{t('needs_improvement', 'Needs Improvement')}</h3>
              </div>
              <span className="panel-count red">
                {needsImprovement.length > 0 ? needsImprovement.length : 0}
              </span>
            </div>
            <div className="panel-list">
              {needsImprovement.length > 0 ? (
                (showAllNeedsImprovement ? needsImprovement : needsImprovement.slice(0, 4)).map((item, idx) => (
                  <div
                    key={idx}
                    className="panel-row"
                    onClick={() =>
                      navigate(
                        `/profiles/${targetProfileId}/trends/${encodeURIComponent(item.test_name)}`
                      )
                    }
                  >
                    <div className="row-bar red" />
                    <div className="row-main">
                      <div className="name">{t(item.test_name, formatTestDisplayName(item.test_name))}</div>
                    </div>
                    <div className="row-value">
                      {item.latest_value} {item.latest_unit || ''}
                    </div>
                    <span className="status-pill review">
                      {item.direction === 'decreasing' ? t('status_decreasing', 'Decreasing') : t('status_review', 'Review')}
                    </span>
                    <ChevronRight size={16} className="row-chevron" />
                  </div>
                ))
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
                  {t('all_parameters_normal', 'All tracked parameters are currently within normal range.')}
                </div>
              )}
            </div>
            {needsImprovement.length > 4 && (
              <button
                type="button"
                className="panel-toggle-btn"
                onClick={() => setShowAllNeedsImprovement(!showAllNeedsImprovement)}
              >
                {showAllNeedsImprovement ? (
                  <>
                    <span>{t('show_less', 'Show Less')}</span>
                    <ChevronUp size={15} />
                  </>
                ) : (
                  <>
                    <span>{t('show_more_count', 'Show More (+{count} more)', { count: needsImprovement.length - 4 })}</span>
                    <ChevronDown size={15} />
                  </>
                )}
              </button>
            )}
          </div>

          {/* Panel 2: Doing Well */}
          <div className="panel">
            <div className="panel-head">
              <div className="panel-head-left">
                <div className="panel-icon green">
                  <CheckCircle2 size={18} />
                </div>
                <h3>{t('doing_well', 'Doing Well')}</h3>
              </div>
              <span className="panel-count green">
                {doingWell.length > 0 ? doingWell.length : 0}
              </span>
            </div>
            <div className="panel-list">
              {doingWell.length > 0 ? (
                (showAllDoingWell ? doingWell : doingWell.slice(0, 4)).map((item, idx) => (
                  <div
                    key={idx}
                    className="panel-row"
                    onClick={() =>
                      navigate(
                        `/profiles/${targetProfileId}/trends/${encodeURIComponent(item.test_name)}`
                      )
                    }
                  >
                    <div className="row-bar green" />
                    <div className="row-main">
                      <div className="name">{t(item.test_name, formatTestDisplayName(item.test_name))}</div>
                    </div>
                    <div className="row-value">
                      {item.latest_value} {item.latest_unit || ''}
                    </div>
                    <span className="status-pill normal">{t('status_normal', 'Normal')}</span>
                    <ChevronRight size={16} className="row-chevron" />
                  </div>
                ))
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
                  {t('no_normal_parameters', 'No normal parameters recorded yet.')}
                </div>
              )}
            </div>
            {doingWell.length > 4 && (
              <button
                type="button"
                className="panel-toggle-btn"
                onClick={() => setShowAllDoingWell(!showAllDoingWell)}
              >
                {showAllDoingWell ? (
                  <>
                    <span>{t('show_less', 'Show Less')}</span>
                    <ChevronUp size={15} />
                  </>
                ) : (
                  <>
                    <span>{t('show_more_count', 'Show More (+{count} more)', { count: doingWell.length - 4 })}</span>
                    <ChevronDown size={15} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* LAB TRENDS + LATEST REPORT (BOTTOM GRID) */}
        <div className="bottom-grid">
          {/* Left Card: Lab Trends */}
          <div className="card">
            <div className="lab-head">
              <div className="lab-title">
                <div className="icon-box">
                  <HeartPulse size={20} />
                </div>
                <div>
                  <h3>{t('lab_trends', 'Lab Trends')}</h3>
                  <p>{t('lab_trends_sub', 'Track how your key health parameters change over time')}</p>
                </div>
              </div>

              <div className="selects">
                <div className="select-group">
                  <label htmlFor="trend-parameter-select">{t('parameter', 'Parameter')}</label>
                  <select
                    id="trend-parameter-select"
                    className="select-box"
                    value={selectedTest}
                    onChange={(e) => setSelectedTest(e.target.value)}
                    aria-label="Select trend parameter"
                  >
                    {tests.map((tItem, idx) => (
                      <option key={idx} value={tItem.test_name}>
                        {t(tItem.test_name, formatTestDisplayName(tItem.test_name))} ({t('trend', 'Trend')})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* SVG Interactive Line Chart */}
            <LabTrendSvgChart
              points={testTrendSeries?.points || []}
              sparkline={selectedTestObj?.sparkline || []}
            />

            {/* Info Strip */}
            <div className="info-strip">
              <Info size={18} style={{ flexShrink: 0 }} />
              <span>
                {trendInsight ||
                  t('parameter_stable_insight', '{param} levels have been relatively stable across recent completed reports.', {
                    param: t(selectedTest, formatTestDisplayName(selectedTest || 'Parameter')),
                  })}
              </span>
            </div>
          </div>

          {/* Right Card: Latest Report */}
          <div className="card report-body">
            <div className="lab-title" style={{ marginBottom: '18px' }}>
              <div className="icon-box">
                <FileText size={20} />
              </div>
              <div>
                <h3>{t('latest_report', 'Latest Report')}</h3>
                <p>{t('latest_report_sub', 'Your most recent lab report summary')}</p>
              </div>
            </div>

            {/* Report Date Row */}
            <div className="report-date-row">
              <div className="date-left">
                <div className="cal-icon">
                  <Calendar size={18} />
                </div>
                <div>
                  <b>{t('report_date_label', 'Report Date')}</b>
                  <span className="sub">
                    {latestDashboard?.report_date
                      ? formatDate(latestDashboard.report_date)
                      : t('latest_available', 'Latest Available')}
                  </span>
                </div>
              </div>
              <span className="status-done">{t('status_completed', 'Completed')}</span>
            </div>

            {/* Report Parameter List */}
            <div className="report-list">
              {(latestDashboard?.parameters && latestDashboard.parameters.length > 0
                ? latestDashboard.parameters.slice(0, 4)
                : [
                    { name: 'Hemoglobin (Hb)', value: '15.2', unit: 'g/dL', status: 'normal' },
                    { name: 'RBC Count', value: '6.63', unit: 'mil/L', status: 'review' },
                    { name: 'MCH', value: '23', unit: 'pg', status: 'normal' },
                    { name: 'Eosinophils', value: '3', unit: '%', status: 'normal' },
                  ]
              ).map((p, idx) => {
                const pName = p.name || p.test_name;
                const pVal = p.value !== undefined ? p.value : p.latest_value;
                const pUnit = p.unit || p.latest_unit || '';
                const isNormal = p.status === 'normal' || p.latest_status === 'green';
                const displayName = formatTestDisplayName(pName);
                const reportLabel = displayName === 'Hemoglobin' ? 'Hemoglobin (Hb)' : displayName;
                return (
                  <div key={idx} className="r-row">
                    <span className="r-name">{t(displayName, reportLabel)}</span>
                    <span className="r-val">
                      {pVal} {pUnit}
                    </span>
                    <span className={`status-pill ${isNormal ? 'normal' : 'review'}`}>
                      {isNormal ? t('status_normal', 'Normal') : t('status_review', 'Review')}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* View Full Report Button */}
            {(() => {
              const reportId = latestReportId || overview?.latest_report_id;
              return (
                <button
                  type="button"
                  className="view-report-btn"
                  disabled={!reportId}
                  title={!reportId ? 'No report available yet' : undefined}
                  onClick={() => {
                    if (reportId) {
                      navigate(`/reports/${reportId}/dashboard`);
                    }
                  }}
                  style={!reportId ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
                >
                  <span>{t('view_full_report', 'View Full Report')}</span>
                  <ChevronRight size={16} />
                </button>
              );
            })()}
          </div>
        </div>

        {/* AI Recommendations View if present */}
        {recommendations?.has_been_generated && (
          <div style={{ marginTop: '36px' }} id="recommendations-section">
            <InsightsView
              summary={recommendations.summary}
              findings={recommendations.findings}
              recommendations={recommendations.recommendations}
              sources={recommendations.sources}
            />
          </div>
        )}
      </div>
    </PageLayout>
  );
}
