import { useEffect, useRef, useState } from 'react';
import Icon from '../atoms/Icon';

/**
 * Multi-select category dropdown with checkbox options.
 *
 * @param {Array} options — [{ label, count }]
 * @param {Set} selected — currently selected labels
 * @param {(label: string) => void} onToggle — toggle one option
 * @param {() => void} onClear — clear all selections
 * @param {string} icon — icon name for trigger button
 * @param {string} placeholder — text when nothing selected
 */
export default function CategoryDropdown({ options, selected, onToggle, onClear, icon = 'solar:tag-linear', placeholder = 'All Categories', className = '' }) {
  const ref = useRef(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex appearance-none items-center gap-1.5 whitespace-nowrap rounded-xl border border-border bg-white py-2 pl-3 pr-10 text-sm text-text"
      >
        <Icon name={icon} size={15} className="shrink-0 text-text-muted" />
        <span>{selected.size === 0 ? placeholder : `${selected.size} selected`}</span>
      </button>
      <span className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center text-text-muted">
        <Icon name="solar:alt-arrow-down-linear" size={16} />
      </span>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-56 overflow-hidden rounded-xl border border-border/60 bg-white py-1 shadow-lg">
          {selected.size > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="w-full px-3 py-1.5 text-left text-xs font-medium text-brand transition-colors hover:bg-surface-subtle"
            >
              Clear all
            </button>
          )}
          {options.map(({ label, count }) => (
            <label
              key={label}
              className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm transition-colors hover:bg-surface-subtle"
            >
              <input
                type="checkbox"
                checked={selected.has(label)}
                onChange={() => onToggle(label)}
                className="h-3.5 w-3.5 rounded border-border text-brand accent-brand"
              />
              <span className="flex-1 text-text">{label}</span>
              <span className="text-xs text-text-muted">{count}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
