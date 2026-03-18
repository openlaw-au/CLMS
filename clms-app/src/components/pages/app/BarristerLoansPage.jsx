import { useEffect, useMemo, useState } from 'react';
import Icon from '../../atoms/Icon';
import PageHeader from '../../molecules/PageHeader';
import Select from '../../atoms/Select';
import { useAppContext } from '../../../context/AppContext';
import { useToast } from '../../../context/ToastContext';
import { getLoans, requestLoan, requestReturn } from '../../../services/loansService';
import { getBooks } from '../../../services/booksService';

function formatBorrowedDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}


const publisherColors = {
  'LexisNexis Butterworths': 'from-red-800 to-red-950',
  'Thomson Reuters': 'from-indigo-900 to-slate-950',
  'Lawbook Co': 'from-emerald-800 to-emerald-950',
  'Federation Press': 'from-amber-800 to-stone-900',
};

function BookCard({ book, alreadyBorrowed, pendingLoan, onLoan, returnRequested, onRequest, onCancel, onRequestReturn, onCancelReturn, requesting }) {
  const dimmed = onLoan;
  const gradient = publisherColors[book.publisher] || 'from-slate-700 to-slate-900';

  return (
    <div className={`overflow-hidden rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition-all duration-300 ${dimmed ? 'opacity-70 grayscale-[40%]' : ''}`}>
        <div>
          <div className="flex items-center gap-2">
            <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${gradient.includes('red') ? 'bg-red-100 text-red-800' : gradient.includes('indigo') ? 'bg-indigo-100 text-indigo-800' : gradient.includes('emerald') ? 'bg-emerald-100 text-emerald-800' : gradient.includes('amber') ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>
              {book.publisher}
            </span>
            {book.edition && (
              <span className="rounded-md bg-surface-subtle px-2 py-0.5 text-xs font-medium text-text-secondary">
                {book.edition} edition
              </span>
            )}
            {onLoan && book.dueDate && (
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-text-secondary">
                <Icon name="solar:calendar-linear" size={12} />
                Due {formatBorrowedDate(book.dueDate)}
              </span>
            )}
          </div>
          <div className="mt-2 flex items-start gap-2">
            <Icon name="solar:book-bookmark-linear" size={16} className="mt-0.5 shrink-0 text-brand" />
            <p className="line-clamp-2 text-sm font-medium leading-snug text-text">{book.title}</p>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-text-secondary">
            <Icon name="solar:user-linear" size={14} className="shrink-0 text-text-muted" />
            <span className="truncate">{book.author}</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-text-muted">
            <Icon name="solar:map-point-linear" size={14} className="shrink-0" />
            <span className="truncate">{book.location}</span>
            <span className="text-border">·</span>
            <Icon name="solar:tag-linear" size={13} className="shrink-0" />
            <span className="shrink-0">{book.practiceArea}</span>
          </div>
        </div>
        <div className="mt-3">
          {onLoan ? (
            returnRequested ? (
              <div className="flex animate-fade-in items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
                  <Icon name="solar:clock-circle-linear" size={13} />
                  Return Requested
                </span>
                {onCancelReturn && (
                  <button
                    type="button"
                    onClick={() => onCancelReturn(book.id)}
                    className="text-xs text-text-muted transition-colors hover:text-text"
                  >
                    Cancel
                  </button>
                )}
              </div>
            ) : onRequestReturn ? (
              <button
                type="button"
                onClick={() => onRequestReturn(book.id)}
                className="shrink-0 whitespace-nowrap rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-slate-50"
              >
                Request Return
              </button>
            ) : null
          ) : pendingLoan ? (
            <div className="flex animate-fade-in items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
                <Icon name="solar:hourglass-linear" size={13} />
                Loan Requested
              </span>
              {onCancel && (
                <button
                  type="button"
                  onClick={() => onCancel(book.id)}
                  className="text-xs text-text-muted transition-colors hover:text-text"
                >
                  Cancel
                </button>
              )}
            </div>
          ) : alreadyBorrowed ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
              <Icon name="solar:check-circle-linear" size={13} />
              Borrowed
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onRequest(book.id)}
              disabled={requesting}
              className="shrink-0 whitespace-nowrap rounded-full border border-brand px-3 py-1.5 text-xs font-medium text-brand transition-colors hover:bg-brand/5 disabled:opacity-50"
            >
              Request Loan
            </button>
          )}
        </div>
    </div>
  );
}


