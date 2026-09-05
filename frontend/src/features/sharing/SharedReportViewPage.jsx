import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ShieldCheck, Heart, AlertCircle, Clock, XCircle, FileText, Loader2 } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import HealthScoreGauge from '../healthDashboard/components/HealthScoreGauge';
import ViewerGateModal from './components/ViewerGateModal';
import { getSharedPreview } from '../../api/sharingApi';
import { colors } from '../../theme/colors';

export default function SharedReportViewPage() {
  const { token } = useParams();

  const [preview, setPreview] = useState(null);
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState(null); // 'not_found' | 'expired' | 'revoked' | 'general'

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    setLoading(true);
    setErrorState(null);

    getSharedPreview(token)
      .then((data) => {
        if (!cancelled) setPreview(data);
      })
      .catch((err) => {
        if (!cancelled) {
          const reason = err.response?.data?.reason;
          if (reason === 'expired') {
            setErrorState('expired');
          } else if (reason === 'revoked') {
            setErrorState('revoked');
          } else if (err.response?.status === 404) {
            setErrorState('not_found');
          } else {
            setErrorState('general');
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F8FAFC',
        fontFamily: 'Poppins, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Brand Top Header */}
      <header
        style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          padding: '16px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              color: '#FFFFFF',
            }}
          >
            <Heart size={20} fill="#FFFFFF" />
          </div>
          <span style={{ fontSize: '20px', fontWeight: 700, color: colors.textPrimary }}>
            Mediora
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: colors.primary,
              backgroundColor: 'rgba(79, 70, 229, 0.08)',
              padding: '2px 8px',
              borderRadius: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Shared Report View
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: colors.textSecondary, fontSize: '13px' }}>
          <ShieldCheck size={16} color={colors.success} />
          <span>Secure Guest Access</span>
        </div>
      </header>

      {/* Main Body */}
      <main style={{ flex: 1, padding: '32px 16px', maxWidth: '840px', margin: '0 auto', width: '100%' }}>
        {loading ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '80px 0',
              color: colors.primary,
              gap: '10px',
            }}
          >
            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '15px', fontWeight: 500 }}>Validating shared link...</span>
            <style>{`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : errorState ? (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
              border: '1px solid #E2E8F0',
              padding: '48px 24px',
              textAlign: 'center',
              margin: '40px auto',
              maxWidth: '480px',
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
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                color: colors.danger,
                marginBottom: '16px',
              }}
            >
              {errorState === 'expired' ? (
                <Clock size={28} color="#D97706" />
              ) : errorState === 'revoked' ? (
                <XCircle size={28} color={colors.danger} />
              ) : (
                <AlertCircle size={28} color={colors.danger} />
              )}
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: 700, color: colors.textPrimary, margin: '0 0 8px' }}>
              {errorState === 'expired'
                ? 'This Link Has Expired'
                : errorState === 'revoked'
                ? 'Link Revoked by Owner'
                : 'Link Not Found'}
            </h2>

            <p style={{ fontSize: '14px', color: colors.textSecondary, margin: 0, lineHeight: '1.5' }}>
              {errorState === 'expired'
                ? 'The creator set a temporary access window for this report which has passed.'
                : errorState === 'revoked'
                ? 'The owner of this report has disabled access for this share link.'
                : 'This link is invalid or does not exist.'}
            </p>
          </div>
        ) : !payload ? (
          /* Preview State - ViewerGateModal is open */
          <ViewerGateModal token={token} onAccessGranted={(data) => setPayload(data)} />
        ) : (
          /* Full Shared Report Payload View */
          <div>
            {/* Header Card */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                padding: '24px',
                marginBottom: '24px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '20px',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <FileText size={20} color={colors.primary} />
                  <h1 style={{ fontSize: '20px', fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
                    {payload.profile_name}'s Medical Report
                  </h1>
                </div>
                <div style={{ fontSize: '13px', color: colors.textSecondary, display: 'flex', gap: '16px' }}>
                  <span>Report Type: <strong>{payload.report_type || 'Lab Report'}</strong></span>
                  <span>Species: <strong>{payload.species_category || 'Human'}</strong></span>
                  {payload.report_date && <span>Date: <strong>{payload.report_date}</strong></span>}
                </div>
              </div>

              {payload.health_score != null && (
                <div style={{ transform: 'scale(0.85)', transformOrigin: 'right center' }}>
                  <HealthScoreGauge score={payload.health_score} />
                </div>
              )}
            </div>

            {/* Test Values Table */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
              }}
            >
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: colors.textPrimary, margin: '0 0 16px' }}>
                Extracted Test Parameters
              </h3>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
                  <thead>
                    <tr
                      style={{
                        borderBottom: '2px solid #E2E8F0',
                        color: colors.textSecondary,
                        fontSize: '12px',
                        textTransform: 'uppercase',
                      }}
                    >
                      <th style={{ padding: '10px 12px' }}>Parameter Name</th>
                      <th style={{ padding: '10px 12px' }}>Observed Value</th>
                      <th style={{ padding: '10px 12px' }}>Reference Range</th>
                      <th style={{ padding: '10px 12px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payload.test_values.map((tv, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '12px', fontWeight: 600, color: colors.textPrimary }}>
                          {tv.test_name}
                        </td>
                        <td style={{ padding: '12px', color: colors.textPrimary }}>
                          {tv.value != null ? `${tv.value} ${tv.unit || ''}` : '—'}
                        </td>
                        <td style={{ padding: '12px', color: colors.textSecondary }}>
                          {tv.ref_low != null && tv.ref_high != null
                            ? `${tv.ref_low} - ${tv.ref_high} ${tv.unit || ''}`
                            : '—'}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <StatusBadge status={tv.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
