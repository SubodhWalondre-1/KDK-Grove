import { colors } from '../../utils/constants';

export default function Input({
  label,
  error,
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  icon: Icon,
  style = {},
  inputStyle = {},
  className = '',
  ...props
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', ...style }} className={className}>
      {label && (
        <label style={{ fontSize: '13.5px', fontWeight: 600, color: '#334155', fontFamily: 'Poppins, sans-serif' }}>
          {label} {required && <span style={{ color: colors.danger }}>*</span>}
        </label>
      )}

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {Icon && (
          <div
            style={{
              position: 'absolute',
              left: '12px',
              color: '#94A3B8',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            <Icon size={18} />
          </div>
        )}

        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          style={{
            width: '100%',
            padding: Icon ? '10px 14px 10px 38px' : '10px 14px',
            fontSize: '14px',
            borderRadius: '8px',
            border: `1px solid ${error ? colors.danger : '#CBD5E1'}`,
            backgroundColor: disabled ? '#F1F5F9' : '#FFFFFF',
            color: '#1E293B',
            outline: 'none',
            fontFamily: 'Poppins, sans-serif',
            transition: 'border-color 0.15s ease',
            ...inputStyle,
          }}
          {...props}
        />
      </div>

      {error && (
        <span style={{ fontSize: '12px', color: colors.danger, fontFamily: 'Poppins, sans-serif' }}>
          {error}
        </span>
      )}
    </div>
  );
}
