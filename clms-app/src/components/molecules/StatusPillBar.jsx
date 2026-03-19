import Icon from '../atoms/Icon';
import BadgeDot from '../atoms/BadgeDot';

/**
 * A row of toggle pill buttons with icon + label + count.
 *
 * @param {Array} items — [{ key, label, count, icon, activeColor?, badge? }]
 * @param {string} value — currently active key
 * @param {(key: string) => void} onChange
 */
export default function StatusPillBar({ items, value, onChange, className = '' }) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {items.map((pill) => (
        <button
          key={pill.key}
          type="button"
          onClick={() => onChange(pill.key)}
          className={`relative flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
            value === pill.key
              ? `${pill.activeColor || 'bg-brand'} text-white`
              : 'bg-slate-200/70 text-slate-500 hover:bg-slate-200'
          }`}
        >
          <Icon name={pill.icon} size={14} />
          {pill.label} ({pill.count})
          {pill.badge && <BadgeDot className="absolute -right-0.5 -top-0.5" />}
        </button>
      ))}
    </div>
  );
}
