import Icon from './Icon';

export default function Input({ icon, className = '', ...props }) {
  const isIconName = typeof icon === 'string';

  return (
    <label className="relative block">
      {icon ? (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          {isIconName ? <Icon name={icon} size={16} /> : icon}
        </span>
      ) : null}
      <input
        className={`h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none ${icon ? 'pl-9' : ''} ${className}`}
        {...props}
      />
    </label>
  );
}
