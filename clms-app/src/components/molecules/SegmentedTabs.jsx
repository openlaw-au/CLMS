import PropTypes from 'prop-types';
import BadgeDot from '../atoms/BadgeDot';
import Icon from '../atoms/Icon';
import Skeleton from '../atoms/Skeleton';

const ACTIVE_ACCENT_CLASSES = {
  amber: 'bg-amber-500 text-white shadow-sm',
  brand: 'bg-brand text-white shadow-sm',
  emerald: 'bg-emerald-600 text-white shadow-sm',
  red: 'bg-red-600 text-white shadow-sm',
};

function getActiveTabClasses(activeAccent) {
  if (!activeAccent) {
    return 'bg-white text-text font-semibold shadow-sm ring-1 ring-black/5';
  }

  return `${ACTIVE_ACCENT_CLASSES[activeAccent] ?? ACTIVE_ACCENT_CLASSES.brand} font-semibold`;
}

/** Props: { items, value, onChange, fullWidth?, loading? }. */
export default function SegmentedTabs({
  fullWidth = false,
  items,
  loading = false,
  onChange,
  value,
}) {
  return (
    <div className="flex gap-1 rounded-xl bg-black/5 p-1">
      {loading ? (
        Array.from({ length: items.length || 3 }, (_, index) => (
          <Skeleton
            key={index}
            className={`h-9 rounded-lg ${fullWidth ? 'flex-1' : 'w-20'}`}
          />
        ))
      ) : (
        items.map((item) => {
          const isActive = value === item.key;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key)}
              aria-pressed={isActive}
              className={`relative flex min-w-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm whitespace-nowrap transition-all duration-150 ease-out ${fullWidth ? 'flex-1 justify-center' : 'shrink-0'} ${isActive ? getActiveTabClasses(item.activeAccent) : 'bg-transparent font-medium text-text-secondary hover:bg-white/60 hover:text-text'}`}
            >
              {item.icon && (
                <Icon
                  name={item.icon}
                  size={14}
                  className="shrink-0 text-current"
                />
              )}
              <span className="truncate">
                {item.label}
                {typeof item.count === 'number' && (
                  <span className="ml-1 font-normal opacity-70">({item.count})</span>
                )}
              </span>
              {item.badge && (
                <BadgeDot
                  tone={item.badgeTone}
                  className={`absolute -right-0.5 -top-0.5 ${item.badgeClassName || ''}`}
                />
              )}
            </button>
          );
        })
      )}
    </div>
  );
}

SegmentedTabs.propTypes = {
  fullWidth: PropTypes.bool,
  items: PropTypes.arrayOf(PropTypes.shape({
    activeAccent: PropTypes.oneOf(['brand', 'red', 'amber', 'emerald']),
    badge: PropTypes.bool,
    badgeClassName: PropTypes.string,
    badgeTone: PropTypes.oneOf(['brand', 'red']),
    count: PropTypes.number,
    icon: PropTypes.string,
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    tone: PropTypes.oneOf(['neutral', 'amber', 'red', 'emerald', 'brand', 'info']),
  })).isRequired,
  loading: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
};
