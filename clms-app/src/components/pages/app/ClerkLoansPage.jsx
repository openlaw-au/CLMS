import { useEffect, useState } from 'react';
import Icon from '../../atoms/Icon';
import Button from '../../atoms/Button';
import Skeleton from '../../atoms/Skeleton';
import ContentLoader from '../../atoms/ContentLoader';
import LoanCard from '../../molecules/LoanCard';
import PageHeader from '../../molecules/PageHeader';
import SegmentedTabs from '../../molecules/SegmentedTabs';
import SummaryCard from '../../molecules/SummaryCard';
import LoanActionModal from '../../organisms/LoanActionModal';
import NewLoanModal from '../../organisms/NewLoanModal';
import { useAppContext } from '../../../context/AppContext';
import { useToast } from '../../../context/ToastContext';
import { getLoans, approveLoan, denyLoan, sendReminder, returnLoan, renewLoan } from '../../../services/loansService';
import { getRecallRequests, recallRequest, dismissRecallRequest } from '../../../services/recallRequestsService';
import { formatShortDate } from '../../../utils/dateFormatters';

export default function ClerkLoansPage() {
  const { chambersSettings } = useAppContext();
  const { addToast } = useToast();
  const [loans, setLoans] = useState([]);
  const [recallRequests, setRecallRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');
  const [denyTarget, setDenyTarget] = useState(null);
  const [showNewLoan, setShowNewLoan] = useState(false);

  const refreshLoans = () => getLoans().then(setLoans);
  const refreshRecalls = () => getRecallRequests().then(setRecallRequests);

  useEffect(() => {
    // TODO(api): Replace with GET /api/loans — fetch all loans for clerk management
    const min = new Promise((r) => setTimeout(r, 400));
    Promise.all([getLoans(), getRecallRequests(), min]).then(([l, recalls]) => {
      setLoans(l);
      setRecallRequests(recalls);
      setLoading(false);
    });
  }, []);

  const pending = loans.filter((l) => l.status === 'pending');
  const recalls = recallRequests;
  const active = loans.filter((l) => l.status === 'active');
  const overdue = loans.filter((l) => l.status === 'overdue');
  const returned = loans.filter((l) => l.status === 'returned');
  const denied = loans.filter((l) => l.status === 'denied');

  const tabs = [
    { key: 'pending', label: 'Pending', count: pending.length, tone: 'amber' },
    { key: 'recalls', label: 'Recalls', count: recalls.length, tone: 'amber' },
    { key: 'active', label: 'Active', count: active.length, tone: 'emerald' },
    { key: 'overdue', label: 'Overdue', count: overdue.length, tone: 'red' },
    { key: 'history', label: 'History', count: returned.length + denied.length, tone: 'neutral' },
  ];

  const summaryRows = [
    { label: 'Pending', value: pending.length, icon: 'solar:hourglass-linear', tone: 'amber' },
    { label: 'Overdue', value: overdue.length, icon: 'solar:alarm-linear', tone: 'red' },
    { label: 'Active', value: active.length, icon: 'solar:book-bookmark-linear', tone: 'emerald' },
    { label: 'Returned', value: returned.length, icon: 'solar:round-arrow-left-linear', tone: 'neutral' },
    { label: 'Total loans recorded', value: loans.length, icon: 'solar:chart-2-linear', tone: 'brand' },
  ];

  const getFilteredLoans = () => {
    if (tab === 'pending') return pending;
    if (tab === 'active') return active;
    if (tab === 'overdue') return overdue;
    return [...returned, ...denied];
  };

  const handleApprove = async (id) => {
    // TODO(api): Replace with PATCH /api/loans/:id/approve — approve pending loan
    await approveLoan(id, chambersSettings?.defaultLoanDays ?? 14);
    addToast({ message: 'Approved · Borrower notified', type: 'success' });
    await refreshLoans();
  };

  const handleDeny = async (id, reason) => {
    // TODO(api): Replace with PATCH /api/loans/:id/deny — deny pending loan
    await denyLoan(id, reason);
    addToast({ message: 'Denied · Borrower notified', type: 'success' });
    setDenyTarget(null);
    await refreshLoans();
  };

  const handleRemind = async (id) => {
    const loan = loans.find((l) => l.id === id);
    // TODO(api): Replace with POST /api/loans/:id/reminder — send overdue reminder
    await sendReminder(id);
    addToast({ message: `Reminder sent to ${loan?.borrower || 'borrower'}`, type: 'success' });
    await refreshLoans();
  };

  const handleReturn = async (id) => {
    // TODO(api): Replace with PATCH /api/loans/:id/return — mark loan as returned
    await returnLoan(id);
    addToast({ message: 'Marked returned', type: 'success' });
    await refreshLoans();
  };

  const handleExtend = async (id) => {
    // TODO(api): Replace with PATCH /api/loans/:id/renew — extend loan by 7 days
    const loan = await renewLoan(id);
    const dueMessage = loan?.dueDate ? ` New due ${formatShortDate(loan.dueDate)}.` : '';
    addToast({ message: `Extended by 7 days.${dueMessage}`, type: 'success' });
    await refreshLoans();
  };

  const handleRecall = async (id) => {
    const request = recallRequests.find((item) => item.id === id);
    await recallRequest(id);
    addToast({ message: `Recall sent to ${request?.currentBorrower || 'borrower'}`, type: 'success' });
    await refreshRecalls();
  };

  const handleDismissRecall = async (id) => {
    await dismissRecallRequest(id);
    addToast({ message: 'Dismissed', type: 'success' });
    await refreshRecalls();
  };

  const filteredLoans = getFilteredLoans();
  const isRecallsTab = tab === 'recalls';

  const handleLoanCreated = async () => {
    await refreshLoans();
    setTab('active');
  };

  return (
    <div className="animate-page-in">
      {/* Header area — skeleton vs real */}
      <ContentLoader
        loading={loading}
        skeleton={
          <div className="flex items-center justify-between gap-3">
            <div>
              <Skeleton className="h-7 w-32 rounded-lg" />
              <Skeleton className="mt-2 h-4 w-48 rounded" />
            </div>
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>
        }
      >
        <PageHeader title="Loan Management" subtitle="Approve requests, track overdue items, and manage loans.">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowNewLoan(true)}
          >
            + New Loan
          </Button>
        </PageHeader>
      </ContentLoader>

      <div className="mt-5">
        <SegmentedTabs
          fullWidth
          items={tabs}
          loading={loading}
          onChange={setTab}
          value={tab}
        />
      </div>

      {/* Main content grid — containers always visible */}
      <div className="mt-4 grid gap-4 lg:grid-cols-4">
        {/* Main content */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <ContentLoader
              loading={loading}
              skeleton={
                <div className="space-y-3">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-xl" />
                        <div>
                          <Skeleton className="h-4 w-40 rounded" />
                          <Skeleton className="mt-1.5 h-3 w-28 rounded" />
                        </div>
                      </div>
                      <Skeleton className="h-8 w-20 rounded-lg" />
                    </div>
                  ))}
                </div>
              }
            >
              {isRecallsTab ? (
                recalls.length > 0 ? (
                  <div className="divide-y divide-border/40">
                    {recalls.map((request) => (
                      <div key={request.id} className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50">
                            <Icon name="solar:hand-shake-linear" size={18} className="text-amber-600" />
                          </span>
                          <div>
                            <p className="font-medium text-text">{request.bookTitle}</p>
                            <p className="mt-1 text-sm text-text-secondary">
                              {request.requesterName} requested · current borrower {request.currentBorrower} · due {request.dueDate ? formatShortDate(request.dueDate) : 'No due date'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="primary" size="sm" onClick={() => handleRecall(request.id)}>
                            Recall
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => handleDismissRecall(request.id)}>
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-text-muted">No incoming recalls.</p>
                )
              ) : (
                filteredLoans.length > 0 ? (
                  <div className="divide-y divide-border/40">
                    {filteredLoans.map((loan) => (
                      <LoanCard
                        key={loan.id}
                        loan={loan}
                        role="clerk"
                        onApprove={handleApprove}
                        onDeny={(loan) => setDenyTarget(loan)}
                        onRemind={handleRemind}
                        onReturn={handleReturn}
                        onExtend={handleExtend}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-text-muted">No {tab} loans.</p>
                )
              )}
            </ContentLoader>
          </div>
        </div>

        {/* Sidebar — containers always visible */}
        <div className="space-y-4">
          <SummaryCard title="Summary" rows={summaryRows} loading={loading} />
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

      {showNewLoan && (
        <NewLoanModal
          onClose={() => setShowNewLoan(false)}
          onCreated={handleLoanCreated}
        />
      )}
    </div>
  );
}
