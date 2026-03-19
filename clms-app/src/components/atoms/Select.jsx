import Icon from './Icon';

export default function Select({ children, label, icon, size = 'md', className = '', ...props }) {
  const sizeClasses = {
    sm: `py-1.5 ${icon ? 'pl-7' : 'pl-2.5'} pr-8 text-xs`,
    md: `py-2.5 ${icon ? 'pl-9' : 'pl-3'} pr-10 text-sm`,
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
        {icon && (
          <span className={`pointer-events-none absolute ${size === 'sm' ? 'left-2' : 'left-3'} top-1/2 flex -translate-y-1/2 items-center text-text-muted`}>
            <Icon name={icon} size={size === 'sm' ? 13 : 15} />
          </span>
        )}
        <select
          className={`w-full appearance-none rounded-xl border border-border bg-white ${sizeClasses[size]} text-text focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/20`}
          {...props}
        >
          {children}
        </select>
        <span className={`pointer-events-none absolute ${chevronPos[size]} top-1/2 flex -translate-y-1/2 items-center text-text-muted`}>
          <Icon name="solar:alt-arrow-down-linear" size={size === 'sm' ? 14 : 16} />
        </span>
      </label>
    </div>
  );
}
