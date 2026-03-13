import { useEffect, useState } from 'react';
import Icon from '../../atoms/Icon';
import Button from '../../atoms/Button';
import Badge from '../../atoms/Badge';
import LoanCard from '../../molecules/LoanCard';
import LoanActionModal from '../../organisms/LoanActionModal';
import { useToast } from '../../../context/ToastContext';
import { getLoans, approveLoan, denyLoan, sendReminder } from '../../../services/loansService';
import { formatDueDate } from '../../../utils/dateFormatters';

export default function ClerkLoansPage() {
  const { addToast } = useToast();
  const [loans, setLoans] = useState([]);
  const [tab, setTab] = useState('pending');
  const [denyTarget, setDenyTarget] = useState(null);

  const refresh = () => getLoans().then(setLoans);

  useEffect(() => {
    // TODO(api): Replace with GET /api/loans — fetch all loans for clerk management
    refresh();
  }, []);

  const pending = loans.filter((l) => l.status === 'pending');
  const active = loans.filter((l) => l.status === 'active');
  const overdue = loans.filter((l) => l.status === 'overdue');
  const returned = loans.filter((l) => l.status === 'returned');
  const denied = loans.filter((l) => l.status === 'denied');

  const tabs = [
    { key: 'pending', label: 'Pending', count: pending.length },
    { key: 'active', label: 'Active', count: active.length },
    { key: 'overdue', label: 'Overdue', count: overdue.length },
    { key: 'history', label: 'History', count: returned.length + denied.length },
  ];

  const getFiltered = () => {
    if (tab === 'pending') return pending;
    if (tab === 'active') return active;
    if (tab === 'overdue') return overdue;
    return [...returned, ...denied];
  };

  const handleApprove = async (id) => {
    // TODO(api): Replace with PATCH /api/loans/:id/approve — approve pending loan
    await approveLoan(id);
    addToast({ message: 'Approved · Borrower notified', type: 'success' });
    await refresh();
  };

  const handleDeny = async (id, reason) => {
    // TODO(api): Replace with PATCH /api/loans/:id/deny — deny pending loan
    await denyLoan(id, reason);
    addToast({ message: 'Denied · Borrower notified', type: 'success' });
    setDenyTarget(null);
    await refresh();
  };

  const handleRemind = async (id) => {
    const loan = loans.find((l) => l.id === id);
    // TODO(api): Replace with POST /api/loans/:id/reminder — send overdue reminder
    await sendReminder(id);
    addToast({ message: `Reminder sent to ${loan?.borrower || 'borrower'}`, type: 'success' });
    await refresh();
  };

  const filtered = getFiltered();

  return (
    <div className="animate-page-in">
      <h1 className="font-serif text-3xl text-text">Loan Management</h1>
      <p className="mt-1 text-sm text-text-secondary">Approve requests, track overdue items, and manage loans.</p>

      {/* Tabs */}
      <div className="mt-5 flex gap-1 rounded-xl bg-slate-100 p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 flex-1 justify-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-white text-text shadow-sm' : 'text-text-secondary hover:text-text'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                t.key === 'overdue' ? 'bg-red-100 text-red-600' : t.key === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-text-muted'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-4">
        {/* Main content */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            {filtered.length > 0 ? (
              <div className="divide-y divide-border/40">
                {filtered.map((loan) => (
                  <LoanCard
                    key={loan.id}
                    loan={loan}
                    role="clerk"
                    onApprove={handleApprove}
                    onDeny={(loan) => setDenyTarget(loan)}
                    onRemind={handleRemind}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted">No {tab} loans.</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="text-sm font-semibold text-text">Summary</h2>
            <div className="mt-4 space-y-3">
              {[
                ['Pending', pending.length, 'solar:hourglass-linear', 'bg-amber-50', 'text-amber-500'],
                ['Overdue', overdue.length, 'solar:alarm-linear', 'bg-red-50', 'text-red-500'],
                ['Active', active.length, 'solar:book-bookmark-linear', 'bg-emerald-50', 'text-emerald-500'],
                ['Returned', returned.length, 'solar:round-arrow-left-linear', 'bg-slate-100', 'text-text-secondary'],
              ].map(([label, count, icon, bg, color]) => (
                <div key={label} className="flex items-center gap-3">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${bg}`}>
                    <Icon name={icon} size={18} className={color} />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm text-text-secondary">{label}</p>
                  </div>
                  <p className={`text-lg font-bold ${count > 0 ? color : 'text-text'}`}>{count}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
                <Icon name="solar:chart-2-linear" size={20} className="text-brand" />
              </span>
              <div>
                <p className="text-2xl font-bold text-text">{loans.length}</p>
                <p className="text-xs text-text-muted">Total loans recorded</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deny modal */}
      {denyTarget && (
        <LoanActionModal
          loan={denyTarget}
          onDeny={handleDeny}
          onClose={() => setDenyTarget(null)}
        />
      )}
    </div>
  );
}
