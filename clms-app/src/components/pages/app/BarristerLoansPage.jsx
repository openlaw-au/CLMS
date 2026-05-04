import { useEffect, useMemo, useState } from 'react';
import Icon from '../../atoms/Icon';
import Select from '../../atoms/Select';
import Skeleton from '../../atoms/Skeleton';
import ContentLoader from '../../atoms/ContentLoader';
import BookCard from '../../molecules/BookCard';
import CategoryDropdown from '../../molecules/CategoryDropdown';
import SegmentedTabs from '../../molecules/SegmentedTabs';
import { useAppContext } from '../../../context/AppContext';
import { useToast } from '../../../context/ToastContext';
import { getLoans, requestLoan, requestReturn } from '../../../services/loansService';
import { getBooks } from '../../../services/booksService';
import { getLists, addItem } from '../../../services/authorityListsService';
import { formatShortDate } from '../../../utils/dateFormatters';

const BOOK_GRID = 'grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 book-grid-wide';

export default function BarristerLoansPage() {
  const { onboarding } = useAppContext();
  const { addToast } = useToast();
  const [loans, setLoans] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestingId, setRequestingId] = useState(null);
  const [requestedBookIds, setRequestedBookIds] = useState(new Set());
  const [returnRequestedIds, setReturnRequestedIds] = useState(new Set());
  const [libraryQuery, setLibraryQuery] = useState('');
  const [librarySort, setLibrarySort] = useState('title');
  const [selectedAreas, setSelectedAreas] = useState(new Set());
  const [statusFilter, setStatusFilter] = useState('all');

  // Add to Authority List modal
  const [authorityLists, setAuthorityLists] = useState([]);
  const [addToListBookId, setAddToListBookId] = useState(null);

  useEffect(() => {
    // TODO(api): Replace with GET /api/loans?borrower=me — fetch all of user's loans
    // TODO(api): Replace with GET /api/books — fetch chambers catalogue
    // TODO(api): Replace with GET /api/authority-lists — fetch user's authority lists
    const min = new Promise((r) => setTimeout(r, 400));
    Promise.all([getLoans(), getBooks(), getLists(), min]).then(([l, b, al]) => {
      setLoans(l);
      setBooks(b);
      setAuthorityLists(al);
      setLoading(false);
    });
  }, []);

  const isOverdue = (book) => book.status === 'on-loan' && book.dueDate && new Date(book.dueDate + 'T00:00:00') < new Date();
  const availableBooks = useMemo(() => books.filter((b) => b.status === 'available'), [books]);
  const onLoanBooks = useMemo(() => books.filter((b) => b.status === 'on-loan'), [books]);

  // User-specific book sets — distinguish "my loans" from "others' loans"
  const userName = onboarding.name || 'James Chen';
  const myActiveLoanBookIds = useMemo(() => new Set(
    loans.filter((l) => (l.status === 'active' || l.status === 'overdue') && l.borrower === userName).map((l) => l.bookId)
  ), [loans, userName]);
  const pendingLoanBookIds = useMemo(() => new Set(
    loans.filter((l) => l.status === 'pending' && l.borrower === userName).map((l) => l.bookId)
  ), [loans, userName]);

  const myBooks = useMemo(() => {
    const myIds = new Set([...myActiveLoanBookIds, ...pendingLoanBookIds, ...requestedBookIds]);
    return books.filter((b) => myIds.has(b.id));
  }, [books, myActiveLoanBookIds, pendingLoanBookIds, requestedBookIds]);

  // Practice area tabs with counts
  const areaTabs = useMemo(() => {
    const counts = {};
    books.forEach((b) => {
      const area = b.practiceArea || 'Other';
      counts[area] = (counts[area] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [books]);

  const toggleArea = (area) => {
    setSelectedAreas((prev) => {
      const next = new Set(prev);
      if (next.has(area)) next.delete(area); else next.add(area);
      return next;
    });
  };

  // Unified displayed books
  const displayedBooks = useMemo(() => {
    let result;
    if (statusFilter === 'available') result = availableBooks;
    else if (statusFilter === 'on-loan') result = onLoanBooks;
    else if (statusFilter === 'my-books') result = myBooks;
    else result = books;

    if (selectedAreas.size > 0) {
      result = result.filter((b) => selectedAreas.has(b.practiceArea || 'Other'));
    }
    if (libraryQuery.trim()) {
      const q = libraryQuery.toLowerCase();
      result = result.filter((b) =>
        b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || (b.practiceArea || '').toLowerCase().includes(q)
      );
    }

    const sorted = [...result];
    switch (librarySort) {
      case 'author': return sorted.sort((a, b) => a.author.localeCompare(b.author));
      case 'area': return sorted.sort((a, b) => (a.practiceArea || '').localeCompare(b.practiceArea || ''));
      case 'publisher': return sorted.sort((a, b) => a.publisher.localeCompare(b.publisher));
      default: return sorted.sort((a, b) => a.title.localeCompare(b.title));
    }
  }, [statusFilter, books, availableBooks, onLoanBooks, myBooks, selectedAreas, libraryQuery, librarySort]);

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

  const handleAddToList = async (listId) => {
    const book = books.find((b) => b.id === addToListBookId);
    if (!book) return;
    // TODO(api): Replace with POST /api/authority-lists/:id/items — add book as authority item
    await addItem(listId, {
      type: 'book',
      title: book.title,
      citation: `${book.author}, ${book.title} (${book.publisher}${book.edition ? `, ${book.edition} ed` : ''})`,
      usage: 'referred',
    });
    const list = authorityLists.find((l) => l.id === listId);
    addToast({ message: `Added to "${list?.name || 'list'}"`, type: 'success' });
    setAddToListBookId(null);
  };

  const addToListBook = addToListBookId ? books.find((b) => b.id === addToListBookId) : null;

  const overdueBooks = useMemo(() => myBooks.filter(isOverdue), [myBooks]);
  const hasOverdue = overdueBooks.length > 0;
  const pills = [
    { key: 'all', label: 'All', count: books.length, icon: 'solar:book-2-linear', activeAccent: 'brand' },
    { key: 'available', label: 'Available', count: availableBooks.length, icon: 'solar:check-circle-linear', activeAccent: 'brand' },
    { key: 'on-loan', label: 'On Loan', count: onLoanBooks.length, icon: 'solar:clock-circle-linear', activeAccent: 'brand' },
    { key: 'my-books', label: 'My Books', count: myBooks.length, icon: 'solar:book-bookmark-linear', activeAccent: 'brand', badge: hasOverdue },
  ];

  return (
    <div className="animate-page-in">
      {/* Page header */}
      <ContentLoader
        loading={loading}
        skeleton={
          <>
            <Skeleton className="h-9 w-52 rounded-lg" />
            <Skeleton className="mt-2 h-5 w-80 rounded-lg" />
          </>
        }
      >
        <h1 className="font-serif text-page-title text-text">Chambers Library</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Browse the catalogue, request loans, and track availability.
        </p>
      </ContentLoader>

      {/* Toolbar + book cards */}
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
              </div>
            </div>
          }
        >
          <div className="flex w-full flex-col gap-3 toolbar-wide">
            {/* Search + category + sort */}
            <div className="flex items-center gap-2">
              <div className="relative flex w-full max-w-[220px] items-center">
                <span className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 items-center text-text-muted">
                  <Icon name="solar:magnifer-linear" size={15} />
                </span>
                <input
                  type="text"
                  value={libraryQuery}
                  onChange={(e) => setLibraryQuery(e.target.value)}
                  placeholder="Search titles, authors..."
                  className="w-full rounded-xl border border-border bg-white py-2 pl-9 pr-3 text-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/20"
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
              <CategoryDropdown
                options={areaTabs.map(([label, count]) => ({ label, count }))}
                selected={selectedAreas}
                onToggle={toggleArea}
                onClear={() => setSelectedAreas(new Set())}
              />
              <Select size="md" icon="solar:sort-linear" value={librarySort} onChange={(e) => setLibrarySort(e.target.value)}>
                <option value="title">Sort by: Title</option>
                <option value="author">Sort by: Author</option>
                <option value="area">Sort by: Practice Area</option>
                <option value="publisher">Sort by: Publisher</option>
              </Select>
            </div>

            {/* Status pills */}
            <SegmentedTabs
              items={pills}
              value={statusFilter}
              onChange={setStatusFilter}
            />
          </div>
        </ContentLoader>

        {/* Overdue banner — visible in My Books */}
        {statusFilter === 'my-books' && hasOverdue && !loading && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 animate-fade-in">
            <Icon name="solar:danger-triangle-bold" size={18} className="mt-0.5 shrink-0 text-danger" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-danger">
                {overdueBooks.length === 1 ? '1 Book is Overdue' : `${overdueBooks.length} Books are Overdue`}
              </p>
              <p className="mt-0.5 text-xs text-danger/80">
                Please return {overdueBooks.length === 1 ? 'this book' : 'these books'} to the clerk as soon as possible.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {overdueBooks.map((b) => (
                  <span key={b.id} className="inline-flex items-center gap-1.5 rounded-md bg-white/80 px-2 py-1 text-xs font-medium text-danger ring-1 ring-danger/15">
                    <Icon name="solar:book-2-linear" size={12} />
                    <span className="truncate max-w-[200px]">{b.title}</span>
                    {b.dueDate && <span className="text-danger/60">· due {formatShortDate(b.dueDate)}</span>}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Book cards */}
        <ContentLoader
          loading={loading}
          skeleton={
            <div className={BOOK_GRID}>
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="min-h-[300px] overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
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
          {displayedBooks.length > 0 ? (
            statusFilter === 'on-loan' ? (() => {
              const mine = displayedBooks.filter((b) => myActiveLoanBookIds.has(b.id));
              const others = displayedBooks.filter((b) => !myActiveLoanBookIds.has(b.id));
              const renderCard = (book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onLoan={book.status === 'on-loan'}
                  overdue={isOverdue(book)}
                  alreadyBorrowed={myActiveLoanBookIds.has(book.id)}
                  pendingLoan={pendingLoanBookIds.has(book.id) || requestedBookIds.has(book.id)}
                  returnRequested={returnRequestedIds.has(book.id)}
                  onRequestReturn={handleRequestReturn}
                  onCancelReturn={handleCancelReturnRequest}
                  onRequest={handleRequestLoan}
                  onCancel={requestedBookIds.has(book.id) ? handleCancelRequest : undefined}
                  requesting={requestingId === book.id}
                  onAddToList={() => setAddToListBookId(book.id)}
                />
              );
              return (
                <div className="space-y-6">
                  {others.length > 0 && (
                    <div>
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                        Others&rsquo; Loans ({others.length})
                      </p>
                      <div className={BOOK_GRID}>{others.map(renderCard)}</div>
                    </div>
                  )}
                  {mine.length > 0 && (
                    <div>
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                        My Loans ({mine.length})
                      </p>
                      <div className={BOOK_GRID}>{mine.map(renderCard)}</div>
                    </div>
                  )}
                </div>
              );
            })() : (
              <div className={BOOK_GRID}>
                {displayedBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    onLoan={book.status === 'on-loan'}
                    overdue={isOverdue(book)}
                    alreadyBorrowed={myActiveLoanBookIds.has(book.id)}
                    pendingLoan={pendingLoanBookIds.has(book.id) || requestedBookIds.has(book.id)}
                    returnRequested={returnRequestedIds.has(book.id)}
                    onRequestReturn={handleRequestReturn}
                    onCancelReturn={handleCancelReturnRequest}
                    onRequest={handleRequestLoan}
                    onCancel={requestedBookIds.has(book.id) ? handleCancelRequest : undefined}
                    requesting={requestingId === book.id}
                    onAddToList={() => setAddToListBookId(book.id)}
                  />
                ))}
              </div>
            )
          ) : (
            <p className="py-8 text-center text-sm text-text-muted">
              {libraryQuery ? `No books matching "${libraryQuery}"` : statusFilter === 'my-books' ? 'No borrowed or requested books yet.' : 'No books found'}
            </p>
          )}
        </ContentLoader>
      </section>

      {/* Add to Authority List modal */}
      {addToListBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setAddToListBookId(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl ring-1 ring-black/5 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-semibold text-text">Add to Authority List</h3>
              <button type="button" onClick={() => setAddToListBookId(null)} className="rounded-full p-1.5 text-text-muted transition-colors hover:bg-surface-subtle hover:text-text">
                <Icon name="solar:close-circle-linear" size={18} />
              </button>
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-xl bg-surface-subtle p-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10">
                <Icon name="solar:book-2-linear" size={16} className="text-brand" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-serif text-sm font-medium text-text">{addToListBook.title}</p>
                <p className="truncate text-xs text-text-secondary">{addToListBook.author}</p>
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-text-secondary">Select a list</p>
              {authorityLists.length > 0 ? (
                <div className="max-h-48 space-y-1 overflow-y-auto">
                  {authorityLists.map((list) => (
                    <button
                      key={list.id}
                      type="button"
                      onClick={() => handleAddToList(list.id)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-surface-subtle"
                    >
                      <Icon name="solar:document-text-linear" size={16} className="shrink-0 text-text-muted" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-text">{list.name}</p>
                        <p className="text-xs text-text-muted">{list.items.length} items</p>
                      </div>
                      <Icon name="solar:alt-arrow-right-linear" size={14} className="shrink-0 text-text-muted" />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="py-4 text-center text-sm text-text-muted">No authority lists yet. Create one in Authority Lists.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
