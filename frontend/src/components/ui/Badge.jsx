import StatusBadge from '../StatusBadge';

export { StatusBadge };

export default function Badge({
  children,
  variant = 'default', // 'success' | 'warning' | 'danger' | 'primary' | 'default'
  size = 'md',
  style = {},
  className = '',
}) {
  const variantStyles = {
    success: {
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      color: '#22C55E',
      border: '1px solid rgba(34, 197, 94, 0.25)',
    },
    warning: {
      backgroundColor: 'rgba(245, 158, 11, 0.1)',
      color: '#F59E0B',
      border: '1px solid rgba(245, 158, 11, 0.25)',
    },
    danger: {
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      color: '#EF4444',
      border: '1px solid rgba(239, 68, 68, 0.25)',
    },
    primary: {
      backgroundColor: 'rgba(79, 70, 229, 0.1)',
      color: '#4F46E5',
      border: '1px solid rgba(79, 70, 229, 0.25)',
    },
    default: {
      backgroundColor: 'rgba(100, 116, 139, 0.1)',
      color: '#64748B',
      border: '1px solid rgba(100, 116, 139, 0.2)',
    },
  }[variant] || {
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    color: '#64748B',
    border: '1px solid rgba(100, 116, 139, 0.2)',
  };

  const sizeStyles = {
    sm: { padding: '2px 8px', fontSize: '11px' },
    md: { padding: '3px 10px', fontSize: '12px' },
    lg: { padding: '4px 14px', fontSize: '13px' },
  }[size] || { padding: '3px 10px', fontSize: '12px' };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        borderRadius: '9999px',
        fontWeight: 600,
        fontFamily: 'Poppins, sans-serif',
        lineHeight: '18px',
        whiteSpace: 'nowrap',
        ...variantStyles,
        ...sizeStyles,
        ...style,
      }}
      className={className}
    >
      {children}
    </span>
  );
}
