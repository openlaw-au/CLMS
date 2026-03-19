import Icon from './Icon';

/**
 * Breadcrumb — inline trail with chevron separators.
 *
 * @param {Array<{label: string, onClick?: function}>} items
 *   Breadcrumb segments. Last item is treated as the current page (non-clickable, bold).
 */
export default function Breadcrumb({ items = [] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && (
              <Icon name="solar:alt-arrow-right-linear" size={12} className="text-text-secondary" />
            )}
            {isLast ? (
              <span className="text-[12px] text-text-muted">{item.label}</span>
            ) : (
              <button
                type="button"
                onClick={item.onClick}
                className="text-[12px] font-medium text-text-secondary transition-colors hover:text-text hover:underline"
              >
                {item.label}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}
