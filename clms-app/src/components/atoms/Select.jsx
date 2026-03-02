import Icon from './Icon';

export default function Select({ children, className = '', ...props }) {
  return (
    <label className="relative block">
      <select
        className={`w-full appearance-none rounded-xl border border-border bg-white py-3 pl-3 pr-9 text-sm leading-none text-text focus:border-brand focus:outline-none ${className}`}
        {...props}
      >
        {children}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
        <Icon name="solar:alt-arrow-down-linear" size={16} />
      </span>
    </label>
  );
}
