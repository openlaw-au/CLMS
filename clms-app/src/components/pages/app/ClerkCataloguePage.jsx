import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Icon from '../../atoms/Icon';
import Button from '../../atoms/Button';
import Badge from '../../atoms/Badge';
import PageHeader from '../../molecules/PageHeader';
import BookDetailPanel from '../../organisms/BookDetailPanel';
import AddBookFlow from '../../organisms/AddBookFlow';
import ImportModal from '../../organisms/ImportModal';
import { useToast } from '../../../context/ToastContext';
import { getBooks } from '../../../services/booksService';
import { getQueueItem, linkToExisting, markAddedToCatalogue } from '../../../services/uncataloguedQueueService';

function isBookEnriched(book) {
  return book.enrichment && Object.values(book.enrichment).some((value) => value && (Array.isArray(value) ? value.length > 0 : true));
}

export default function ClerkCataloguePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  const [books, setBooks] = useState([]);
  const [sortBy, setSortBy] = useState('title');
  const [filterTab, setFilterTab] = useState('all');
  const [viewMode, setViewMode] = useState('library');
  const [selectedBook, setSelectedBook] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAddBook, setShowAddBook] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [queueEntry, setQueueEntry] = useState(null);
  const queryParam = searchParams.get('q')?.trim().toLowerCase() || '';
  const queueIdParam = searchParams.get('queueId');
  const queueAction = searchParams.get('action');

  useEffect(() => {
    // TODO(api): Replace with GET /api/books?sort={sortBy} - fetch sorted catalogue
    getBooks().then(setBooks);
  }, [refreshKey]);

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
  }, [queueIdParam, refreshKey]);

  const enrichedCount = useMemo(() => books.filter(isBookEnriched).length, [books]);
  const availableCount = useMemo(() => books.filter((book) => book.status === 'available').length, [books]);
  const onLoanCount = books.length - availableCount;
  const enrichedPct = books.length > 0 ? Math.round((enrichedCount / books.length) * 100) : 0;

  // Metadata gap analysis
  const missingSubject = useMemo(() => books.filter((b) => !b.enrichment?.subject).length, [books]);
  const missingJurisdiction = useMemo(() => books.filter((b) => !b.enrichment?.jurisdiction?.length).length, [books]);
  const missingResourceType = useMemo(() => books.filter((b) => !b.enrichment?.resourceType).length, [books]);

  const filteredBooks = useMemo(() => {
    let nextBooks = books;

    if (filterTab === 'enriched') nextBooks = nextBooks.filter(isBookEnriched);
    if (filterTab === 'isbn-only') nextBooks = nextBooks.filter((book) => !isBookEnriched(book));

    if (queryParam) {
      nextBooks = nextBooks.filter((book) =>
        [book.title, book.author, book.location, book.enrichment?.subject]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(queryParam))
      );
    }

    return nextBooks;
  }, [books, filterTab, queryParam]);

  const sortedBooks = useMemo(() => {
    return [...filteredBooks].sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'author') return a.author.localeCompare(b.author);
      if (sortBy === 'status') return a.status.localeCompare(b.status);
      return 0;
    });
  }, [filteredBooks, sortBy]);

  const locations = [...new Set(books.map((book) => book.location))];

  const handlePanelSaved = () => {
    setRefreshKey((prev) => prev + 1);
    setSelectedBook(null);
  };

  const clearQueueContext = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('queueId');
      next.delete('action');
      return next;
    }, { replace: true });
  };

  const filterTabs = [
    { key: 'all', label: 'All', count: books.length },
    { key: 'enriched', label: 'Enriched', count: enrichedCount },
    { key: 'isbn-only', label: 'ISBN Only', count: books.length - enrichedCount },
  ];
  const effectiveViewMode = queueAction === 'link' ? 'library' : viewMode;
  const showResolvedAddFlow = showAddBook || (queueAction === 'add' && !!queueIdParam && !!queueEntry);

  return (
    <div className="animate-page-in">
      <PageHeader
        title="Catalogue"
        subtitle="Maintain catalogue quality for faster search and cleaner authority workflows."
      >
        <Button size="sm" variant="primary" onClick={() => setShowAddBook(true)}>
          <Icon name="solar:add-circle-linear" size={16} />
          Add Book
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setShowImport(true)}>
          <Icon name="solar:upload-linear" size={16} />
          Import CSV
        </Button>
      </PageHeader>

      <div className="mt-5 flex flex-wrap items-center gap-2 rounded-xl border border-border/70 bg-white p-2">
        <button
          type="button"
          onClick={() => setViewMode('library')}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            viewMode === 'library' ? 'bg-brand text-white' : 'bg-slate-100 text-text-secondary hover:bg-slate-200'
          }`}
        >
          Card View
        </button>
        <button
          type="button"
          onClick={() => setViewMode('table')}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            viewMode === 'table' ? 'bg-brand text-white' : 'bg-slate-100 text-text-secondary hover:bg-slate-200'
          }`}
        >
          Admin Table
        </button>

        <div className="ml-auto flex gap-1 rounded-lg bg-slate-100 p-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilterTab(tab.key)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                filterTab === tab.key ? 'bg-white text-text shadow-sm' : 'text-text-secondary hover:text-text'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {queueEntry && (
        <div className="mt-4 rounded-2xl border border-brand/20 bg-brand/5 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-text">
                {queueAction === 'link' ? 'Link to Existing Catalogue Item' : 'Add Uncatalogued Book'}
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                {queueEntry.title} · added by {queueEntry.addedBy}
              </p>
            </div>
            <button
              type="button"
              onClick={clearQueueContext}
              className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-white/80 hover:text-text"
            >
              <Icon name="solar:close-circle-linear" size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-4">
        <div className="lg:col-span-3">
          {effectiveViewMode === 'library' ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {sortedBooks.map((book) => {
                const enriched = isBookEnriched(book);
                const status = book.status === 'available' ? 'Available' : 'On Loan';

                return (
                  <article key={book.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-sm font-semibold text-text">{book.title}</p>
                        <p className="mt-1 text-xs text-text-secondary">{book.author}</p>
                      </div>
                      <Badge variant={book.status === 'available' ? 'status' : 'default'}>{status}</Badge>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-text-secondary">
                        {book.location}, Floor {book.floor}
                      </span>
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                        enriched ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-text-muted'
                      }`}>
                        {enriched ? 'Enriched' : 'ISBN Only'}
                      </span>
                    </div>

                    <div className="mt-3 flex gap-2">
                      {queueEntry && queueAction === 'link' && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={async () => {
                            await linkToExisting(queueEntry.id, book.id);
                            addToast({ message: `${queueEntry.title} linked to ${book.title}`, type: 'success' });
                            clearQueueContext();
                            setRefreshKey((prev) => prev + 1);
                          }}
                        >
                          <Icon name="solar:link-linear" size={14} />
                          Link This Book
                        </Button>
                      )}
                      <Button size="sm" variant="secondary" onClick={() => setSelectedBook(book)}>
                        <Icon name="solar:eye-linear" size={14} />
                        View
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => setSelectedBook(book)}>
                        <Icon name="solar:pen-linear" size={14} />
                        Edit Metadata
                      </Button>
                    </div>
                  </article>
                );
              })}

              {sortedBooks.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border bg-white p-6 sm:col-span-2 xl:col-span-3">
                  <p className="text-sm font-medium text-text">No books in this filter.</p>
                  <p className="mt-1 text-xs text-text-secondary">Try switching filters or import more books.</p>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="mb-2 flex gap-2">
                {['title', 'author', 'status'].map((sortKey) => (
                  <button
                    key={sortKey}
                    type="button"
                    onClick={() => setSortBy(sortKey)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                      sortBy === sortKey
                        ? 'bg-white text-text shadow-sm ring-1 ring-black/5'
                        : 'text-text-secondary hover:bg-white/60'
                    }`}
                  >
                    Sort by {sortKey}
                  </button>
                ))}
              </div>

              <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border/60 text-xs text-text-secondary">
                      <th className="px-5 py-3 font-medium">Title</th>
                      <th className="px-5 py-3 font-medium">Author</th>
                      <th className="px-5 py-3 font-medium">Subject</th>
                      <th className="px-5 py-3 font-medium">Location</th>
                      <th className="px-5 py-3 font-medium">Enrichment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedBooks.map((book) => {
                      const enriched = isBookEnriched(book);
                      return (
                        <tr
                          key={book.id}
                          className="cursor-pointer border-b border-border/30 transition-colors hover:bg-slate-50"
                          onClick={() => setSelectedBook(book)}
                        >
                          <td className="px-5 py-3.5 font-medium text-text">{book.title}</td>
                          <td className="px-5 py-3.5 text-text-secondary">{book.author}</td>
                          <td className="px-5 py-3.5 text-text-secondary">{book.enrichment?.subject || '-'}</td>
                          <td className="px-5 py-3.5 text-text-secondary">{book.location}</td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              enriched ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-text-muted'
                            }`}>
                              {enriched ? (
                                <>
                                  <Icon name="solar:check-circle-linear" size={10} />
                                  Enriched
                                </>
                              ) : (
                                'ISBN Only'
                              )}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="space-y-4">
          {/* Metadata Quality — the core metric for this page */}
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="text-sm font-semibold text-text">Metadata Quality</h2>
            <p className="mt-1 text-xs text-text-secondary">
              Enriched metadata powers barrister search filters.
            </p>

            <div className="mt-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-text-secondary">{enrichedCount} of {books.length} enriched</p>
                <span className="text-lg font-semibold text-text">{enrichedPct}%</span>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-slate-200">
                <div
                  className="h-2 rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${enrichedPct}%` }}
                />
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {[
                { label: 'Missing subject', count: missingSubject, icon: 'solar:tag-linear' },
                { label: 'Missing jurisdiction', count: missingJurisdiction, icon: 'solar:flag-linear' },
                { label: 'Missing resource type', count: missingResourceType, icon: 'solar:document-text-linear' },
              ].map((gap) => (
                <button
                  key={gap.label}
                  type="button"
                  onClick={() => setFilterTab('isbn-only')}
                  className="flex w-full items-center gap-2.5 rounded-xl border border-border/70 bg-slate-50/40 px-3 py-2 text-left transition-colors hover:bg-slate-100"
                >
                  <Icon name={gap.icon} size={14} className={gap.count > 0 ? 'text-amber-500' : 'text-emerald-500'} />
                  <span className="flex-1 text-xs text-text-secondary">{gap.label}</span>
                  <span className={`text-sm font-semibold ${gap.count > 0 ? 'text-text' : 'text-emerald-600'}`}>{gap.count}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Inventory summary */}
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="text-sm font-semibold text-text">Inventory</h2>
            <div className="mt-3 space-y-2.5">
              {[
                ['Total Books', books.length, 'solar:book-2-linear', 'text-brand'],
                ['Available', availableCount, 'solar:check-circle-linear', 'text-emerald-600'],
                ['On Loan', onLoanCount, 'solar:book-bookmark-linear', 'text-blue-600'],
              ].map(([label, value, icon, tone]) => (
                <div key={label} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Icon name={icon} size={16} className={tone} />
                    <span className="text-sm text-text-secondary">{label}</span>
                  </div>
                  <span className="text-sm font-semibold text-text">{value}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Locations */}
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="text-sm font-semibold text-text">Locations</h2>
            <div className="mt-3 space-y-2">
              {locations.map((location) => (
                <div key={location} className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                    <Icon name="solar:map-point-linear" size={14} className="text-text-muted" />
                  </span>
                  <span className="text-sm text-text-secondary">{location}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {selectedBook && (
        <BookDetailPanel
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onSaved={handlePanelSaved}
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
              addToast({ message: `${queueEntry.title} moved from queue to catalogue`, type: 'success' });
              clearQueueContext();
            }
            setRefreshKey((prev) => prev + 1);
          }}
        />
      )}

      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImported={() => setRefreshKey((prev) => prev + 1)}
        />
      )}
    </div>
  );
}
