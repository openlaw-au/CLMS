export default function Tag({
  label,
  removable = false,
  onRemove,
  className = '',
}) {
  return (
    <span className={`inline-flex items-center gap-1 rounded bg-slate-100 px-1 py-px text-[8px] font-medium text-slate-600 ${className}`}>
      <span>{label}</span>
      {removable ? (
        <button
          type="button"
          aria-label={`Remove ${label}`}
          onClick={onRemove}
          className="inline-flex h-3 w-3 items-center justify-center rounded text-slate-400 transition-colors hover:text-slate-600"
        >
          <span className="text-[9px] leading-none">x</span>
        </button>
      ) : null}
    </span>
  );
}
