import Icon from './Icon';

export default function Input({ icon, className = '', ...props }) {
  const isIconName = typeof icon === 'string';

  return (
    <label className="relative block">
      {icon ? (
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 flex items-center text-text-secondary">
          {isIconName ? <Icon name={icon} size={16} /> : icon}
        </span>
      ) : null}
      <input
        className={`w-full rounded-xl border border-border bg-white px-3 py-3 text-sm leading-none text-text placeholder:text-text-muted focus:border-brand focus:outline-none ${icon ? 'pl-9' : ''} ${className}`}
        {...props}
      />
    </label>
  );
}
