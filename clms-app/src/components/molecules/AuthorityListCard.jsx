import Icon from '../atoms/Icon';
import { getCourtStructure } from '../../utils/courtStructures';

export default function AuthorityListCard({
  list,
  onClick,
  selected = false,
  selectable = false,
  onMenuOpen,
  menuOpen = false,
  onDuplicate,
  onDelete,
  compact = false,
}) {
  const items = list.items || [];
  const cases = items.filter((item) => item.type === 'case').length;
  const legislation = items.filter((item) => item.type === 'legislation').length;
  const books = items.filter((item) => item.type === 'book').length;
  const courtLabel = getCourtStructure(list.courtStructure || 'vic').label;
  const paddingClass = compact ? 'p-4' : 'p-5';
  const showMenu = !selectable && !compact;

  return (
    <article
      onClick={onClick}
      className={`relative cursor-pointer rounded-xl bg-white ${paddingClass} shadow-sm ring-1 transition-all hover:shadow-md ${
        selected ? 'ring-2 ring-brand bg-brand/5' : 'ring-black/5 hover:ring-black/10'
      }`}
    >
      {showMenu && (
        <div className="absolute right-3 top-3">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onMenuOpen?.();
            }}
            className="btn-icon h-8 w-8 text-text-muted hover:bg-surface-subtle hover:text-text"
          >
            <Icon name="solar:menu-dots-bold" size={16} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-9 z-20 w-44 overflow-hidden rounded-xl border border-border/60 bg-white py-1 shadow-lg animate-fade-in">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onDuplicate?.();
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-text transition-colors hover:bg-slate-100"
              >
                <Icon name="solar:copy-linear" size={15} />
                Duplicate
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete?.();
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-700 transition-colors hover:bg-red-50"
              >
                <Icon name="solar:trash-bin-trash-linear" size={15} />
                Remove
              </button>
            </div>
          )}
        </div>
      )}

      <div className={showMenu ? 'pr-8' : ''}>
        <h3 className="flex items-center gap-2 font-serif text-card-title font-semibold text-text">
          {selectable && (
            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
              selected ? 'border-brand bg-brand text-white' : 'border-border bg-white'
            }`}>
              {selected && <Icon name="solar:check-linear" size={12} />}
            </span>
          )}
          <Icon name="solar:folder-open-linear" size={18} className="shrink-0 text-brand" />
          <span className="truncate">{list.name}</span>
        </h3>
        <p className="mt-1 h-4 truncate text-xs text-text-muted">{list.caseRef || ''}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {cases > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md bg-surface-subtle px-2 py-0.5 text-xs font-medium text-emerald-700">
              <Icon name="solar:scale-linear" size={12} />
              {cases} {cases === 1 ? 'case' : 'cases'}
            </span>
          )}
          {legislation > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md bg-surface-subtle px-2 py-0.5 text-xs font-medium text-legislation">
              <Icon name="solar:document-text-linear" size={12} />
              {legislation} legislation
            </span>
          )}
          {books > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md bg-surface-subtle px-2 py-0.5 text-xs font-medium text-orange-700">
              <Icon name="solar:book-2-linear" size={12} />
              {books} {books === 1 ? 'book' : 'books'}
            </span>
          )}
        </div>
        {!compact && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-surface-subtle px-2 py-0.5 text-xs font-medium text-text-muted">
              {courtLabel}
            </span>
            {(list.issues?.length > 0) && (
              <span className="rounded-md bg-surface-subtle px-2 py-0.5 text-xs font-medium text-text-muted">
                {list.issues.length} {list.issues.length === 1 ? 'issue' : 'issues'}
              </span>
            )}
            {list.createdAt && (
              <span className="text-xs text-text-muted">{list.createdAt}</span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
