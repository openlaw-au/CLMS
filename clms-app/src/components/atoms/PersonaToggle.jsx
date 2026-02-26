import Icon from './Icon';

const options = [
  { id: 'barrister', tab: 'barristers', label: 'Barrister', icon: 'solar:square-academic-cap-linear' },
  { id: 'clerk', tab: 'clerks', label: 'Clerk', icon: 'solar:clipboard-list-linear' },
];

export default function PersonaToggle({ value, onChange, compact = false, className = '' }) {
  const compactClass = compact ? 'compact' : '';

  return (
    <div className={`persona-toggle ${compactClass} ${className}`.trim()}>
      {options.map((option) => {
        const active = value === option.id;
        const iconSize = compact ? 14 : 18;

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            data-tab={option.tab}
            className={`hero-tab ${compactClass} ${active ? 'active' : ''}`}
          >
            <span className="inline-flex items-center gap-1.5">
              <Icon name={option.icon} size={iconSize} />
              <span>{option.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