export default function BarristerLoansPage() {
  const { onboarding } = useAppContext();
  const { addToast } = useToast();
  const [loans, setLoans] = useState([]);
  const [books, setBooks] = useState([]);
  const [requestingId, setRequestingId] = useState(null);
  const [requestedBookIds, setRequestedBookIds] = useState(new Set());
  const [returnRequestedIds, setReturnRequestedIds] = useState(new Set());
  const [libraryQuery, setLibraryQuery] = useState('');
  const [librarySort, setLibrarySort] = useState('title'); // 'title' | 'author' | 'area' | 'publisher'
  const [activeArea, setActiveArea] = useState('all'); // 'all' | practice area string

  useEffect(() => {
    // TODO(api): Replace with GET /api/loans?borrower=me — fetch all of user's loans
    getLoans().then(setLoans);
    // TODO(api): Replace with GET /api/books — fetch chambers catalogue
    getBooks().then(setBooks);
  }, []);

  const availableBooks = useMemo(() => books.filter((b) => b.status === 'available'), [books]);
  const onLoanBooks = useMemo(() => books.filter((b) => b.status === 'on-loan'), [books]);

  // Practice area tabs with counts
  const areaTabs = useMemo(() => {
    const counts = {};
    books.forEach((b) => {
      const area = b.practiceArea || 'Other';
      counts[area] = (counts[area] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [books]);

  // Filter library books by search query + active area tab
  const filterByArea = (list) => {
    if (activeArea !== 'all') return list.filter((b) => b.practiceArea === activeArea);
    return list;
  };

  const filteredAvailable = useMemo(() => {
    let result = filterByArea(availableBooks);
    if (libraryQuery.trim()) {
      const q = libraryQuery.toLowerCase();
      result = result.filter((b) =>
        b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || (b.practiceArea || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [availableBooks, libraryQuery, activeArea]);

  const filteredOnLoan = useMemo(() => {
    let result = filterByArea(onLoanBooks);
    if (libraryQuery.trim()) {
      const q = libraryQuery.toLowerCase();
      result = result.filter((b) =>
        b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || (b.practiceArea || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [onLoanBooks, libraryQuery, activeArea]);

  const sortBooks = (list) => {
    const sorted = [...list];
    switch (librarySort) {
      case 'author': return sorted.sort((a, b) => a.author.localeCompare(b.author));
      case 'area': return sorted.sort((a, b) => (a.practiceArea || '').localeCompare(b.practiceArea || ''));
      case 'publisher': return sorted.sort((a, b) => a.publisher.localeCompare(b.publisher));
      default: return sorted.sort((a, b) => a.title.localeCompare(b.title));
    }
  };
  const sortedAvailable = useMemo(() => sortBooks(filteredAvailable), [filteredAvailable, librarySort]);
  const sortedOnLoan = useMemo(() => sortBooks(filteredOnLoan), [filteredOnLoan, librarySort]);

  const handleRequestLoan = async (bookId) => {
    setRequestingId(bookId);
    // TODO(api): Replace with POST /api/loans — request a new loan
    await requestLoan(bookId, onboarding.name || 'Barrister');
    setRequestedBookIds((prev) => new Set(prev).add(bookId));
    setRequestingId(null);
    addToast({ message: 'Loan requested! Waiting for clerk approval.', type: 'success' });
  };

  const handleCancelRequest = (bookId) => {
    // TODO(api): Replace with DELETE /api/loans/:id — cancel pending loan request
    setRequestedBookIds((prev) => {
      const next = new Set(prev);
      next.delete(bookId);
      return next;
    });
    addToast({ message: 'Request cancelled.', type: 'success' });
  };

  const handleRequestReturn = async (bookId) => {
    // TODO(api): Replace with POST /api/loans/:id/request-return — request clerk to recall book
    await requestReturn(bookId, onboarding.name || 'Barrister');
    setReturnRequestedIds((prev) => new Set(prev).add(bookId));
    addToast({ message: 'Return requested. Clerk will contact the borrower.', type: 'success' });
  };

  const handleCancelReturnRequest = (bookId) => {
    // TODO(api): Replace with DELETE /api/loans/:id/request-return — cancel return request
    setReturnRequestedIds((prev) => {
      const next = new Set(prev);
      next.delete(bookId);
      return next;
    });
    addToast({ message: 'Return request cancelled.', type: 'success' });
  };

  // Check if a book already has a pending/active loan from this user
  const activeLoanBookIds = useMemo(() => new Set(
    loans.filter((l) => l.status === 'active' || l.status === 'overdue').map((l) => l.bookId)
  ), [loans]);
  const pendingLoanBookIds = useMemo(() => new Set(
    loans.filter((l) => l.status === 'pending').map((l) => l.bookId)
  ), [loans]);

  return (
    <div className="animate-page-in">
      <PageHeader title="Chambers Library" subtitle="Browse the catalogue, request loans, and track availability." />

      <section className="mt-6">
        <div className="flex items-center justify-end gap-2 pb-4">
            {/* Search */}
            <div className="relative flex max-w-xs flex-1 items-center">
              <span className="pointer-events-none absolute left-3 text-text-muted">
                <Icon name="solar:magnifer-linear" size={15} />
              </span>
              <input
                type="text"
                value={libraryQuery}
                onChange={(e) => setLibraryQuery(e.target.value)}
                placeholder="Search titles, authors, practice areas..."
                className="w-full rounded-xl border border-border/60 bg-white py-2 pl-9 pr-3 text-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
              {libraryQuery && (
                <button
                  type="button"
                  onClick={() => setLibraryQuery('')}
                  className="absolute right-2.5 rounded-full p-0.5 text-text-muted transition-colors hover:text-text"
                >
                  <Icon name="solar:close-circle-linear" size={14} />
                </button>
              )}
            </div>
            {/* Sort */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-text-muted">Sort by</span>
              <Select size="sm" value={librarySort} onChange={(e) => setLibrarySort(e.target.value)}>
                <option value="title">Title</option>
                <option value="author">Author</option>
                <option value="area">Practice Area</option>
                <option value="publisher">Publisher</option>
              </Select>
            </div>
        </div>

        {/* Practice area filter tabs */}
        <div className="flex flex-wrap gap-1.5 pb-4">
          <button
            type="button"
            onClick={() => setActiveArea('all')}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${activeArea === 'all' ? 'bg-brand text-white' : 'bg-slate-200/80 text-text-secondary hover:bg-slate-300/70'}`}
          >
            All ({books.length})
          </button>
          {areaTabs.map(([area, count]) => (
            <button
              key={area}
              type="button"
              onClick={() => setActiveArea(area)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${activeArea === area ? 'bg-brand text-white' : 'bg-slate-200/80 text-text-secondary hover:bg-slate-300/70'}`}
            >
              {area} ({count})
            </button>
          ))}
        </div>

        {/* Available books */}
        {sortedAvailable.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sortedAvailable.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                alreadyBorrowed={activeLoanBookIds.has(book.id)}
                pendingLoan={pendingLoanBookIds.has(book.id) || requestedBookIds.has(book.id)}
                onRequest={handleRequestLoan}
                onCancel={requestedBookIds.has(book.id) ? handleCancelRequest : undefined}
                requesting={requestingId === book.id}
              />
            ))}
          </div>
        )}

        {/* On-loan books */}
        {sortedOnLoan.length > 0 && (
          <>
            <p className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wide text-text-muted">Currently on Loan</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sortedOnLoan.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onLoan
                  returnRequested={returnRequestedIds.has(book.id)}
                  onRequestReturn={handleRequestReturn}
                  onCancelReturn={handleCancelReturnRequest}
                />
              ))}
            </div>
          </>
        )}

        {libraryQuery && sortedAvailable.length === 0 && sortedOnLoan.length === 0 && (
          <p className="py-8 text-center text-sm text-text-muted">No books matching "{libraryQuery}"</p>
        )}
      </section>
    </div>
  );
}
