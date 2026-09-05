import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Utensils, Loader2, Sparkles, AlertCircle, RefreshCw, SlidersHorizontal, ArrowRight } from 'lucide-react';
import PageLayout from '../../components/layout/PageLayout';
import NutritionContextModal from './components/NutritionContextModal';
import DietPlanView from './components/DietPlanView';
import { getNutritionContext, getDietPlan, generateDietPlan } from '../../api/dietApi';
import { getDashboard, getProfileReports } from '../../api/dashboardApi';
import { useProfileStore } from '../../store/profileStore';
import { colors } from '../../theme/colors';

export default function DietPlanPage() {
  const { reportId: paramReportId } = useParams();
  const navigate = useNavigate();
  const activeProfile = useProfileStore((s) => s.activeProfile);

  const [reportId, setReportId] = useState(paramReportId || null);
  const [reportFindings, setReportFindings] = useState([]);
  const [context, setContext] = useState(null);
  const [plan, setPlan] = useState(null);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Load report and diet plan data
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    const loadData = async () => {
      try {
        let activeReportId = paramReportId;

        // If no reportId param, find latest report for activeProfile
        if (!activeReportId && activeProfile) {
          const reports = await getProfileReports(activeProfile.id);
          if (reports && reports.length > 0) {
            activeReportId = reports[0].id;
          }
        }

        if (!activeReportId) {
          if (!cancelled) setLoading(false);
          return;
        }

        setReportId(activeReportId);

        // Fetch dashboard findings & stored diet plan in parallel
        const [dashData, storedContext, storedPlan] = await Promise.all([
          getDashboard(activeReportId).catch(() => null),
          activeProfile ? getNutritionContext(activeProfile.id).catch(() => null) : Promise.resolve(null),
          getDietPlan(activeReportId).catch(() => null),
        ]);

        if (cancelled) return;

        if (dashData && dashData.test_values) {
          const abnormal = dashData.test_values.filter((tv) => tv.status !== 'green' && tv.status !== 'normal');
          setReportFindings(abnormal.length > 0 ? abnormal : dashData.test_values.slice(0, 3));
        }

        setContext(storedContext);

        if (storedPlan) {
          setPlan(storedPlan);
        } else {
          // Auto-generate diet plan immediately upon page load
          try {
            const generated = await generateDietPlan(activeReportId);
            if (!cancelled) setPlan(generated);
          } catch (genErr) {
            console.warn('Auto generation of diet plan failed, user can use modal:', genErr);
          }
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.detail || 'Failed to load diet plan data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [paramReportId, activeProfile]);

  const handleContextSubmitAndGenerate = async (contextData) => {
    if (!reportId) return;
    setGenerating(true);
    setError('');
    try {
      const freshPlan = await generateDietPlan(reportId, contextData, true);
      setPlan(freshPlan);
      setContext(contextData);
      setShowModal(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate diet plan.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <PageLayout>
      <div
        style={{
          maxWidth: '960px',
          margin: '0 auto',
          fontFamily: 'Poppins, sans-serif',
        }}
      >
        {/* Page Title */}
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
                fontWeight: 800,
                color: colors.textPrimary,
                margin: '0 0 4px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <Utensils size={24} color="#7C3AED" />
              <span>Lab-Driven Nutrition & Diet Plan</span>
            </h1>
            <p style={{ fontSize: '14px', color: colors.textSecondary, margin: 0 }}>
              Personalized meal guidance driven by your lab findings and dietary preferences
            </p>
          </div>

          {plan && (
            <button
              onClick={() => setShowModal(true)}
              disabled={generating}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#7C3AED',
                backgroundColor: 'rgba(124, 58, 237, 0.08)',
                border: '1px solid rgba(124, 58, 237, 0.2)',
                borderRadius: '10px',
                cursor: generating ? 'not-allowed' : 'pointer',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              <SlidersHorizontal size={15} />
              <span>Update Preferences</span>
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
              color: '#7C3AED',
              gap: '12px',
            }}
          >
            <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '15px', fontWeight: 500 }}>Analyzing lab report findings & loading diet plan…</span>
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
        ) : !reportId ? (
          /* Empty state when no report is uploaded yet */
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              border: '1px solid #E2E8F0',
              padding: '48px 24px',
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED', marginBottom: '16px' }}>
              <Utensils size={28} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: colors.textPrimary, margin: '0 0 8px' }}>
              No Lab Report Found
            </h3>
            <p style={{ fontSize: '14px', color: colors.textSecondary, margin: '0 0 24px', maxWidth: '420px', marginInline: 'auto' }}>
              Upload a lab report first to generate personalized finding-driven diet guidance.
            </p>
            <button
              onClick={() => navigate('/upload')}
              style={{
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#FFFFFF',
                background: 'linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontFamily: 'Poppins, sans-serif',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>Upload Medical Report</span>
              <ArrowRight size={16} />
            </button>
          </div>
        ) : !plan ? (
          /* Empty state prompt to configure context and generate */
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              border: '1px solid #E2E8F0',
              padding: '48px 24px',
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED', marginBottom: '16px' }}>
              <Sparkles size={28} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: colors.textPrimary, margin: '0 0 8px' }}>
              Create Your Finding-Driven Diet Plan
            </h3>
            <p style={{ fontSize: '14px', color: colors.textSecondary, margin: '0 0 24px', maxWidth: '460px', marginInline: 'auto', lineHeight: '1.5' }}>
              Configure your food preferences, dietary restrictions, and regional style to generate personalized meal options tailored to your lab findings.
            </p>

            <button
              onClick={() => setShowModal(true)}
              style={{
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#FFFFFF',
                background: 'linear-gradient(90deg, #7C3AED 0%, #9333EA 100%)',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontFamily: 'Poppins, sans-serif',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)',
              }}
            >
              <Sparkles size={16} />
              <span>Configure & Generate Diet Plan</span>
            </button>
          </div>
        ) : (
          <DietPlanView
            plan={plan}
            context={context}
            onEditContext={() => setShowModal(true)}
            onRegenerate={() => setShowModal(true)}
            isGenerating={generating}
          />
        )}

        {/* Nutrition Context Wizard Modal */}
        {showModal && (
          <NutritionContextModal
            initialContext={context || {}}
            reportFindings={reportFindings}
            onSubmit={handleContextSubmitAndGenerate}
            onClose={() => setShowModal(false)}
            isGenerating={generating}
          />
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
