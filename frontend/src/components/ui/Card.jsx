export default function Card({
  children,
  style = {},
  className = '',
  padding = '24px',
  borderRadius = '16px',
  onClick,
  ...props
}) {
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius,
        padding,
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        fontFamily: 'Poppins, sans-serif',
        ...style,
      }}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
}
