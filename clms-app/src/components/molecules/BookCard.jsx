import Icon from '../atoms/Icon';
import Button from '../atoms/Button';
import { formatShortDate } from '../../utils/dateFormatters';

const PUBLISHER_BADGE = 'bg-surface-subtle text-text-secondary';

export default function BookCard({ book, alreadyBorrowed, pendingLoan, onLoan, overdue, returnRequested, onRequest, onCancel, onRequestReturn, onCancelReturn, requesting, onAddToList }) {
  const isBorrowedByMe = alreadyBorrowed && onLoan;
  const cardBg = overdue ? 'bg-danger/5' : isBorrowedByMe ? 'bg-info/5' : onLoan ? 'bg-surface-subtle' : 'bg-white';
  const iconBg = overdue ? 'bg-danger/10' : isBorrowedByMe ? 'bg-info/10' : onLoan ? 'bg-surface-muted' : 'bg-brand/10';
  const iconColor = overdue ? 'text-danger' : isBorrowedByMe ? 'text-info' : onLoan ? 'text-text-muted' : 'text-brand';

  return (
    <div className={`flex min-h-[300px] flex-col overflow-hidden rounded-2xl ${cardBg} shadow-sm transition-all duration-300 ${
      overdue ? 'ring-2 ring-danger/40' : 'ring-1 ring-black/5'
    }`}>
      <div className="flex flex-1 flex-col p-4">
        {/* Book icon + title + add-to-list */}
        <div className="flex items-center gap-2">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
            <Icon name="solar:book-2-linear" size={16} className={iconColor} />
          </span>
          <p className={`min-w-0 flex-1 font-serif text-sm font-medium leading-snug ${onLoan && !overdue ? 'text-text-secondary' : 'text-text'}`}>{book.title}</p>

          {/* Add to Authority List */}
          {onAddToList && (
            <button
              type="button"
              onClick={onAddToList}
              title="Add to authority list"
              aria-label="Add to authority list"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-brand/10 hover:text-brand"
            >
              <Icon name="solar:add-circle-linear" size={18} />
            </button>
          )}
        </div>

        {/* Author */}
        <div className="mt-2 flex items-center gap-1.5 text-xs text-text-secondary">
          <Icon name="solar:user-linear" size={13} className="shrink-0 text-text-muted" />
          <span className="truncate">{book.author}</span>
        </div>

        {/* Publisher badge */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-medium ${PUBLISHER_BADGE}`}>
            {book.publisher}
          </span>
          {book.edition && (
            <span className="rounded-md bg-surface-subtle px-2 py-0.5 text-[11px] font-medium text-text-secondary">
              {book.edition} ed
            </span>
          )}
        </div>

        {/* Meta — pushed to bottom */}
        <div className="mt-auto pt-3">
          <div className="flex items-center gap-1 text-[11px] text-text-muted">
            <Icon name="solar:map-point-linear" size={12} className="shrink-0" />
            <span className="truncate">{book.location}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-text-muted">
            <Icon name="solar:tag-linear" size={12} className="shrink-0" />
            <span className="truncate">{book.practiceArea}</span>
          </div>
          {onLoan && book.dueDate && (
            <div className={`mt-0.5 flex items-center gap-1 text-[11px] ${overdue ? 'font-medium text-danger' : 'text-text-muted'}`}>
              <Icon name="solar:calendar-linear" size={12} className="shrink-0" />
              <span>{overdue ? 'Overdue' : 'Due'} {formatShortDate(book.dueDate)}</span>
            </div>
          )}
        </div>

        {/* Action */}
        <div className="mt-3">
          {onLoan ? (
            returnRequested ? (
              <div className="flex animate-fade-in items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-info/10 px-2 py-0.5 text-xs font-medium text-info">
                  <Icon name="solar:clock-circle-linear" size={12} />
                  Return Requested
                </span>
                {onCancelReturn && (
                  <button type="button" onClick={() => onCancelReturn(book.id)} className="text-xs text-text-muted hover:text-text">Cancel</button>
                )}
              </div>
            ) : alreadyBorrowed ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-info/10 px-2 py-0.5 text-xs font-medium text-info">
                <Icon name="solar:check-circle-linear" size={12} />
                Borrowed
              </span>
            ) : onRequestReturn ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onRequestReturn(book.id)}
                className="w-full text-xs"
              >
                Request Return
              </Button>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md bg-surface-subtle px-2 py-0.5 text-xs font-medium text-text-secondary">
                <Icon name="solar:clock-circle-linear" size={12} />
                On Loan
              </span>
            )
          ) : pendingLoan ? (
            <div className="flex animate-fade-in items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                <Icon name="solar:hourglass-linear" size={12} />
                Loan Requested
              </span>
              {onCancel && (
                <button type="button" onClick={() => onCancel(book.id)} className="text-xs text-text-muted hover:text-text">Cancel</button>
              )}
            </div>
          ) : alreadyBorrowed ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-info/10 px-2 py-0.5 text-xs font-medium text-info">
              <Icon name="solar:check-circle-linear" size={12} />
              Borrowed
            </span>
          ) : (
            <Button
              size="sm"
              variant="primary"
              onClick={() => onRequest(book.id)}
              disabled={requesting}
              className="w-full text-xs"
            >
              Request Loan
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
