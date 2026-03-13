import Icon from './Icon';

export default function Select({ children, label, size = 'md', className = '', ...props }) {
  const sizeClasses = {
    sm: 'py-1.5 pl-2.5 pr-8 text-xs',
    md: 'py-3 pl-3 pr-10 text-sm',
  };
  const chevronPos = {
    sm: 'right-2',
    md: 'right-3',
  };

  return (
    <div className={className}>
      {label && (
        <span className="mb-1 block text-xs font-medium text-text-secondary">{label}</span>
      )}
      <label className="relative block">
        <select
          className={`w-full appearance-none rounded-xl border border-border bg-white ${sizeClasses[size]} leading-none text-text focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/20`}
          {...props}
        >
          {children}
        </select>
        <span className={`pointer-events-none absolute ${chevronPos[size]} top-1/2 -translate-y-1/2 text-text-muted`}>
          <Icon name="solar:alt-arrow-down-linear" size={size === 'sm' ? 14 : 16} />
        </span>
      </label>
    </div>
  );
}
