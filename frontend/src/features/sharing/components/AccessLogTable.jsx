import { useEffect, useState } from 'react';
import { Smartphone, Tablet, Monitor, HelpCircle, Loader2 } from 'lucide-react';
import { getShareLinkLogs } from '../../../api/sharingApi';
import { colors } from '../../../theme/colors';

const DEVICE_ICONS = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
  unknown: HelpCircle,
};

export default function AccessLogTable({ shareLinkId, onLogsFetched }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!shareLinkId) return;

    let cancelled = false;
    setLoading(true);
    setError('');

    getShareLinkLogs(shareLinkId)
      .then((data) => {
        if (!cancelled) {
          setLogs(data.logs || []);
          if (onLogsFetched) onLogsFetched();
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.detail || 'Failed to load access logs');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [shareLinkId]);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 0',
          color: colors.primary,
          gap: '8px',
          fontFamily: 'Poppins, sans-serif',
        }}
      >
        <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '14px', fontWeight: 500 }}>Loading access audit log...</span>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: '12px',
          backgroundColor: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '8px',
          color: colors.danger,
          fontSize: '13px',
          textAlign: 'center',
          fontFamily: 'Poppins, sans-serif',
        }}
      >
        {error}
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div
        style={{
          padding: '32px 16px',
          textAlign: 'center',
          color: colors.textSecondary,
          fontSize: '14px',
          fontStyle: 'italic',
          fontFamily: 'Poppins, sans-serif',
          backgroundColor: '#F8FAFC',
          borderRadius: '10px',
        }}
      >
        No views yet for this share link.
      </div>
    );
  }

  return (
    <div style={{ width: '100%', overflowX: 'auto', fontFamily: 'Poppins, sans-serif' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '13px',
          textAlign: 'left',
        }}
      >
        <thead>
          <tr
            style={{
              borderBottom: '2px solid #E2E8F0',
              color: colors.textSecondary,
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            <th style={{ padding: '10px 12px' }}>Accessed At</th>
            <th style={{ padding: '10px 12px' }}>Viewer Name</th>
            <th style={{ padding: '10px 12px' }}>Device</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => {
            const IconComponent = DEVICE_ICONS[log.device_type] || HelpCircle;
            const formattedTime = new Date(log.accessed_at).toLocaleString();

            return (
              <tr
                key={log.id}
                style={{
                  borderBottom: '1px solid #F1F5F9',
                  color: colors.textPrimary,
                }}
              >
                <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>{formattedTime}</td>
                <td style={{ padding: '10px 12px' }}>
                  {log.viewer_name ? (
                    <span style={{ fontWeight: 600 }}>{log.viewer_name}</span>
                  ) : (
                    <span style={{ color: colors.textSecondary, fontStyle: 'italic' }}>
                      Anonymous (skipped)
                    </span>
                  )}
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      textTransform: 'capitalize',
                      color: colors.textSecondary,
                    }}
                  >
                    <IconComponent size={16} color={colors.primary} />
                    <span>{log.device_type || 'unknown'}</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
