import { useEffect, useRef, useState } from 'react';
import Icon from '../atoms/Icon';

export default function FilterPill({ label, options = [], value, onChange, disabled = false, disabledMessage }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const hasValue = value && value !== 'all';
  const displayLabel = hasValue ? value : label;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-300 ${
          disabled
            ? 'border-border bg-surface-subtle text-text-muted cursor-default'
            : hasValue
              ? 'border-brand bg-brand/10 text-brand'
              : 'border-border bg-white text-text-secondary hover:border-brand/40 hover:bg-brand/5'
        }`}
      >
        <span>{displayLabel}</span>
        {hasValue ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange('all'); setOpen(false); }}
            className="rounded-full p-0.5 hover:bg-brand/20"
          >
            <Icon name="solar:close-circle-linear" size={14} />
          </button>
        ) : (
          <Icon name="solar:alt-arrow-down-linear" size={14} />
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 min-w-[180px] rounded-xl border border-border/60 bg-white py-1 shadow-lg">
          {disabled && disabledMessage ? (
            <p className="px-3 py-2 text-xs text-text-muted">{disabledMessage}</p>
          ) : (
            <>
              <button
                type="button"
                onClick={() => { onChange('all'); setOpen(false); }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-surface-subtle ${
                  !hasValue ? 'font-medium text-brand' : 'text-text-secondary'
                }`}
              >
                All
              </button>
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors hover:bg-surface-subtle ${
                    value === opt.value ? 'font-medium text-brand' : 'text-text-secondary'
                  }`}
                >
                  <span>{opt.label}</span>
                  {opt.count != null && (
                    <span className="text-text-muted">({opt.count})</span>
                  )}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
