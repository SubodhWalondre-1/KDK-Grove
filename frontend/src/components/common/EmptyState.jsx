import { FolderOpen } from 'lucide-react';
import { colors } from '../../utils/constants';

export default function EmptyState({
  icon: Icon = FolderOpen,
  title = 'No Data Found',
  description = 'There is currently no information to display here.',
  actionLabel,
  onAction,
  style = {},
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '48px 24px',
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '1px dashed #CBD5E1',
        fontFamily: 'Poppins, sans-serif',
        ...style,
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'rgba(79, 70, 229, 0.08)',
          color: colors.primary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
        }}
      >
        <Icon size={28} />
      </div>

      <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#1E293B', margin: '0 0 6px' }}>
        {title}
      </h3>
      <p style={{ fontSize: '13.5px', color: '#64748B', maxWidth: '420px', margin: '0 0 20px', lineHeight: '1.5' }}>
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            backgroundColor: colors.primary,
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            padding: '9px 18px',
            fontSize: '13.5px',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
