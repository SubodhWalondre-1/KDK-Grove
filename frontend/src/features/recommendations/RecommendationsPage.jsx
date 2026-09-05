import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Sparkles, Loader2, RefreshCw, AlertCircle, HeartPulse } from 'lucide-react';
import PageLayout from '../../components/layout/PageLayout';
import UrgentCareBanner from './components/UrgentCareBanner';
import InsightsView from './components/InsightsView';
import { getRecommendations, generateRecommendations } from '../../api/recommendationsApi';
import { colors } from '../../theme/colors';

export default function RecommendationsPage() {
  const { reportId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const fetchRecommendations = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getRecommendations(reportId);
      setData(res);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (reportId) {
      fetchRecommendations();
    }
  }, [reportId]);

  const handleGenerate = async (forceRegenerate = false) => {
    setGenerating(true);
    setError('');
    try {
      const res = await generateRecommendations(reportId, forceRegenerate);
      setData(res);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate recommendations');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <PageLayout>
      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          fontFamily: 'Poppins, sans-serif',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
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
              <HeartPulse size={24} color={colors.primary} />
              <span>AI Report Insights</span>
            </h1>
            <p style={{ fontSize: '14px', color: colors.textSecondary, margin: 0 }}>
              Finding-driven health guidance synthesized from your lab report and clinical evidence
            </p>
          </div>

          {data?.has_been_generated && (
            <button
              onClick={() => handleGenerate(true)}
              disabled={generating}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: 600,
                color: colors.primary,
                backgroundColor: 'rgba(79, 70, 229, 0.08)',
                border: '1px solid rgba(79, 70, 229, 0.2)',
                borderRadius: '8px',
                cursor: generating ? 'not-allowed' : 'pointer',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              <RefreshCw size={14} style={{ animation: generating ? 'spin 1s linear infinite' : 'none' }} />
              <span>{generating ? 'Regenerating...' : 'Regenerate'}</span>
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 0',
              color: colors.primary,
              gap: '12px',
            }}
          >
            <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '15px', fontWeight: 500 }}>Analyzing your lab findings…</span>
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
            <button
              onClick={fetchRecommendations}
              style={{
                marginTop: '12px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#FFFFFF',
                backgroundColor: colors.danger,
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        ) : !data?.has_been_generated ? (
          /* Empty State: Prompt to generate */
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
              padding: '48px 24px',
              textAlign: 'center',
              border: '1px solid #E2E8F0',
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
              <HeartPulse size={28} />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 700, color: colors.textPrimary, margin: '0 0 8px' }}>
              No Insights Generated Yet
            </h3>
            <p
              style={{
                fontSize: '14px',
                color: colors.textSecondary,
                margin: '0 0 24px',
                maxWidth: '440px',
                marginInline: 'auto',
                lineHeight: '1.5',
              }}
            >
              The system will analyze your lab findings, retrieve relevant clinical evidence,
              and generate personalized AI guidance anchored to each identified abnormality.
            </p>

            <button
              onClick={() => handleGenerate(false)}
              disabled={generating}
              style={{
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#FFFFFF',
                background: 'linear-gradient(90deg, #4F46E5 0%, #7C3AED 100%)',
                border: 'none',
                borderRadius: '10px',
                cursor: generating ? 'not-allowed' : 'pointer',
                fontFamily: 'Poppins, sans-serif',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {generating ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Analyzing findings & retrieving evidence...</span>
                </>
              ) : (
                <>
                  <HeartPulse size={16} />
                  <span>Generate AI Insights</span>
                </>
              )}
            </button>
          </div>
        ) : data?.has_been_generated ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {data.is_urgent && (
              <UrgentCareBanner message={data.urgent_care_message} />
            )}
            <InsightsView
              summary={data.summary}
              findings={data.findings}
              recommendations={data.recommendations}
              sources={data.sources}
            />
          </div>
        ) : null}
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
