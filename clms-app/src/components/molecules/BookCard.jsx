import { useEffect, useRef, useState } from 'react';
import Icon from '../atoms/Icon';
import Button from '../atoms/Button';
import DueDateLine from './DueDateLine';
import ConfirmModal from './ConfirmModal';

const PUBLISHER_BADGE = 'bg-surface-subtle text-text-secondary';

export default function BookCard({
  book,
  alreadyBorrowed,
  pendingLoan,
  onLoan,
  overdue,
  extended = false,
  returnRequested,
  onRequest,
  onCancel,
  onRequestReturn,
  onCancelReturn,
  requesting,
  onAddToList,
  onApprove,
  onDeny,
  onRecall,
  onDismissRecall,
  onMarkReturned,
  onRemind,
  onExtend,
  onLoanOut,
  onCatalogue,
  reminded = false,
  requesterName = null,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmingCancelReturn, setConfirmingCancelReturn] = useState(false);
  const overflowMenuRef = useRef(null);
  const category = book.enrichment?.subject || book.practiceArea;
  const hasApproveActions = typeof onApprove === 'function';
  const hasRecallRequestActions = typeof onRecall === 'function' && typeof onDismissRecall === 'function';
  const hasMarkReturnedAction = typeof onMarkReturned === 'function';
  const hasRemindAction = typeof onRemind === 'function';
  const hasExtendAction = typeof onExtend === 'function';
  const hasLoanOutAction = typeof onLoanOut === 'function';
  const hasCatalogueAction = typeof onCatalogue === 'function';
  const hasOverflowActions = hasMarkReturnedAction && (hasRemindAction || hasExtendAction);
  const hasRecallAndReturnActions = hasMarkReturnedAction && typeof onRecall === 'function' && !hasRecallRequestActions && !hasOverflowActions;
  const hasStandaloneMarkReturnedAction = hasMarkReturnedAction && !hasOverflowActions && !hasRecallAndReturnActions;
  const hasStandaloneRemindAction = hasRemindAction && !hasMarkReturnedAction && !hasExtendAction;
  const hasBarristerActions = Boolean(
    onRequest ||
    onAddToList ||
    onRequestReturn ||
    onCancel ||
    onCancelReturn ||
    pendingLoan ||
    returnRequested ||
    (alreadyBorrowed && !onLoan)
  );

  useEffect(() => {
    if (!menuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (overflowMenuRef.current && !overflowMenuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [menuOpen]);

  const handleOverflowAction = (action) => {
    setMenuOpen(false);
    action?.();
  };

  const hasAnyAction = (
    hasApproveActions ||
    hasRecallRequestActions ||
    hasOverflowActions ||
    hasRecallAndReturnActions ||
    hasStandaloneMarkReturnedAction ||
    hasLoanOutAction ||
    hasStandaloneRemindAction ||
    hasCatalogueAction ||
    hasBarristerActions
  );

  return (
    <div className="relative flex flex-col rounded-2xl bg-surface shadow-sm transition-all duration-300 ring-1 ring-black/5">
      <div className="flex flex-1 flex-col p-4">
        {/* Status pill */}
        {(() => {
          const status = overdue ? { text: 'Overdue', cls: 'bg-danger/10 text-danger' }
            : hasRecallRequestActions ? { text: 'Recall Requested', cls: 'bg-warning/10 text-warning' }
            : hasApproveActions ? { text: 'Loan Requested', cls: 'bg-warning/10 text-warning' }
            : returnRequested ? { text: 'Recall Requested', cls: 'bg-warning/10 text-warning' }
            : (alreadyBorrowed && onLoan) ? { text: 'Borrowed', cls: 'bg-info/10 text-info' }
            : onLoan ? { text: 'On Loan', cls: 'bg-amber-100 text-amber-700' }
            : pendingLoan ? { text: 'Loan Requested', cls: 'bg-warning/10 text-warning' }
            : { text: 'Available', cls: 'bg-success/10 text-success' };
          return (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${status.cls}`}>
                {status.text}
              </span>
              {reminded && (
                <span className="inline-flex items-center rounded-md bg-info/10 px-2 py-0.5 text-[11px] font-medium text-info">
                  Reminded
                </span>
              )}
            </div>
          );
        })()}

        {/* Title */}
        <p className={`mt-1 font-serif text-sm font-medium leading-snug ${onLoan && !overdue ? 'text-text-secondary' : 'text-text'}`}>{book.title}</p>

        {/* Author */}
        <div className="mt-2 flex items-center gap-1.5 text-xs text-text-secondary">
          <Icon name="solar:user-linear" size={13} className="shrink-0 text-text-muted" />
          <span className="truncate">{book.author}</span>
        </div>

        {/* Borrower (when on loan and visible) */}
        {onLoan && book.borrower && !alreadyBorrowed && (
          <p className="mt-1 truncate text-xs text-text-muted">
            Borrowed by {book.borrower}
          </p>
        )}

        {/* Requester (loan or recall request) */}
        {requesterName && (
          <p className="mt-1 truncate text-xs text-text-muted">
            Requested by {requesterName}
          </p>
        )}

        {/* Publisher badge */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {book.publisher && (
            <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-medium ${PUBLISHER_BADGE}`}>
              {book.publisher}
            </span>
          )}
          {book.edition && (
            <span className="rounded-md bg-surface-subtle px-2 py-0.5 text-[11px] font-medium text-text-secondary">
              {book.edition} ed
            </span>
          )}
          {category && (
            <span className="rounded-md bg-surface-subtle px-2 py-0.5 text-[11px] font-medium text-text-secondary">
              {category}
            </span>
          )}
        </div>

        {onLoan && (
          <DueDateLine
            dueDate={book.dueDate}
            overdue={overdue}
            extended={extended}
            className="mt-3"
          />
        )}

        {/* Action */}
        {hasAnyAction && (
          <div className="mt-auto flex items-stretch gap-2 pt-3">
            {hasApproveActions ? (
              <>
                <div className="flex-1 basis-0 min-w-0">
                  <Button
                    size="sm"
                    variant="approve"
                    onClick={onApprove}
                    className="w-full text-xs"
                  >
                    Approve
                  </Button>
                </div>
                <div className="flex-1 basis-0 min-w-0">
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={onDeny}
                    className="w-full text-xs"
                  >
                    Deny
                  </Button>
                </div>
              </>
            ) : hasRecallRequestActions ? (
              <>
                <div className="flex-1 basis-0 min-w-0">
                  <Button
                    size="sm"
                    variant="approve"
                    onClick={onRecall}
                    className="w-full text-xs"
                  >
                    Mark Resolved
                  </Button>
                </div>
                <div className="flex-1 basis-0 min-w-0">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={onDismissRecall}
                    className="w-full text-xs"
                  >
                    Dismiss
                  </Button>
                </div>
              </>
            ) : hasOverflowActions ? (
              <>
                <div className="flex-1 basis-0 min-w-0">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={onMarkReturned}
                    className="w-full text-xs"
                  >
                    Mark Returned
                  </Button>
                </div>
                <div ref={overflowMenuRef} className="relative flex-1 basis-0 min-w-0">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setMenuOpen((prev) => !prev)}
                    className="w-full min-w-0 gap-1 text-xs"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                  >
                    More
                    <Icon name="solar:alt-arrow-down-linear" size={14} />
                  </Button>
                  {menuOpen && (
                    <div className="absolute right-0 top-full z-20 mt-2 w-[180px] overflow-hidden rounded-xl border border-border/60 bg-white py-1 shadow-lg animate-fade-in">
                      {hasRemindAction ? (
                        <button
                          type="button"
                          onClick={() => handleOverflowAction(onRemind)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text transition-colors hover:bg-slate-100"
                        >
                          <Icon name="solar:bell-linear" size={15} className="text-text-muted" />
                          Send Reminder
                        </button>
                      ) : null}
                      {hasExtendAction ? (
                        <button
                          type="button"
                          onClick={() => handleOverflowAction(onExtend)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text transition-colors hover:bg-slate-100"
                        >
                          <Icon name="solar:restart-linear" size={15} className="text-text-muted" />
                          Extend by 7 days
                        </button>
                      ) : null}
                    </div>
                  )}
                </div>
              </>
            ) : hasRecallAndReturnActions ? (
              <>
                <div className="flex-1 basis-0 min-w-0">
                  <Button
                    size="sm"
                    variant="recall"
                    onClick={onRecall}
                    className="w-full text-xs"
                  >
                    Recall
                  </Button>
                </div>
                <div className="flex-1 basis-0 min-w-0">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={onMarkReturned}
                    className="w-full text-xs"
                  >
                    Mark Returned
                  </Button>
                </div>
              </>
            ) : hasStandaloneMarkReturnedAction ? (
              <div className="w-full">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={onMarkReturned}
                  className="w-full text-xs"
                >
                  Mark Returned
                </Button>
              </div>
            ) : hasLoanOutAction ? (
              <div className="w-full">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={onLoanOut}
                  className="w-full text-xs"
                >
                  Loan Out
                </Button>
              </div>
            ) : hasStandaloneRemindAction ? (
              <div className="w-full">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={onRemind}
                  className="w-full text-xs"
                >
                  Send Reminder
                </Button>
              </div>
            ) : hasCatalogueAction ? (
              <div className="w-full">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={onCatalogue}
                  className="w-full text-xs"
                >
                  Library
                </Button>
              </div>
            ) : (
              <>
                <div className="flex-1 basis-0 min-w-0">
                  {onLoan ? (
                    returnRequested ? (
                      <Button
                        size="sm"
                        variant="recall"
                        onClick={() => {
                          if (onCancelReturn) setConfirmingCancelReturn(true);
                        }}
                        className="w-full text-xs text-success"
                      >
                        <Icon name="solar:check-circle-linear" size={14} /> Requested
                      </Button>
                    ) : alreadyBorrowed ? (
                      <div className="flex w-full items-center">
                        <span className="inline-flex items-center gap-1 rounded-md bg-info/10 px-2 py-0.5 text-xs font-medium text-info">
                          <Icon name="solar:check-circle-linear" size={12} />
                          Borrowed
                        </span>
                      </div>
                    ) : onRequestReturn ? (
                      <Button
                        size="sm"
                        variant="recall"
                        onClick={() => onRequestReturn(book.id)}
                        className="w-full text-xs"
                      >
                        Request
                      </Button>
                    ) : (
                      <div className="flex w-full items-center">
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                          <Icon name="solar:clock-circle-linear" size={12} />
                          On Loan
                        </span>
                      </div>
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
                    <div className="flex w-full items-center">
                      <span className="inline-flex items-center gap-1 rounded-md bg-info/10 px-2 py-0.5 text-xs font-medium text-info">
                        <Icon name="solar:check-circle-linear" size={12} />
                        Borrowed
                      </span>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="recall"
                      onClick={() => onRequest(book.id)}
                      disabled={requesting}
                      className="w-full text-xs"
                    >
                      Request
                    </Button>
                  )}
                </div>
                {onAddToList && (
                  <div className="flex-1 basis-0 min-w-0">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={onAddToList}
                      title="Add to authority list"
                      aria-label="Add to authority list"
                      className="w-full text-xs"
                    >
                      + List
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
      {confirmingCancelReturn && (
        <ConfirmModal
          title="Cancel recall request?"
          body="The borrower will keep the book until the original due date."
          confirmLabel="Cancel recall"
          cancelLabel="Keep"
          confirmVariant="danger"
          onConfirm={() => onCancelReturn?.(book.id)}
          onClose={() => setConfirmingCancelReturn(false)}
        />
      )}
    </div>
  );
}
