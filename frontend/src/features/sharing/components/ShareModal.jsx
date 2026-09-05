import { useState } from 'react';
import { Share2, Copy, Check, ShieldAlert, X, Loader2 } from 'lucide-react';
import { createShareLink } from '../../../api/sharingApi';
import { colors } from '../../../theme/colors';

const ALLOWED_EXPIRY_DAYS = [
  { value: 1, label: '1 Day' },
  { value: 7, label: '7 Days (Default)' },
  { value: 30, label: '30 Days' },
  { value: 90, label: '90 Days' },
];

export default function ShareModal({ reportId, open, onOpenChange }) {
  const [expiryDays, setExpiryDays] = useState(7);
  const [shareLink, setShareLink] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleGenerate = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await createShareLink(reportId, expiryDays);
      setShareLink(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate share link');
    } finally {
      setLoading(false);
    }
  };

  const fullUrl = shareLink
    ? `${window.location.origin}/shared/${shareLink.token}`
    : '';

  const handleCopy = () => {
    if (!fullUrl) return;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setShareLink(null);
    setError('');
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        fontFamily: 'Poppins, sans-serif',
      }}
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          width: '100%',
          maxWidth: '480px',
          padding: '24px',
          position: 'relative',
        }}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: colors.textSecondary,
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: 'rgba(79, 70, 229, 0.1)',
              color: colors.primary,
            }}
          >
            <Share2 size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
              Share Medical Report
            </h3>
            <p style={{ fontSize: '12px', color: colors.textSecondary, margin: '2px 0 0' }}>
              Create a secure, temporary guest link for your doctor or family
            </p>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              color: colors.danger,
              fontSize: '13px',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        {!shareLink ? (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: colors.textPrimary,
                  marginBottom: '8px',
                }}
              >
                Link Expiration Duration
              </label>
              <select
                value={expiryDays}
                onChange={(e) => setExpiryDays(parseInt(e.target.value, 10))}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  fontSize: '14px',
                  color: colors.textPrimary,
                  backgroundColor: '#FFFFFF',
                  outline: 'none',
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                {ALLOWED_EXPIRY_DAYS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#FFFFFF',
                background: 'linear-gradient(90deg, #4F46E5 0%, #7C3AED 100%)',
                border: 'none',
                borderRadius: '10px',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Generating Secure Link...</span>
                </>
              ) : (
                <>
                  <Share2 size={18} />
                  <span>Generate Share Link</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div>
            {/* Generated Link Display */}
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: colors.textSecondary,
                  marginBottom: '6px',
                }}
              >
                Your Secure Guest URL
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  readOnly
                  value={fullUrl}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    backgroundColor: '#F8FAFC',
                    color: colors.textPrimary,
                    outline: 'none',
                  }}
                />
                <button
                  onClick={handleCopy}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: copied ? '#10B981' : colors.primary,
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {copied ? (
                    <>
                      <Check size={16} />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Expiry & Caution Info */}
            <div
              style={{
                padding: '12px 14px',
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
              }}
            >
              <ShieldAlert size={18} color="#D97706" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div style={{ fontSize: '12px', color: '#92400E', lineHeight: '1.5' }}>
                <strong>Link expires on:</strong>{' '}
                {new Date(shareLink.expires_at).toLocaleString()}
                <br />
                Anyone with this link can view the contents of this medical report until it expires or is revoked.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
