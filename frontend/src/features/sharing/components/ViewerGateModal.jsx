import { useState } from 'react';
import { User, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { recordSharedAccess } from '../../../api/sharingApi';
import { colors } from '../../../theme/colors';

export default function ViewerGateModal({ token, onAccessGranted }) {
  const [viewerName, setViewerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submitAccess = async (nameToSubmit) => {
    setLoading(true);
    setError('');

    try {
      const payload = await recordSharedAccess(token, nameToSubmit);
      onAccessGranted(payload);
    } catch (err) {
      const reason = err.response?.data?.reason;
      if (reason === 'expired') {
        setError('This link has expired and is no longer available.');
      } else if (reason === 'revoked') {
        setError('This link has been revoked by the report owner.');
      } else if (err.response?.status === 404) {
        setError('This share link was not found.');
      } else {
        setError(err.response?.data?.detail || 'Failed to access shared report');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = (e) => {
    e.preventDefault();
    const finalName = viewerName.trim() ? viewerName.trim() : null;
    submitAccess(finalName);
  };

  const handleSkip = () => {
    submitAccess(null);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(6px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        fontFamily: 'Poppins, sans-serif',
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          width: '100%',
          maxWidth: '440px',
          padding: '28px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            color: colors.primary,
            marginBottom: '16px',
          }}
        >
          <User size={24} />
        </div>

        <h3 style={{ fontSize: '18px', fontWeight: 700, color: colors.textPrimary, margin: '0 0 6px' }}>
          Welcome to Mediora Guest View
        </h3>

        <p style={{ fontSize: '13px', color: colors.textSecondary, margin: '0 0 20px', lineHeight: '1.5' }}>
          Let the report owner know who is viewing this report (optional & self-reported).
        </p>

        {error ? (
          <div
            style={{
              padding: '14px',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '10px',
              color: colors.danger,
              fontSize: '13px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              justifyContent: 'center',
            }}
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        ) : (
          <form onSubmit={handleContinue}>
            <div style={{ marginBottom: '20px', textAlign: 'left' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: colors.textSecondary,
                  marginBottom: '6px',
                }}
              >
                Your Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Dr. Sharma or Cousin Priya"
                value={viewerName}
                onChange={(e) => setViewerName(e.target.value)}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  fontSize: '14px',
                  color: colors.textPrimary,
                  backgroundColor: '#FFFFFF',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={handleSkip}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: colors.textSecondary,
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                Skip
              </button>

              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(90deg, #4F46E5 0%, #7C3AED 100%)',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                {loading ? (
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <>
                    <span>Continue</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
