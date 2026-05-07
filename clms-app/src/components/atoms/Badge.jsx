const variantClasses = {
  default: 'bg-surface-subtle text-text-secondary',
  amber: 'bg-amber-100 text-amber-700',
  role: 'bg-surface-subtle text-text-secondary',
  status: 'bg-success/10 text-success',
  info: 'bg-info/10 text-info',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  brand: 'bg-brand/10 text-brand',
  case: 'bg-success/10 text-success',
  legislation: 'bg-info/10 text-info',
  book: 'bg-brand/10 text-brand',
};

export default function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${variantClasses[variant] || variantClasses.default} ${className}`}>
      {children}
    </span>
  );
}
