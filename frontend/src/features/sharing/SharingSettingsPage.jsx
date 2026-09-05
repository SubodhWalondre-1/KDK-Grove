import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Share2,
  Eye,
  Ban,
  List,
  AlertTriangle,
  Loader2,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  X,
} from 'lucide-react';
import PageLayout from '../../components/layout/PageLayout';
import AccessLogTable from './components/AccessLogTable';
import { getShareLinks, revokeShareLink } from '../../api/sharingApi';
import { useProfileStore } from '../../store/profileStore';
import { colors } from '../../theme/colors';

export default function SharingSettingsPage() {
  const { profileId } = useParams();
  const activeProfile = useProfileStore((s) => s.activeProfile);
  const targetProfileId = profileId ? parseInt(profileId, 10) : activeProfile?.id;

  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State for Access Logs
  const [selectedLogsLinkId, setSelectedLogsLinkId] = useState(null);

  // Modal State for Revoke Confirmation
  const [revokeLinkId, setRevokeLinkId] = useState(null);
  const [revoking, setRevoking] = useState(false);

  const fetchShareLinks = () => {
    if (!targetProfileId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    getShareLinks(targetProfileId)
      .then((data) => setLinks(data.share_links || []))
      .catch((err) => {
        setError(err.response?.data?.detail || 'Failed to load share links');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchShareLinks();
  }, [targetProfileId]);

  const handleRevokeConfirm = async () => {
    if (!revokeLinkId) return;
    setRevoking(true);

    try {
      await revokeShareLink(revokeLinkId);
      // Optimistic status update
      setLinks((prev) =>
        prev.map((item) =>
          item.id === revokeLinkId ? { ...item, status: 'revoked' } : item
        )
      );
      setRevokeLinkId(null);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to revoke share link');
    } finally {
      setRevoking(false);
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
            Please select a patient profile to manage shared report links and view access logs.
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

  return (
    <PageLayout>
      <div
        style={{
          maxWidth: '1000px',
          margin: '0 auto',
          fontFamily: 'Poppins, sans-serif',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
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
            <Share2 size={24} color={colors.primary} />
            <span>Shared Links & Access Control</span>
          </h1>
          <p style={{ fontSize: '14px', color: colors.textSecondary, margin: 0 }}>
            Manage active guest share links and view real-time access audit logs for{' '}
            <strong>{activeProfile?.profile_name || 'Patient'}</strong>
          </p>
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
            <span style={{ fontSize: '15px', fontWeight: 500 }}>Loading share links...</span>
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
        ) : links.length === 0 ? (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '48px 24px',
              textAlign: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid #E2E8F0',
            }}
          >
            <Share2 size={32} color={colors.textSecondary} style={{ marginBottom: '12px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: colors.textPrimary, margin: '0 0 8px' }}>
              You Haven't Shared Any Reports Yet
            </h3>
            <p style={{ fontSize: '14px', color: colors.textSecondary, margin: 0 }}>
              Use the <strong>Share</strong> button on any report detail dashboard to create temporary guest access links.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {links.map((link) => {
              const isExpired =
                link.status === 'active' && new Date(link.expires_at) < new Date();
              const isRevoked = link.status === 'revoked';

              let statusLabel = 'Active';
              let statusBg = 'rgba(16, 185, 129, 0.1)';
              let statusColor = colors.success;
              let StatusIcon = CheckCircle2;

              if (isRevoked) {
                statusLabel = 'Revoked';
                statusBg = '#F1F5F9';
                statusColor = colors.textSecondary;
                StatusIcon = XCircle;
              } else if (isExpired) {
                statusLabel = 'Expired';
                statusBg = 'rgba(245, 158, 11, 0.1)';
                statusColor = '#D97706';
                StatusIcon = Clock;
              }

              return (
                <div
                  key={link.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid #E2E8F0',
                    padding: '20px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: colors.textPrimary }}>
                        Report #{link.report_id}
                      </span>

                      {/* Status Badge */}
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          backgroundColor: statusBg,
                          color: statusColor,
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        <StatusIcon size={13} />
                        <span>{statusLabel}</span>
                      </span>

                      {/* Unseen Notification Red Dot Badge */}
                      {link.unseen_count > 0 && (
                        <span
                          style={{
                            backgroundColor: colors.danger,
                            color: '#FFFFFF',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '12px',
                          }}
                        >
                          {link.unseen_count} new view{link.unseen_count > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '13px', color: colors.textSecondary, display: 'flex', gap: '16px' }}>
                      <span>Created: {new Date(link.created_at).toLocaleDateString()}</span>
                      <span>Expires: {new Date(link.expires_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {/* View Count */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: colors.textSecondary,
                      }}
                    >
                      <Eye size={16} />
                      <span>{link.view_count} views</span>
                    </div>

                    {/* View Logs Button */}
                    <button
                      onClick={() => setSelectedLogsLinkId(link.id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        backgroundColor: '#FFFFFF',
                        color: colors.textPrimary,
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'Poppins, sans-serif',
                      }}
                    >
                      <List size={16} />
                      <span>View Access Log</span>
                    </button>

                    {/* Revoke Button */}
                    {!isRevoked && (
                      <button
                        onClick={() => setRevokeLinkId(link.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 14px',
                          borderRadius: '8px',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          backgroundColor: 'rgba(239, 68, 68, 0.06)',
                          color: colors.danger,
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: 'Poppins, sans-serif',
                        }}
                      >
                        <Ban size={16} />
                        <span>Revoke</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Access Log Modal */}
        {selectedLogsLinkId && (
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
            onClick={() => {
              setSelectedLogsLinkId(null);
              fetchShareLinks(); // Refetch to reset unseen_count after viewing logs
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '640px',
                padding: '24px',
                position: 'relative',
                maxHeight: '80vh',
                overflowY: 'auto',
              }}
            >
              <button
                onClick={() => {
                  setSelectedLogsLinkId(null);
                  fetchShareLinks();
                }}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'none',
                  border: 'none',
                  color: colors.textSecondary,
                  cursor: 'pointer',
                }}
              >
                <X size={20} />
              </button>

              <h3 style={{ fontSize: '18px', fontWeight: 700, color: colors.textPrimary, margin: '0 0 16px' }}>
                Access Audit Log (Link #{selectedLogsLinkId})
              </h3>

              <AccessLogTable shareLinkId={selectedLogsLinkId} />
            </div>
          </div>
        )}

        {/* Revoke Confirmation Modal */}
        {revokeLinkId && (
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
            onClick={() => setRevokeLinkId(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '440px',
                padding: '24px',
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
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: colors.danger,
                  marginBottom: '16px',
                }}
              >
                <AlertTriangle size={24} />
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: 700, color: colors.textPrimary, margin: '0 0 8px' }}>
                Revoke Share Link?
              </h3>
              <p style={{ fontSize: '14px', color: colors.textSecondary, margin: '0 0 24px', lineHeight: '1.5' }}>
                This action is permanent and cannot be undone. Guests attempting to access this link will immediately receive a 410 Link Expired error.
              </p>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  onClick={() => setRevokeLinkId(null)}
                  disabled={revoking}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: colors.textPrimary,
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>

                <button
                  onClick={handleRevokeConfirm}
                  disabled={revoking}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: colors.danger,
                    color: '#FFFFFF',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: revoking ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {revoking && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                  <span>Yes, Revoke Link</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
