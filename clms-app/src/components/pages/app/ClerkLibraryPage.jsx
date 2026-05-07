import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Icon from '../../atoms/Icon';
import Button from '../../atoms/Button';
import Select from '../../atoms/Select';
import Skeleton from '../../atoms/Skeleton';
import ContentLoader from '../../atoms/ContentLoader';
import BookCard from '../../molecules/BookCard';
import CategoryDropdown from '../../molecules/CategoryDropdown';
import EmptyStateMessage from '../../molecules/EmptyStateMessage';
import PageHeader from '../../molecules/PageHeader';
import SegmentedTabs from '../../molecules/SegmentedTabs';
import AddBookFlow from '../../organisms/AddBookFlow';
import LoanActionModal from '../../organisms/LoanActionModal';
import NewLoanModal from '../../organisms/NewLoanModal';
import { useAppContext } from '../../../context/AppContext';
import { useToast } from '../../../context/ToastContext';
import { getBooks } from '../../../services/booksService';
import { approveLoan, denyLoan, getLoans, renewLoan, returnLoan, sendReminder } from '../../../services/loansService';
import { dismissRecallRequest, getRecallRequests, recallRequest } from '../../../services/recallRequestsService';
import { getQueueItem, markAddedToCatalogue } from '../../../services/uncataloguedQueueService';
import { formatShortDate } from '../../../utils/dateFormatters';

const BOOK_GRID = 'grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4';
const TAB_KEYS = new Set(['all', 'on-loan', 'overdue', 'requests', 'history']);

function getInitialTab(searchParams) {
  const nextTab = searchParams.get('tab');
  return TAB_KEYS.has(nextTab) ? nextTab : 'all';
}

function getBookCategory(book) {
  return book.enrichment?.subject || book.practiceArea || 'Other';
}

function isOverdue(book) {
  return book.status === 'on-loan' && book.dueDate && new Date(`${book.dueDate}T00:00:00`) < new Date();
}

function compareBooks(a, b, sort) {
  switch (sort) {
    case 'author':
      return a.author.localeCompare(b.author);
    case 'area':
      return getBookCategory(a).localeCompare(getBookCategory(b));
    case 'publisher':
      return a.publisher.localeCompare(b.publisher);
    default:
      return a.title.localeCompare(b.title);
  }
}

function buildFallbackBook(id, title) {
  return {
    id,
    title,
    author: '',
    edition: '',
    publisher: '',
    status: 'available',
    borrower: null,
    dueDate: null,
    practiceArea: '',
    enrichment: null,
  };
}

function matchesRowQuery(values, lowerQuery) {
  return values.some((value) => String(value || '').toLowerCase().includes(lowerQuery));
}

function sortRows(rows, sort, tab) {
  const effectiveSort = sort === 'default'
    ? (tab === 'requests' || tab === 'history' ? 'activity' : 'title')
    : sort;

  if (effectiveSort === 'activity') {
    return [...rows].sort((a, b) => {
      const left = new Date(a.sortDate || 0).getTime();
      const right = new Date(b.sortDate || 0).getTime();

      if (left === right) return compareBooks(a.book, b.book, 'title');
      return tab === 'requests' ? left - right : right - left;
    });
  }

  return [...rows].sort((a, b) => compareBooks(a.book, b.book, effectiveSort));
}

function filterAndSortBookRows(rows, selectedAreas, query, sort, tab) {
  let nextRows = rows;

  if (selectedAreas.size > 0) {
    nextRows = nextRows.filter((row) => selectedAreas.has(getBookCategory(row.book)));
  }

  if (query.trim()) {
    const lowerQuery = query.trim().toLowerCase();
    nextRows = nextRows.filter((row) => matchesRowQuery([
      row.book.title,
      row.book.author,
      row.book.publisher,
      getBookCategory(row.book),
    ], lowerQuery));
  }

  return sortRows(nextRows, sort, tab);
}

