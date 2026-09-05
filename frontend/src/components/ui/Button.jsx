import { colors } from '../../utils/constants';

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size = 'md', // 'sm' | 'md' | 'lg'
  disabled = false,
  loading = false,
  icon: Icon,
  style = {},
  className = '',
  ...props
}) {
  const sizeStyles = {
    sm: { padding: '6px 12px', fontSize: '12.5px', borderRadius: '6px' },
    md: { padding: '10px 18px', fontSize: '14px', borderRadius: '8px' },
    lg: { padding: '12px 24px', fontSize: '15px', borderRadius: '10px' },
  }[size] || { padding: '10px 18px', fontSize: '14px', borderRadius: '8px' };

  const variantStyles = {
    primary: {
      backgroundColor: colors.primary,
      color: '#FFFFFF',
      border: 'none',
    },
    secondary: {
      backgroundColor: 'rgba(79, 70, 229, 0.1)',
      color: colors.primary,
      border: '1px solid rgba(79, 70, 229, 0.2)',
    },
    outline: {
      backgroundColor: 'transparent',
      color: colors.textPrimary,
      border: '1px solid #CBD5E1',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: colors.textSecondary,
      border: 'none',
    },
    danger: {
      backgroundColor: colors.danger,
      color: '#FFFFFF',
      border: 'none',
    },
  }[variant] || {
    backgroundColor: colors.primary,
    color: '#FFFFFF',
    border: 'none',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontWeight: 600,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.65 : 1,
        transition: 'all 0.15s ease',
        fontFamily: 'Poppins, sans-serif',
        ...sizeStyles,
        ...variantStyles,
        ...style,
      }}
      className={className}
      {...props}
    >
      {Icon && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />}
      <span>{children}</span>
    </button>
  );
}
