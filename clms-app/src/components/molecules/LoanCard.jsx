import { useState } from 'react';
import Icon from '../atoms/Icon';
import Button from '../atoms/Button';
import Badge from '../atoms/Badge';
import { formatDueDate, formatShortDate, getOverdueSeverity } from '../../utils/dateFormatters';

const severityStyles = {
  none: 'text-text-secondary',
  warning: 'text-amber-600',
  danger: 'text-red-600',
  critical: 'text-red-600',
};

const clerkStatusToType = {
  pending: 'loan-request',
  active: 'active',
  overdue: 'overdue',
  returned: 'returned',
  denied: 'denied',
};

const clerkTypeStyles = {
  'loan-request': {
    icon: 'solar:hand-shake-linear',
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-500',
  },
  'recall-request': {
    icon: 'solar:undo-left-linear',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
  active: {
    icon: 'solar:book-bookmark-linear',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-500',
  },
  overdue: {
    icon: 'solar:clock-circle-linear',
    iconBg: 'bg-red-50',
    iconColor: 'text-red-600',
  },
  returned: {
    icon: 'solar:check-circle-linear',
    iconBg: 'bg-slate-100',
    iconColor: 'text-text-muted',
  },
  denied: {
    icon: 'solar:close-circle-linear',
    iconBg: 'bg-slate-100',
    iconColor: 'text-text-muted',
  },
};

function formatShortDateOrFallback(dateStr, fallback = 'No date') {
  return dateStr ? formatShortDate(dateStr) : fallback;
}

function getClerkSubtitle(rowType, loan, request) {
  if (rowType === 'loan-request') {
    return (
      <span className="text-text-muted">
        {loan.borrower} requested · {formatShortDateOrFallback(loan.dateBorrowed)}
      </span>
    );
  }

  if (rowType === 'recall-request') {
    return (
      <span className="text-text-muted">
        {request.requesterName} requested · current borrower {request.currentBorrower || 'Unknown borrower'}, due {formatShortDateOrFallback(request.dueDate, 'No due date')}
      </span>
    );
  }

  if (rowType === 'active') {
    return (
      <span className="text-text-muted">
        {loan.borrower} · due {formatShortDateOrFallback(loan.dueDate, 'No due date')}
      </span>
    );
  }

  if (rowType === 'overdue') {
    return (
      <>
        <span className="text-text-muted">{loan.borrower} · overdue </span>
        <span className="font-medium text-red-600">{formatShortDateOrFallback(loan.dueDate, 'No due date')}</span>
      </>
    );
  }

  if (rowType === 'returned') {
    return (
      <span className="text-text-muted">
        {loan.borrower} · returned {formatShortDateOrFallback(loan.returnedDate)}
      </span>
    );
  }

  return (
    <span className="text-text-muted">
      {loan.borrower} · denied{loan.denyReason ? ` (${loan.denyReason})` : ''}
    </span>
  );
}

function getHistoryBadge(rowType, loan) {
  if (rowType === 'returned') {
    return <Badge variant="status">Returned</Badge>;
  }

  return (
    <Badge variant="danger">
      Denied{loan.denyReason ? ` (${loan.denyReason})` : ''}
    </Badge>
  );
}

export default function LoanCard({
  loan,
  request,
  role,
  type,
  onApprove,
  onDeny,
  onRecall,
  onDismissRecall,
  onRemind,
  onReturn,
  onExtend,
}) {
  const [approveState, setApproveState] = useState('idle');

  const rowType = type ?? clerkStatusToType[loan?.status] ?? 'active';
  const loanForDisplay = request ?? loan;
  const severity = getOverdueSeverity(loan?.dueDate);
  const dueDateText = formatDueDate(loan?.dueDate);

  const handleApprove = () => {
    setApproveState('approved');
    onApprove?.(loan.id);
  };

  if (role === 'clerk') {
    const cardStyle = clerkTypeStyles[rowType];

    return (
      <div className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center self-center rounded-xl ${cardStyle.iconBg}`}>
            <Icon
              name={cardStyle.icon}
              size={20}
              className={cardStyle.iconColor}
            />
          </span>
          <div className="min-w-0">
            <p className="truncate font-serif text-sm font-medium text-text">{loanForDisplay.bookTitle}</p>
            <p className="mt-0.5 text-xs">
              {getClerkSubtitle(rowType, loan, request)}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          <div className="flex flex-wrap items-center justify-end gap-2">
            {(rowType === 'returned' || rowType === 'denied') ? getHistoryBadge(rowType, loan) : null}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {rowType === 'loan-request' && (
              approveState === 'approved' ? (
                <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 transition-all duration-300">
                  <Icon name="solar:check-circle-linear" size={14} /> Approved
                </span>
              ) : (
                <>
                  <Button size="sm" variant="approve" onClick={handleApprove}>Approve</Button>
                  <Button size="sm" variant="danger" onClick={() => onDeny?.(loan)}>Deny</Button>
                </>
              )
            )}
            {rowType === 'recall-request' && (
              <>
                <Button size="sm" variant="recall" onClick={() => onRecall?.(request.id)}>Recall</Button>
                <Button size="sm" variant="secondary" onClick={() => onDismissRecall?.(request.id)}>Dismiss</Button>
              </>
            )}
            {rowType === 'active' && (
              <>
                <Button size="sm" variant="approve" onClick={() => onReturn?.(loan.id)}>Mark Returned</Button>
                {onExtend ? (
                  <Button size="sm" variant="secondary" onClick={() => onExtend?.(loan.id)}>Extend</Button>
                ) : null}
              </>
            )}
            {rowType === 'overdue' && (
              <>
                <Button size="sm" variant="approve" onClick={() => onReturn?.(loan.id)}>Mark Returned</Button>
                <Button size="sm" variant="recall" onClick={() => onRemind?.(loan.id)}>Send Reminder</Button>
                {onExtend ? (
                  <Button size="sm" variant="secondary" onClick={() => onExtend?.(loan.id)}>Extend</Button>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Barrister view
  return (
    <article className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-serif text-sm font-semibold text-text">{loan.bookTitle}</p>
          <p className={`mt-0.5 text-xs ${loan.status === 'overdue' ? severityStyles[severity] : 'text-text-secondary'}`}>
            {dueDateText}
          </p>
        </div>
        <Badge variant={loan.status === 'overdue' ? 'default' : loan.status === 'pending' ? 'default' : 'status'}>
          {loan.status}
        </Badge>
      </div>
      {(loan.status === 'active' || loan.status === 'overdue') && (
        <div className="mt-3 flex gap-2">
          {onExtend && (
            <Button size="sm" variant="secondary" onClick={() => onExtend(loan.id)}>
              Request Extension
            </Button>
          )}
          {onReturn && (
            <Button size="sm" variant="secondary" onClick={() => onReturn(loan.id)}>
              Return via Scan
            </Button>
          )}
        </div>
      )}
    </article>
  );
}