function filterAndSortActivityRows(rows, selectedAreas, query, sort, tab) {
  let nextRows = rows;

  if (selectedAreas.size > 0) {
    nextRows = nextRows.filter((row) => selectedAreas.has(getBookCategory(row.book)));
  }

  if (query.trim()) {
    const lowerQuery = query.trim().toLowerCase();
    nextRows = nextRows.filter((row) => matchesRowQuery([
      row.book.title,
      row.book.author,
      row.loan?.borrower,
      row.request?.currentBorrower,
      getBookCategory(row.book),
    ], lowerQuery));
  }

  return sortRows(nextRows, sort, tab);
}

function escapeCsvValue(value) {
  const normalized = value == null ? '' : String(value);
  if (!/[",\n]/.test(normalized)) return normalized;
  return `"${normalized.replace(/"/g, '""')}"`;
}

function getHistoryLoanDate(loan) {
  return loan.returnedAt || loan.returnedDate || loan.deniedAt || loan.deniedDate || loan.dateBorrowed;
}

function buildClerkCardActions(book, loans, recallRequests, isOverdueFn, handlers) {
  const matchingRecall = recallRequests.find(
    (request) => request.bookId === book.id && request.status === 'pending',
  );
  if (matchingRecall) {
    return {
      onRecall: () => handlers.onRecall(matchingRecall.id),
      onDismissRecall: () => handlers.onDismissRecall(matchingRecall.id),
    };
  }

  const matchingPendingLoan = loans.find(
    (loan) => loan.bookId === book.id && loan.status === 'pending',
  );
  if (matchingPendingLoan) {
    return {
      onApprove: () => handlers.onApprove(matchingPendingLoan.id),
      onDeny: () => handlers.onDeny(matchingPendingLoan),
    };
  }

  if (book.status === 'available') {
    return {
      onLoanOut: () => handlers.onLoanOut(book),
    };
  }

  if (book.status !== 'on-loan') return {};

  const activeLoan = loans.find(
    (loan) => loan.bookId === book.id && (loan.status === 'active' || loan.status === 'overdue'),
  );
  if (!activeLoan) return {};

  if (isOverdueFn(book)) {
    return {
      onMarkReturned: () => handlers.onMarkReturned(activeLoan.id),
      onRemind: () => handlers.onRemind(activeLoan.id),
      onExtend: () => handlers.onExtend(activeLoan.id),
    };
  }

  return {
    onRecall: () => handlers.onRecallLoan(activeLoan.id),
    onMarkReturned: () => handlers.onMarkReturned(activeLoan.id),
  };
}

export default function ClerkLibraryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { chambersSettings } = useAppContext();
  const { addToast } = useToast();
  const [books, setBooks] = useState([]);
  const [loans, setLoans] = useState([]);
  const [recallRequests, setRecallRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(searchParams.get('q')?.trim() || '');
  const [sort, setSort] = useState('default');
  const [selectedAreas, setSelectedAreas] = useState(new Set());
  const [tab, setTab] = useState(() => getInitialTab(searchParams));
  const [denyTarget, setDenyTarget] = useState(null);
  const [showNewLoan, setShowNewLoan] = useState(false);
  const [newLoanBook, setNewLoanBook] = useState(null);
  const [showAddBook, setShowAddBook] = useState(false);
  const [queueEntry, setQueueEntry] = useState(null);

  const queueIdParam = searchParams.get('queueId');
  const queueAction = searchParams.get('action');

  const refreshBooks = useCallback(async () => {
    const nextBooks = await getBooks();
    setBooks(nextBooks);
    return nextBooks;
  }, []);

  const refreshLoans = async () => {
    const nextLoans = await getLoans();
    setLoans(nextLoans);
    return nextLoans;
  };

  const refreshRecalls = async () => {
    const nextRecalls = await getRecallRequests();
    setRecallRequests(nextRecalls);
    return nextRecalls;
  };

  useEffect(() => {
    const min = new Promise((resolve) => setTimeout(resolve, 400));
    Promise.all([getBooks(), getLoans(), getRecallRequests(), min]).then(([nextBooks, nextLoans, nextRecalls]) => {
      setBooks(nextBooks);
      setLoans(nextLoans);
      setRecallRequests(nextRecalls);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const handler = () => {
      refreshBooks();
    };

    window.addEventListener('books-changed', handler);
    return () => window.removeEventListener('books-changed', handler);
  }, [refreshBooks]);

  useEffect(() => {
    setQuery(searchParams.get('q')?.trim() || '');
  }, [searchParams]);

  useEffect(() => {
    setTab(getInitialTab(searchParams));
  }, [searchParams]);

  useEffect(() => {
    const syncQueueEntry = async () => {
      if (!queueIdParam) {
        setQueueEntry(null);
        return;
      }

      const entry = await getQueueItem(queueIdParam);
      setQueueEntry(entry);
    };

    syncQueueEntry();
  }, [queueIdParam]);

  useEffect(() => {
    if (queueAction !== 'add' || queueIdParam) return;

    setShowAddBook(true);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('action');
      return next;
    }, { replace: true });
  }, [queueAction, queueIdParam, setSearchParams]);

  const booksById = useMemo(() => new Map(books.map((book) => [book.id, book])), [books]);
  const availableBooks = useMemo(() => books.filter((book) => book.status === 'available'), [books]);
  const pendingLoans = useMemo(() => loans.filter((loan) => loan.status === 'pending'), [loans]);
  const pendingRecallRequests = useMemo(() => recallRequests.filter((request) => request.status === 'pending'), [recallRequests]);
  const overdueLoans = useMemo(() => loans.filter((loan) => loan.status === 'overdue'), [loans]);
  const returnedLoans = useMemo(() => loans.filter((loan) => loan.status === 'returned'), [loans]);
  const deniedLoans = useMemo(() => loans.filter((loan) => loan.status === 'denied'), [loans]);
  const activeLoansByBookId = useMemo(
    () => new Map(loans.filter((loan) => loan.status === 'active' || loan.status === 'overdue').map((loan) => [loan.bookId, loan])),
    [loans],
  );
  const overdueBookIds = useMemo(() => new Set(overdueLoans.map((loan) => loan.bookId)), [overdueLoans]);
  const isBookExtended = (book) => book.extended === true || activeLoansByBookId.get(book.id)?.extended === true;

  const onLoanBooks = useMemo(
    () => books.filter((book) => book.status === 'on-loan' && !isOverdue(book) && !overdueBookIds.has(book.id)),
    [books, overdueBookIds],
  );
  const overdueBooks = useMemo(
    () => books.filter((book) => overdueBookIds.has(book.id) || isOverdue(book)),
    [books, overdueBookIds],
  );

  const areaTabs = useMemo(() => {
    const counts = {};
    books.forEach((book) => {
      const area = getBookCategory(book);
      counts[area] = (counts[area] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [books]);

  const requestsRows = useMemo(() => (
    [
      ...pendingLoans.map((loan) => ({
        id: `loan-${loan.id}`,
        type: 'loan-request',
        book: booksById.get(loan.bookId) || buildFallbackBook(loan.bookId, loan.bookTitle),
        loan,
        request: null,
        sortDate: loan.dateBorrowed,
      })),
      ...pendingRecallRequests.map((request) => ({
        id: `recall-${request.id}`,
        type: 'recall-request',
        book: booksById.get(request.bookId) || buildFallbackBook(request.bookId, request.bookTitle),
        loan: null,
        request,
        sortDate: request.requestedAt,
      })),
    ]
  ), [booksById, pendingLoans, pendingRecallRequests]);

  const historyRows = useMemo(() => (
    [...returnedLoans, ...deniedLoans]
      .map((loan) => ({
        id: `history-${loan.id}`,
        type: loan.status,
        book: booksById.get(loan.bookId) || buildFallbackBook(loan.bookId, loan.bookTitle),
        loan,
        request: null,
        sortDate: getHistoryLoanDate(loan),
      }))
  ), [booksById, deniedLoans, returnedLoans]);

  const allRows = useMemo(
    () => filterAndSortBookRows(
      books.map((book) => ({ id: book.id, type: 'book', book, loan: activeLoansByBookId.get(book.id) || null, request: null })),
      selectedAreas,
      query,
      sort,
      'all',
    ),
    [activeLoansByBookId, books, query, selectedAreas, sort],
  );
  const onLoanRows = useMemo(
    () => filterAndSortBookRows(
      onLoanBooks.map((book) => ({ id: book.id, type: 'book', book, loan: activeLoansByBookId.get(book.id) || null, request: null })),
      selectedAreas,
      query,
      sort,
      'on-loan',
    ),
    [activeLoansByBookId, onLoanBooks, query, selectedAreas, sort],
  );
  const overdueRows = useMemo(
    () => filterAndSortBookRows(
      overdueBooks.map((book) => ({ id: book.id, type: 'book', book, loan: activeLoansByBookId.get(book.id) || null, request: null })),
      selectedAreas,
      query,
      sort,
      'overdue',
    ),
    [activeLoansByBookId, overdueBooks, query, selectedAreas, sort],
  );
  const requestsFilteredRows = useMemo(
    () => filterAndSortActivityRows(requestsRows, selectedAreas, query, sort, 'requests'),
    [query, requestsRows, selectedAreas, sort],
  );
  const historyFilteredRows = useMemo(
    () => filterAndSortActivityRows(historyRows, selectedAreas, query, sort, 'history'),
    [historyRows, query, selectedAreas, sort],
  );

  const rowsByTab = {
    all: allRows,
    'on-loan': onLoanRows,
    overdue: overdueRows,
    requests: requestsFilteredRows,
    history: historyFilteredRows,
  };

  const pendingRequestCount = pendingLoans.length + pendingRecallRequests.length;
  const tabs = [
    { key: 'all', label: 'All', count: books.length, icon: 'solar:book-2-linear' },
    { key: 'on-loan', label: 'On Loan', count: onLoanBooks.length, icon: 'solar:clock-circle-linear' },
    { key: 'overdue', label: 'Overdue', count: overdueBooks.length, icon: 'solar:danger-triangle-linear', badge: overdueBooks.length > 0, badgeTone: 'red' },
    { key: 'requests', label: 'Requests', count: pendingRequestCount, icon: 'solar:inbox-linear', badge: pendingRequestCount > 0, badgeTone: 'red' },
    { key: 'history', label: 'History', count: historyRows.length, icon: 'solar:history-linear' },
  ];

  const visibleRows = rowsByTab[tab] || allRows;
  const showResolvedAddFlow = showAddBook || (queueAction === 'add' && !!queueIdParam && !!queueEntry);
  const searchPlaceholder = tab === 'requests' || tab === 'history'
    ? 'Search titles, authors, borrowers...'
    : 'Search titles, authors...';

  const updateSearchParams = (mutator) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      mutator(next);
      return next;
    }, { replace: true });
  };

  const toggleArea = (area) => {
    setSelectedAreas((prev) => {
      const next = new Set(prev);
      if (next.has(area)) next.delete(area);
      else next.add(area);
      return next;
    });
  };

  const handleTabChange = (nextTab) => {
    setTab(nextTab);
    updateSearchParams((next) => {
      if (nextTab === 'all') next.delete('tab');
      else next.set('tab', nextTab);
    });
  };

  const handleQueryChange = (nextQuery) => {
    setQuery(nextQuery);
    updateSearchParams((next) => {
      const trimmedQuery = nextQuery.trim();
      if (trimmedQuery) next.set('q', trimmedQuery);
      else next.delete('q');
    });
  };

  const clearQueueContext = () => {
    updateSearchParams((next) => {
      next.delete('queueId');
      next.delete('action');
    });
  };

  const handleApprove = async (loanId) => {
    // TODO(api): Replace with PATCH /api/loans/:id/approve — approve pending loan
    await approveLoan(loanId, chambersSettings?.defaultLoanDays ?? 14);
    addToast({ message: 'Approved · Borrower notified', type: 'success' });
    await Promise.all([refreshBooks(), refreshLoans()]);
  };

  const handleReapprove = async (loanId) => {
    await approveLoan(loanId, chambersSettings?.defaultLoanDays ?? 14);
    addToast({ message: 'Re-approved · Loan reactivated', type: 'success' });
    await Promise.all([refreshBooks(), refreshLoans()]);
  };

  const handleDeny = async (loanId, reason) => {
    // TODO(api): Replace with PATCH /api/loans/:id/deny — deny pending loan
    await denyLoan(loanId, reason);
    addToast({ message: 'Denied · Borrower notified', type: 'success' });
    await refreshLoans();
  };

  const handleRecall = async (requestId) => {
    const request = recallRequests.find((item) => item.id === requestId);
    // TODO(api): Replace with PATCH /api/recall-requests/:id/recall — notify current borrower
    await recallRequest(requestId);
    addToast({ message: `Recall sent to ${request?.currentBorrower || 'borrower'}`, type: 'success' });
    await refreshRecalls();
  };

  const handleLoanRecall = async (loanId) => {
    const loan = loans.find((item) => item.id === loanId);
    await sendReminder(loanId);
    addToast({ message: `Recall sent to ${loan?.borrower || 'borrower'}`, type: 'success' });
    await refreshLoans();
  };

  const handleDismissRecall = async (requestId) => {
    // TODO(api): Replace with PATCH /api/recall-requests/:id/dismiss — resolve recall request
    await dismissRecallRequest(requestId);
    addToast({ message: 'Dismissed', type: 'success' });
    await refreshRecalls();
  };

  const handleMarkReturned = async (loanId) => {
    await returnLoan(loanId);
    addToast({ message: 'Marked returned', type: 'success' });
    await Promise.all([refreshBooks(), refreshLoans()]);
  };

  const handleExtend = async (loanId) => {
    const loan = await renewLoan(loanId);
    addToast({
      message: loan?.dueDate ? `Extended by 7 days. New due ${formatShortDate(loan.dueDate)}.` : 'Extended by 7 days.',
      type: 'success',
    });
    await Promise.all([refreshBooks(), refreshLoans()]);
  };

  const handleRemind = async (loanId) => {
    const loan = loans.find((item) => item.id === loanId);
    await sendReminder(loanId);
    addToast({ message: `Reminder sent to ${loan?.borrower || 'borrower'}`, type: 'success' });
    await refreshLoans();
  };

  const handleLoanOut = (book) => {
    setNewLoanBook(book);
    setShowNewLoan(true);
  };

  const handleOpenNewLoan = () => {
    setNewLoanBook(null);
    setShowNewLoan(true);
  };

  const handleLoanCreated = async () => {
    await Promise.all([refreshBooks(), refreshLoans()]);
    handleTabChange('on-loan');
  };

  const handleNewLoanClose = () => {
    setShowNewLoan(false);
    setNewLoanBook(null);
  };

  const clerkCardHandlers = {
    onApprove: handleApprove,
    onDeny: (loan) => setDenyTarget(loan),
    onRecall: handleRecall,
    onDismissRecall: handleDismissRecall,
    onMarkReturned: handleMarkReturned,
    onRemind: handleRemind,
    onExtend: handleExtend,
    onRecallLoan: handleLoanRecall,
    onLoanOut: handleLoanOut,
  };

  const handleExport = () => {
    if (visibleRows.length === 0) {
      addToast({ message: 'Nothing to export in this tab.', type: 'info' });
      return;
    }

    // TODO(api): replace with GET /api/library/export
    const header = ['Title', 'Author', 'Publisher', 'Edition', 'Status', 'Borrower', 'Due Date'];
    const lines = [
      header.join(','),
      ...visibleRows.map((row) => {
        const status = row.type === 'loan-request'
          ? row.loan?.status || 'pending'
          : row.type === 'recall-request'
            ? 'recall-request'
            : row.loan?.status || (isOverdue(row.book) ? 'overdue' : row.book.status);
        const borrower = row.loan?.borrower || row.request?.currentBorrower || row.book.borrower || '';
        const dueDate = row.loan?.dueDate || row.request?.dueDate || row.book.dueDate || '';

        return [
          row.book.title,
          row.book.author,
          row.book.publisher,
          row.book.edition,
          status,
          borrower,
          dueDate,
        ].map(escapeCsvValue).join(',');
      }),
    ];

    const blob = new Blob([`${lines.join('\n')}\n`], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `library-${tab}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const getEmptyMessage = () => {
    if (tab === 'requests') return "No incoming requests. You're all caught up.";
    if (query.trim()) return `No books matching "${query}"`;
    if (tab === 'on-loan') return 'No books currently on loan.';
    if (tab === 'overdue') return 'No overdue books.';
    if (tab === 'history') return 'No past loans.';
    return availableBooks.length === 0 && books.length === 0 ? 'No books found.' : 'No books in this view.';
  };

  return (
    <div className="animate-page-in">
      <ContentLoader
        loading={loading}
        skeleton={
          <div className="flex items-center justify-between gap-3">
            <div>
              <Skeleton className="h-7 w-32 rounded-lg" />
              <Skeleton className="mt-2 h-4 w-72 rounded" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24 rounded-xl" />
              <Skeleton className="h-9 w-24 rounded-xl" />
              <Skeleton className="h-9 w-24 rounded-xl" />
            </div>
          </div>
        }
      >
        <PageHeader title="Library" subtitle="Manage the library and incoming loan activity in one place.">
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleExport}>
              <Icon name="solar:download-linear" size={14} />
              Export
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowAddBook(true)}>
              <Icon name="solar:add-circle-linear" size={14} />
              Add Book
            </Button>
            <Button variant="primary" size="sm" onClick={handleOpenNewLoan}>
              <Icon name="solar:add-circle-linear" size={14} />
              New Loan
            </Button>
          </div>
        </PageHeader>
      </ContentLoader>

      <section className="mt-6">
        <ContentLoader
          loading={loading}
          className="pb-6"
          skeleton={
            <div className="flex flex-col gap-3 toolbar-wide">
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-48 rounded-xl" />
                <Skeleton className="h-9 w-36 rounded-xl" />
                <Skeleton className="h-9 w-40 rounded-xl" />
              </div>
              <div className="flex items-center gap-1.5">
                <Skeleton className="h-9 w-16 rounded-full" />
                <Skeleton className="h-9 w-28 rounded-full" />
                <Skeleton className="h-9 w-24 rounded-full" />
                <Skeleton className="h-9 w-28 rounded-full" />
                <Skeleton className="h-9 w-28 rounded-full" />
              </div>
            </div>
          }
        >
          <div className="flex w-full flex-col gap-3 toolbar-wide">
            <div className="flex items-center gap-2">
              <div className="relative flex w-full max-w-[220px] items-center">
                <span className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 items-center text-text-muted">
                  <Icon name="solar:magnifer-linear" size={15} />
                </span>
                <input
                  type="text"
                  value={query}
                  onChange={(event) => handleQueryChange(event.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full rounded-xl border border-border bg-white py-2 pl-9 pr-3 text-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/20"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => handleQueryChange('')}
                    className="absolute right-2.5 rounded-full p-0.5 text-text-muted transition-colors hover:text-text"
                  >
                    <Icon name="solar:close-circle-linear" size={14} />
                  </button>
                )}
              </div>
              <CategoryDropdown
                options={areaTabs.map(([label, count]) => ({ label, count }))}
                selected={selectedAreas}
                onToggle={toggleArea}
                onClear={() => setSelectedAreas(new Set())}
              />
              <Select
                size="md"
                icon="solar:sort-linear"
                value={sort === 'default' ? 'title' : sort}
                onChange={(event) => setSort(event.target.value)}
              >
                <option value="title">Sort by: Title</option>
                <option value="author">Sort by: Author</option>
                <option value="area">Sort by: Practice Area</option>
                <option value="publisher">Sort by: Publisher</option>
              </Select>
            </div>

            <div className="mt-5">
              <SegmentedTabs
                items={tabs}
                onChange={handleTabChange}
                value={tab}
              />
            </div>
          </div>
        </ContentLoader>

        <ContentLoader
          loading={loading}
          skeleton={
            <div className={BOOK_GRID}>
              {[0, 1, 2, 3, 4].map((index) => (
                <div key={index} className="min-h-[300px] overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                  <div className="p-4">
                    <div className="flex gap-3">
                      <Skeleton className="h-16 w-12 shrink-0 rounded-lg" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-full rounded" />
                        <Skeleton className="mt-1 h-4 w-3/4 rounded" />
                        <Skeleton className="mt-2 h-3 w-20 rounded" />
                      </div>
                    </div>
                    <Skeleton className="mt-3 h-4 w-24 rounded-md" />
                    <Skeleton className="mt-auto h-3 w-20 rounded" style={{ marginTop: '4rem' }} />
                    <Skeleton className="mt-1.5 h-3 w-24 rounded" />
                    <Skeleton className="mt-3 h-8 w-full rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          }
        >
          {tab === 'history' ? (
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
              {visibleRows.length > 0 ? (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border/60 bg-surface-subtle/40 text-xs text-text-secondary">
                      <th className="px-5 py-3 font-medium">Book</th>
                      <th className="px-5 py-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((row) => (
                      <tr key={row.id} className="border-b border-border/30 last:border-0">
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-text">{row.loan.bookTitle || row.book.title}</p>
                          <p className="mt-0.5 text-xs">
                            <span className="text-text-secondary">{row.loan.borrower}</span>
                            <span className="mx-1.5 text-text-muted">·</span>
                            <span className={row.type === 'returned' ? 'font-medium text-success' : 'font-medium text-danger'}>
                              {row.type === 'returned' ? 'Returned' : 'Denied'}
                            </span>
                          </p>
                        </td>
                        <td className="px-5 py-3.5 text-text-secondary">
                          {row.type === 'denied' ? (
                            <div className="flex items-center justify-between gap-3">
                              <span>{formatShortDate(getHistoryLoanDate(row.loan))}</span>
                              <Button
                                size="sm"
                                variant="approve"
                                onClick={() => handleReapprove(row.loan.id)}
                                className="text-xs"
                              >
                                Approve
                              </Button>
                            </div>
                          ) : (
                            formatShortDate(getHistoryLoanDate(row.loan))
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <EmptyStateMessage>No past loans.</EmptyStateMessage>
              )}
            </div>
          ) : visibleRows.length > 0 ? (
              <div className={BOOK_GRID}>
                {visibleRows.map((row) => (
                  <BookCard
                    key={row.id}
                    book={row.book}
                    onLoan={row.book.status === 'on-loan'}
                    overdue={row.loan?.status === 'overdue' || isOverdue(row.book)}
                    extended={isBookExtended(row.book)}
                    {...(tab === 'requests'
                      ? {
                          pendingLoan: row.type === 'loan-request',
                          requesterName: row.type === 'loan-request' ? row.loan?.borrower : row.request?.requesterName,
                          onApprove: row.type === 'loan-request' ? () => handleApprove(row.loan.id) : undefined,
                          onDeny: row.type === 'loan-request' ? () => setDenyTarget(row.loan) : undefined,
                          onRecall: row.type === 'recall-request' ? () => handleRecall(row.request.id) : undefined,
                          onDismissRecall: row.type === 'recall-request' ? () => handleDismissRecall(row.request.id) : undefined,
                        }
                      : buildClerkCardActions(row.book, loans, recallRequests, isOverdue, clerkCardHandlers))}
                  />
                ))}
              </div>
          ) : (
            <EmptyStateMessage>{getEmptyMessage()}</EmptyStateMessage>
          )}
        </ContentLoader>
      </section>

      {denyTarget && (
        <LoanActionModal
          loan={denyTarget}
          onDeny={handleDeny}
          onClose={() => setDenyTarget(null)}
        />
      )}

      {showNewLoan && (
        <NewLoanModal
          onClose={handleNewLoanClose}
          onCreated={handleLoanCreated}
          prefillBook={newLoanBook}
        />
      )}

      {showResolvedAddFlow && (
        <AddBookFlow
          prefill={queueEntry ? { title: queueEntry.title, author: queueEntry.author } : null}
          onClose={() => {
            setShowAddBook(false);
            if (queueAction === 'add') clearQueueContext();
          }}
          onAdded={async (book) => {
            if (queueEntry && queueAction === 'add') {
              await markAddedToCatalogue(queueEntry.id, book.id);
              addToast({ message: `${queueEntry.title} moved from queue to library`, type: 'success' });
              clearQueueContext();
            }
            window.dispatchEvent(new CustomEvent('books-changed'));
          }}
        />
      )}
    </div>
  );
}
