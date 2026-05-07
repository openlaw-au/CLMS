import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../atoms/Icon';
import Button from '../../atoms/Button';
import Skeleton from '../../atoms/Skeleton';
import ContentLoader from '../../atoms/ContentLoader';
import MetricGrid from '../../molecules/MetricGrid';
import BookCard from '../../molecules/BookCard';
import EmptyStateMessage from '../../molecules/EmptyStateMessage';
import SectionCard from '../../molecules/SectionCard';
import DashboardHero from '../../organisms/DashboardHero';
import AddBookFlow from '../../organisms/AddBookFlow';
import LoanActionModal from '../../organisms/LoanActionModal';
import { useAppContext } from '../../../context/AppContext';
import { useToast } from '../../../context/ToastContext';
import { getBooks } from '../../../services/booksService';
import { approveLoan, denyLoan, getLoans, sendReminder } from '../../../services/loansService';
import { getQueue, markAddedToCatalogue } from '../../../services/uncataloguedQueueService';

const BOOK_GRID = 'grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4';

function isEnriched(book) {
  return book.enrichment && Object.values(book.enrichment).some((value) => value && (Array.isArray(value) ? value.length > 0 : true));
}

function pseudoBookFromLoan(loan) {
  const borrowerLabel = loan.borrower
    ? `${loan.status === 'pending' ? 'Requested' : 'Borrowed'} by ${loan.borrower}`
    : '—';

  return {
    id: loan.bookId || loan.id,
    title: loan.bookTitle,
    author: borrowerLabel,
    publisher: '',
    edition: '',
    enrichment: null,
    practiceArea: '',
  };
}

function pseudoBookFromQueue(entry) {
  return {
    id: entry.id,
    title: entry.title,
    author: `Added by ${entry.addedBy || 'Barrister'}`,
    publisher: `ISBN ${entry.isbn || 'pending'}`,
    edition: '',
    enrichment: null,
    practiceArea: '',
  };
}

