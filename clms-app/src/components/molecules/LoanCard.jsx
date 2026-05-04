import { useState } from 'react';
import Icon from '../atoms/Icon';
import Button from '../atoms/Button';
import Badge from '../atoms/Badge';
import { formatDueDate, getOverdueSeverity } from '../../utils/dateFormatters';

const severityStyles = {
  none: 'text-text-secondary',
  warning: 'text-amber-600',
  danger: 'text-red-600',
  critical: 'text-red-600 font-bold',
};

export default function LoanCard({ loan, role, onApprove, onDeny, onRemind, onReturn, onExtend }) {
  const [approveState, setApproveState] = useState('idle');

  const severity = getOverdueSeverity(loan.dueDate);
  const dueDateText = formatDueDate(loan.dueDate);

  const handleApprove = () => {
    setApproveState('approved');
    onApprove?.(loan.id);
  };

  if (role === 'clerk') {
    return (
      <div className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
        <div className="flex items-center gap-3">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            loan.status === 'overdue' ? 'bg-red-50' : loan.status === 'pending' ? 'bg-amber-50' : 'bg-emerald-50'
          }`}>
            <Icon
              name={loan.status === 'overdue' ? 'solar:clock-circle-linear' : loan.status === 'pending' ? 'solar:hand-shake-linear' : 'solar:book-bookmark-linear'}
              size={18}
              className={loan.status === 'overdue' ? 'text-red-500' : loan.status === 'pending' ? 'text-amber-500' : 'text-emerald-500'}
            />
          </span>
          <div>
            <p className="text-sm font-medium text-text">{loan.bookTitle}</p>
            <p className={`text-xs ${loan.status === 'overdue' ? severityStyles[severity] : 'text-text-muted'}`}>
              {loan.status === 'pending'
                ? `${loan.borrower} requested · ${loan.dateBorrowed}`
                : `${loan.borrower} · ${dueDateText}`
              }
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {loan.status === 'pending' && (
            approveState === 'approved' ? (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 transition-all duration-300">
                <Icon name="solar:check-circle-linear" size={14} /> Approved
              </span>
            ) : (
              <>
                <Button size="sm" variant="primary" onClick={handleApprove}>Approve</Button>
                <Button size="sm" variant="danger" onClick={() => onDeny?.(loan)}>Deny</Button>
              </>
            )
          )}
          {loan.status === 'active' && (
            <>
              <Button size="sm" variant="secondary" onClick={() => onReturn?.(loan.id)}>Mark Returned</Button>
              <Button size="sm" variant="secondary" onClick={() => onExtend?.(loan.id)}>Extend</Button>
            </>
          )}
          {loan.status === 'overdue' && (
            <>
              <Button size="sm" variant="secondary" onClick={() => onReturn?.(loan.id)}>Mark Returned</Button>
              <Button size="sm" variant="secondary" onClick={() => onExtend?.(loan.id)}>Extend</Button>
              <Button size="sm" variant="secondary" onClick={() => onRemind?.(loan.id)}>Send Reminder</Button>
            </>
          )}
          {severity === 'critical' && loan.status === 'overdue' && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">Escalated</span>
          )}
        </div>
      </div>
    );
  }

  // Barrister view
  return (
    <article className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-text">{loan.bookTitle}</p>
          <p className={`mt-0.5 text-xs ${loan.status === 'overdue' ? severityStyles[severity] : 'text-text-secondary'}`}>
            {dueDateText}
          </p>
          {loan.location && (
            <p className="mt-0.5 text-xs text-text-muted">Location: {loan.location}</p>
          )}
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
