import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import PageLayout from '../../components/layout/PageLayout';
import TrendLineChart from './components/TrendLineChart';
import TrendInsightCard from './components/TrendInsightCard';
import { getTestTrend, getTrendInsight } from '../../api/trendsApi';
import { useProfileStore } from '../../store/profileStore';
import { colors } from '../../theme/colors';

export default function TrendDetailPage() {
  const { profileId, testName } = useParams();
  const navigate = useNavigate();

  const activeProfile = useProfileStore((s) => s.activeProfile);
  const targetProfileId = profileId || activeProfile?.id;

  const [series, setSeries] = useState(null);
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!targetProfileId || !testName) return;

    let cancelled = false;
    setLoading(true);
    setError('');

    Promise.all([
      getTestTrend(targetProfileId, testName),
      getTrendInsight(targetProfileId, testName),
    ])
      .then(([seriesData, insightData]) => {
        if (!cancelled) {
          setSeries(seriesData);
          setInsight(insightData);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.detail || 'Failed to load trend details');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [targetProfileId, testName]);

  return (
    <PageLayout>
      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          fontFamily: 'Poppins, sans-serif',
        }}
      >
        {/* Back Navigation */}
        <button
          onClick={() => navigate(targetProfileId ? `/profiles/${targetProfileId}/trends` : '/profiles')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: 'none',
            color: colors.primary,
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: '20px',
            padding: 0,
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          <ArrowLeft size={18} />
          <span>Back to All Trends</span>
        </button>

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
            <span style={{ fontSize: '15px', fontWeight: 500 }}>Loading parameter trend...</span>
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
            <AlertCircle size={20} style={{ marginBottom: '6px' }} />
            <div>{error}</div>
          </div>
        ) : series ? (
          <div>
            <TrendLineChart points={series.points} testName={series.test_name} />

            {insight && (
              <TrendInsightCard
                insightText={insight.insight_text}
                direction={insight.direction}
              />
            )}
          </div>
        ) : null}
      </div>
    </PageLayout>
  );
}