export default function ClerkDashboardPage() {
  const navigate = useNavigate();
  const { onboarding, chambersSettings } = useAppContext();
  const { addToast } = useToast();
  const firstName = onboarding.name?.trim().split(/\s+/)[0] || 'Clerk';

  const [loading, setLoading] = useState(true);
  const [loans, setLoans] = useState([]);
  const [books, setBooks] = useState([]);
  const [queue, setQueue] = useState([]);
  const [denyTarget, setDenyTarget] = useState(null);
  const [catalogueTarget, setCatalogueTarget] = useState(null);

  const refreshLoans = async () => {
    const nextLoans = await getLoans();
    setLoans(nextLoans);
    return nextLoans;
  };

  const refreshBooks = async () => {
    const nextBooks = await getBooks();
    setBooks(nextBooks);
    return nextBooks;
  };

  const refreshQueue = async () => {
    const nextQueue = await getQueue();
    setQueue(nextQueue);
    return nextQueue;
  };

  useEffect(() => {
    const min = new Promise((resolve) => setTimeout(resolve, 400));
    Promise.all([getLoans(), getBooks(), getQueue(), min]).then(([nextLoans, nextBooks, nextQueue]) => {
      setLoans(nextLoans);
      setBooks(nextBooks);
      setQueue(nextQueue);
      setLoading(false);
    });
  }, []);

  const booksById = useMemo(() => new Map(books.map((book) => [book.id, book])), [books]);
  const pendingLoans = useMemo(() => loans.filter((loan) => loan.status === 'pending'), [loans]);
  const overdueLoans = useMemo(() => loans.filter((loan) => loan.status === 'overdue'), [loans]);

  const enrichedCount = useMemo(() => books.filter(isEnriched).length, [books]);
  const enrichedPct = books.length > 0 ? Math.round((enrichedCount / books.length) * 100) : 0;

  const missingSubject = useMemo(() => books.filter((book) => !book.enrichment?.subject).length, [books]);
  const missingJurisdiction = useMemo(() => books.filter((book) => !book.enrichment?.jurisdiction?.length).length, [books]);
  const missingResourceType = useMemo(() => books.filter((book) => !book.enrichment?.resourceType).length, [books]);
  const pendingQueue = useMemo(() => queue.filter((entry) => entry.status === 'pending'), [queue]);

  const dashboardMetrics = [
    {
      label: 'Books in Library',
      value: books.length,
      detail: `${enrichedCount} enriched`,
      icon: 'solar:book-2-linear',
      to: '/app/library',
      iconBg: books.length > 0 ? 'info' : 'neutral',
    },
    {
      label: 'Pending Requests',
      value: pendingLoans.length,
      detail: pendingLoans.length > 0 ? 'Needs review today' : 'All clear',
      icon: 'solar:inbox-linear',
      to: '/app/library?tab=requests',
      iconBg: pendingLoans.length > 0 ? 'amber' : 'emerald',
    },
    {
      label: 'Overdue Books',
      value: overdueLoans.length,
      detail: overdueLoans.length > 0 ? 'Follow-up required' : 'No overdue items',
      icon: 'solar:danger-triangle-linear',
      to: '/app/library?tab=overdue',
      iconBg: overdueLoans.length > 0 ? 'red' : 'emerald',
    },
    {
      label: 'Library Coverage',
      value: `${enrichedPct}%`,
      detail: books.length - enrichedCount > 0 ? `${books.length - enrichedCount} books to enrich` : 'All books enriched',
      icon: 'solar:chart-2-linear',
      to: '/app/library',
      iconBg: enrichedPct >= 80 ? 'emerald' : enrichedPct >= 50 ? 'amber' : 'red',
    },
  ];

  const handleApprove = async (loanId) => {
    await approveLoan(loanId, chambersSettings?.defaultLoanDays ?? 14);
    addToast({ message: 'Approved · Borrower notified', type: 'success' });
    await Promise.all([refreshBooks(), refreshLoans()]);
  };

  const handleDeny = async (loanId, reason) => {
    await denyLoan(loanId, reason);
    addToast({ message: 'Denied · Borrower notified', type: 'success' });
    await refreshLoans();
  };

  const handleRemind = async (loanId) => {
    const loan = loans.find((item) => item.id === loanId);
    await sendReminder(loanId);
    addToast({ message: `Reminder sent to ${loan?.borrower || 'borrower'}`, type: 'success' });
    await refreshLoans();
  };

  const openAddBookForQueueEntry = (entry) => {
    setCatalogueTarget(entry);
  };

  const triageItems = [
    ...pendingLoans.map((loan) => {
      const book = booksById.get(loan.bookId) || pseudoBookFromLoan(loan);
      return {
        key: `pending-${loan.id}`,
        book,
        onLoan: false,
        overdue: false,
        pendingLoan: true,
        onApprove: () => handleApprove(loan.id),
        onDeny: () => setDenyTarget(loan),
      };
    }),
    ...overdueLoans.map((loan) => {
      const book = booksById.get(loan.bookId) || pseudoBookFromLoan(loan);
      return {
        key: `overdue-${loan.id}`,
        book: { ...book, dueDate: loan.dueDate },
        onLoan: true,
        overdue: true,
        pendingLoan: false,
        onRemind: () => handleRemind(loan.id),
      };
    }),
    ...pendingQueue.map((entry) => ({
      key: `queue-${entry.id}`,
      book: pseudoBookFromQueue(entry),
      onLoan: false,
      overdue: false,
      pendingLoan: false,
      onCatalogue: () => openAddBookForQueueEntry(entry),
    })),
  ];

  return (
    <div className="animate-page-in">
      <DashboardHero
        greeting={`Hi, ${firstName}.`}
        loading={loading}
        subtitle="Manage library health, requests, and chambers operations in one place."
      />

      <div className="relative z-[1] -mt-[56px] md:-mt-[60px]">
        <MetricGrid metrics={dashboardMetrics} loading={loading} />
      </div>

      <SectionCard className="mt-12">
        <ContentLoader
          loading={loading}
          skeleton={
            <>
              <Skeleton className="h-5 w-32 rounded-lg" />
              <div className={`mt-4 ${BOOK_GRID}`}>
                {[0, 1, 2, 3].map((index) => (
                  <div key={index} className="min-h-[220px] overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                    <div className="p-4">
                      <Skeleton className="h-4 w-full rounded" />
                      <Skeleton className="mt-2 h-3 w-3/4 rounded" />
                      <Skeleton className="mt-3 h-4 w-24 rounded-md" />
                      <Skeleton className="mt-16 h-8 w-full rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </>
          }
        >
          <div className="flex min-h-[36px] items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Icon name="solar:inbox-linear" size={22} className="text-brand" />
              <h2 className="font-serif text-section-title text-text">
                Triage Queue{triageItems.length > 0 ? ` (${triageItems.length})` : ''}
              </h2>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => navigate('/app/library?tab=requests')}
              className="shrink-0 whitespace-nowrap px-3 py-1.5 text-xs"
            >
              View all
            </Button>
          </div>

          {triageItems.length > 0 ? (
            <div className={`mt-4 ${BOOK_GRID}`}>
              {triageItems.map((item) => (
                <BookCard
                  key={item.key}
                  book={item.book}
                  onLoan={item.onLoan}
                  overdue={item.overdue}
                  pendingLoan={item.pendingLoan}
                  onApprove={item.onApprove}
                  onDeny={item.onDeny}
                  onRemind={item.onRemind}
                  onCatalogue={item.onCatalogue}
                />
              ))}
            </div>
          ) : (
            <EmptyStateMessage>No items waiting. Library is healthy.</EmptyStateMessage>
          )}
        </ContentLoader>
      </SectionCard>

      <SectionCard className="mt-4">
        <ContentLoader
          loading={loading}
          skeleton={
            <>
              <div className="flex min-h-[36px] items-center justify-between">
                <Skeleton className="h-5 w-36 rounded-lg" />
                <Skeleton className="h-9 w-24 rounded-full" />
              </div>
              <div className="mt-4 rounded-xl border border-border/70 bg-slate-50/40 p-4">
                <Skeleton className="h-4 w-40 rounded" />
                <Skeleton className="mt-3 h-2 w-full rounded-full" />
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {[0, 1, 2].map((index) => (
                  <Skeleton key={index} className="h-24 w-full rounded-2xl" />
                ))}
              </div>
            </>
          }
        >
          <div className="flex min-h-[36px] items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Icon name="solar:chart-2-linear" size={22} className="text-brand" />
              <div>
                <h2 className="font-serif text-section-title text-text">Library Health</h2>
                <p className="mt-1 text-xs text-text-secondary">Better metadata improves search and authority lists.</p>
              </div>
            </div>
            <Button size="sm" variant="secondary" onClick={() => navigate('/app/library')}>
              Enrich Now
            </Button>
          </div>

          <div className="mt-4 rounded-xl border border-border/70 bg-slate-50/40 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-text">{enrichedCount} of {books.length} books enriched</p>
                <p className="mt-0.5 text-xs text-text-secondary">{enrichedPct}% coverage</p>
              </div>
              <span className="text-2xl font-semibold text-text">{enrichedPct}%</span>
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-slate-200">
              <div className="h-2 rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${enrichedPct}%` }} />
            </div>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Missing subject', count: missingSubject, icon: 'solar:tag-linear' },
              { label: 'Missing jurisdiction', count: missingJurisdiction, icon: 'solar:flag-linear' },
              { label: 'Missing resource type', count: missingResourceType, icon: 'solar:document-text-linear' },
            ].map((gap) => (
              <button
                key={gap.label}
                type="button"
                onClick={() => navigate('/app/library')}
                className="rounded-2xl border border-border/70 bg-white p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/20"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${gap.count > 0 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    <Icon name={gap.icon} size={18} />
                  </span>
                  <p className="text-2xl font-bold leading-none tracking-tight text-text">
                    {gap.count}
                  </p>
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
                  {gap.label}
                </p>
              </button>
            ))}
          </div>
        </ContentLoader>
      </SectionCard>

      {denyTarget && (
        <LoanActionModal
          loan={denyTarget}
          onDeny={handleDeny}
          onClose={() => setDenyTarget(null)}
        />
      )}

      {catalogueTarget && (
        <AddBookFlow
          prefill={{
            title: catalogueTarget.title || '',
            author: catalogueTarget.author || '',
            edition: catalogueTarget.edition || '',
            publisher: catalogueTarget.publisher || '',
            isbn: catalogueTarget.isbn || '',
          }}
          onClose={() => setCatalogueTarget(null)}
          onAdded={async (book) => {
            await markAddedToCatalogue(catalogueTarget.id, book.id);
            addToast({ message: `${catalogueTarget.title} moved from queue to library`, type: 'success' });
            await Promise.all([refreshBooks(), refreshQueue()]);
          }}
        />
      )}
    </div>
  );
}
