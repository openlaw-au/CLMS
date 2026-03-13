import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../atoms/Icon';
import Button from '../../atoms/Button';
import LoanCard from '../../molecules/LoanCard';
import { useAppContext } from '../../../context/AppContext';
import { useToast } from '../../../context/ToastContext';
import { getLoans, returnBook, renewLoan } from '../../../services/loansService';

export default function BarristerLoansPage() {
  const navigate = useNavigate();
  const { onboarding } = useAppContext();
  const { addToast } = useToast();
  const firstVisit = onboarding.firstVisit !== false;

  const [tab, setTab] = useState('active');
  const [loans, setLoans] = useState([]);

  const refresh = () => getLoans().then(setLoans);

  useEffect(() => {
    if (!firstVisit) {
      // TODO(api): Replace with GET /api/loans?borrower=me — fetch all of user's loans
      refresh();
    }
  }, [firstVisit]);

  const active = loans.filter((l) => l.status === 'active');
  const overdue = loans.filter((l) => l.status === 'overdue');
  const pending = loans.filter((l) => l.status === 'pending');
  const holds = []; // TODO(api): Replace with GET /api/holds — fetch holds queue
  const returned = loans.filter((l) => l.status === 'returned');

  const tabs = [
    { key: 'active', label: 'Active', count: active.length },
    { key: 'overdue', label: 'Overdue', count: overdue.length },
    { key: 'pending', label: 'Pending', count: pending.length },
    { key: 'holds', label: 'Holds', count: holds.length },
    { key: 'history', label: 'History', count: returned.length },
  ];

  const getFiltered = () => {
    if (tab === 'active') return active;
    if (tab === 'overdue') return overdue;
    if (tab === 'pending') return pending;
    if (tab === 'holds') return holds;
    return returned;
  };

  const handleReturn = async (id) => {
    // TODO(api): Replace with PATCH /api/loans/:id/return — return book
    await returnBook(id);
    addToast({ message: 'Book returned!', type: 'success' });
    await refresh();
  };

  const handleExtend = async (id) => {
    // TODO(api): Replace with PATCH /api/loans/:id/renew — request extension
    await renewLoan(id);
    addToast({ message: 'Extended 7 days', type: 'success' });
    await refresh();
  };

  const filtered = getFiltered();

  return (
    <div className="animate-page-in">
      <h1 className="font-serif text-3xl text-text">My Loans</h1>
      <p className="mt-2 text-sm text-text-secondary">Track your borrowed books and loan history.</p>

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
              <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-text-muted">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {firstVisit ? (
        <div className="mt-6 flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <Icon name="solar:book-bookmark-linear" size={24} className="text-slate-400" />
          </span>
          <p className="mt-4 text-sm font-medium text-text">No loans yet</p>
          <p className="mt-1 text-sm text-text-secondary">Find a book in the library and request a loan.</p>
          <Button className="mt-4" onClick={() => navigate('/app/search')}>
            <Icon name="solar:magnifer-linear" size={16} />
            Search library
          </Button>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {filtered.map((loan) => (
            <LoanCard
              key={loan.id}
              loan={loan}
              role="barrister"
              onReturn={handleReturn}
              onExtend={handleExtend}
            />
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-text-muted">
              {tab === 'holds' ? 'No holds in queue.' : `No ${tab} loans.`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
