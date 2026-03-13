import { useState } from 'react';
import Icon from '../atoms/Icon';
import Button from '../atoms/Button';
import Badge from '../atoms/Badge';

export default function SearchResultCard({ item, type, onRequestLoan, onAddToList, onRequestReturn, addedListEntry = null, onRemoveFromList, directAdd = false, compact = false }) {
  const [loanState, setLoanState] = useState('idle'); // idle | requested
  const [returnState, setReturnState] = useState('idle'); // idle | requested
  const addedToList = Boolean(addedListEntry);

  const handleRequestLoan = () => {
    if (loanState !== 'idle' || item.status !== 'available') return;
    setLoanState('requested');
    onRequestLoan?.(item);
  };

  const handleListAction = async () => {
    if (directAdd && addedToList) {
      return;
    }
    if (addedToList) {
      await onRemoveFromList?.(item, type, addedListEntry);
      return;
    }
    await onAddToList?.(item, type);
  };

  const handleRequestReturn = () => {
    if (returnState !== 'idle') return;
    setReturnState('requested');
    onRequestReturn?.(item);
  };

  if (type === 'jade') {
    if (compact) {
      return (
        <article className="rounded-xl border border-border p-3.5 transition-colors hover:border-border hover:bg-surface-subtle/50">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success/10">
              <Icon name="solar:scale-linear" size={18} className="text-success" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text">{item.title}</p>
              <p className="mt-0.5 text-xs text-text-secondary">{item.citation} {item.court ? `· ${item.court}` : ''} · {item.year}</p>
            </div>
            {directAdd && (
              addedToList ? (
                <span className="inline-flex items-center gap-1 shrink-0 rounded-lg bg-success/10 px-2.5 py-1.5 text-xs font-medium text-success">
                  <Icon name="solar:check-circle-bold" size={16} />
                  Added
                </span>
              ) : (
                <button type="button" onClick={handleListAction} className="shrink-0 rounded-lg bg-brand/10 p-2 text-brand transition-colors hover:bg-brand/20">
                  <Icon name="solar:add-circle-bold" size={20} />
                </button>
              )
            )}
          </div>
        </article>
      );
    }
    return (
      <article className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Icon name="solar:scale-linear" size={16} className="shrink-0 text-success" />
              <p className="text-sm font-semibold text-text">{item.title}</p>
            </div>
            <p className="mt-0.5 text-xs text-text-secondary">
              {item.citation} {item.court ? `· ${item.court}` : ''} · {item.year}
            </p>
          </div>
          <Badge variant="info">JADE</Badge>
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="rounded-md bg-success/10 px-2 py-0.5 text-xs font-medium text-success">JADE</span>
          <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${
            item.type === 'case' ? 'bg-success/10 text-success' : 'bg-info/10 text-info'
          }`}>
            {item.type === 'case' ? 'Case Law' : 'Legislation'}
          </span>
          {item.tags.map((tag) => (
            <span key={tag} className="rounded-md bg-info/10 px-2 py-0.5 text-xs font-medium text-info">{tag}</span>
          ))}
        </div>
        {item.citedCount != null && (
          <p className="mt-2 text-xs text-text-muted">
            Cited {item.citedCount} times
          </p>
        )}
        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => window.open(`https://jade.io/search?q=${encodeURIComponent(item.title)}`, '_blank')}
          >
            Open in JADE
            <Icon name="solar:arrow-right-up-linear" size={12} />
          </Button>
          {directAdd ? (
            addedToList ? (
              <span className="inline-flex items-center gap-1 rounded-lg bg-success/10 px-2.5 py-1.5 text-xs font-medium text-success">
                <Icon name="solar:check-circle-bold" size={14} />
                Added
              </span>
            ) : (
              <button
                type="button"
                onClick={handleListAction}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand transition-colors hover:bg-brand/20"
              >
                <Icon name="solar:add-circle-bold" size={18} />
              </button>
            )
          ) : (
            <Button
              size="sm"
              variant="secondary"
              onClick={handleListAction}
              className={addedToList ? 'text-danger hover:!text-danger' : ''}
            >
              {addedToList ? (
                <><Icon name="solar:trash-bin-trash-linear" size={14} /> Remove from List</>
              ) : (
                '+ Authority List'
              )}
            </Button>
          )}
        </div>
      </article>
    );
  }

  // Book result
  const isOnLoan = item.status === 'on-loan';
  const statusBadge = loanState === 'requested' ? 'Pending' : isOnLoan ? 'On Loan' : 'Available';
  const badgeVariant = loanState === 'requested' ? 'default' : isOnLoan ? 'warning' : 'status';

  if (compact) {
    return (
      <article className="rounded-xl border border-border p-3.5 transition-colors hover:border-border hover:bg-surface-subtle/50">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10">
            <Icon name="solar:book-2-linear" size={18} className="text-brand" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-text">{item.title}</p>
            <div className="mt-0.5 flex items-center gap-2">
              <p className="text-xs text-text-secondary">{item.author} · {item.edition} Ed</p>
              <span className={`rounded-md px-1.5 py-0.5 text-xs font-medium ${isOnLoan ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>
                {isOnLoan ? 'On Loan' : 'Available'}
              </span>
            </div>
          </div>
          {directAdd && (
            addedToList ? (
              <span className="inline-flex items-center gap-1 shrink-0 rounded-lg bg-success/10 px-2.5 py-1.5 text-xs font-medium text-success">
                <Icon name="solar:check-circle-bold" size={16} />
                Added
              </span>
            ) : (
              <button type="button" onClick={handleListAction} className="shrink-0 rounded-lg bg-brand/10 p-2 text-brand transition-colors hover:bg-brand/20">
                <Icon name="solar:add-circle-bold" size={20} />
              </button>
            )
          )}
        </div>
      </article>
    );
  }

  return (
    <article className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Icon name="solar:book-2-linear" size={16} className="shrink-0 text-brand" />
            <p className="text-sm font-semibold text-text">{item.title}</p>
          </div>
          <p className="mt-0.5 text-xs text-text-secondary">
            {item.author} · {item.edition} Ed · {item.publisher}
          </p>
        </div>
        <Badge variant={badgeVariant} className="transition-all duration-300">
          {statusBadge}
        </Badge>
      </div>

      {/* Loan status info */}
      {isOnLoan && (
        <div className="mt-2 flex items-center gap-2 rounded-lg bg-warning/10 px-3 py-1.5">
          <Icon name="solar:clock-circle-linear" size={14} className="shrink-0 text-warning" />
          <p className="text-xs text-warning">
            Currently on loan{item.dueDate ? `, due ${item.dueDate}` : ''}. Request recall to borrow.
          </p>
        </div>
      )}

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <span className="rounded-md bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">Book</span>
        <span className="rounded-md bg-surface-subtle px-2 py-0.5 text-xs font-medium text-text-secondary">
          {item.location}, Flr {item.floor}
        </span>
        {item.enrichment?.subject && (
          <span className="rounded-md bg-info/10 px-2 py-0.5 text-xs font-medium text-info">
            {item.enrichment.subject}
          </span>
        )}
        {!item.enrichment?.subject && item.practiceArea && (
          <span className="rounded-md bg-info/10 px-2 py-0.5 text-xs font-medium text-info">
            {item.practiceArea}
          </span>
        )}
      </div>
      <div className="mt-3 flex gap-2">
        {isOnLoan ? (
          <Button
            size="sm"
            variant={returnState === 'requested' ? 'secondary' : 'primary'}
            onClick={handleRequestReturn}
            disabled={returnState === 'requested'}
            className={`transition-all duration-300 ${returnState === 'requested' ? 'text-success' : ''}`}
          >
            {returnState === 'requested' ? (
              <><Icon name="solar:check-circle-linear" size={14} /> Recall Requested</>
            ) : (
              <><Icon name="solar:undo-left-linear" size={14} /> Request Recall</>
            )}
          </Button>
        ) : (
          <Button
            size="sm"
            variant={loanState === 'requested' ? 'secondary' : 'primary'}
            onClick={handleRequestLoan}
            disabled={loanState === 'requested'}
            className={`transition-all duration-300 ${loanState === 'requested' ? 'text-success' : ''}`}
          >
            {loanState === 'requested' ? (
              <><Icon name="solar:check-circle-linear" size={14} /> Loan Requested</>
            ) : (
              'Request Loan'
            )}
          </Button>
        )}
        {directAdd ? (
          addedToList ? (
            <span className="inline-flex items-center gap-1 rounded-lg bg-success/10 px-2.5 py-1.5 text-xs font-medium text-success">
              <Icon name="solar:check-circle-bold" size={14} />
              Added
            </span>
          ) : (
            <button
              type="button"
              onClick={handleListAction}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand transition-colors hover:bg-brand/20"
            >
              <Icon name="solar:add-circle-bold" size={18} />
            </button>
          )
        ) : (
          <Button
            size="sm"
            variant="secondary"
            onClick={handleListAction}
            className={addedToList ? 'text-danger hover:!text-danger' : ''}
          >
            {addedToList ? (
              <><Icon name="solar:trash-bin-trash-linear" size={14} /> Remove from List</>
            ) : (
              '+ Authority List'
            )}
          </Button>
        )}
      </div>
    </article>
  );
}
