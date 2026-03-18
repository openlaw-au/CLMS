import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../atoms/Icon';
import Input from '../../atoms/Input';
import Button from '../../atoms/Button';
import PageHeader from '../../molecules/PageHeader';
import Badge from '../../atoms/Badge';
import FilterPillBar from '../../molecules/FilterPillBar';
import { useToast } from '../../../context/ToastContext';
import { searchAll } from '../../../services/searchService';
import { getBooks } from '../../../services/booksService';
import { addItem, getLists } from '../../../services/authorityListsService';

const SOURCE_TABS = [
  { key: 'all', label: 'All Results' },
  { key: 'book', label: 'Books' },
  { key: 'jade', label: 'Cases & Legislation' },
];

const SUGGESTED_QUERIES = [
  'Cross on Evidence',
  'Expert evidence',
  'Evidence Act',
  'Equity remedies',
  'Contract damages',
];

function BookResultCard({ item, onOpenLibrary, onAddAuthority }) {
  const statusLabel = item.status === 'available' ? 'Available' : 'On Loan';
  const statusVariant = item.status === 'available' ? 'status' : 'default';

  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Icon name="solar:book-2-linear" size={16} className="text-brand" />
            <p className="truncate text-sm font-semibold text-text">{item.title}</p>
          </div>
          <p className="mt-1 text-xs text-text-secondary">{item.author} · {item.edition} edition</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">
              {item.enrichment?.subject || item.practiceArea}
            </span>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-text-secondary">
              {item.location}, Floor {item.floor}
            </span>
          </div>
        </div>
        <Badge variant={statusVariant}>{statusLabel}</Badge>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={() => onOpenLibrary(item)}>
          <Icon name="solar:book-open-linear" size={14} />
          Open in Library
        </Button>
        <Button size="sm" variant="secondary" onClick={() => onAddAuthority(item, 'book')}>
          <Icon name="solar:list-check-linear" size={14} />
          Add to Authorities
        </Button>
      </div>
    </article>
  );
}

function JadeResultCard({ item, onAddAuthority }) {
  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Icon name="solar:scale-linear" size={16} className="text-emerald-600" />
            <p className="truncate text-sm font-semibold text-text">{item.title}</p>
          </div>
          <p className="mt-1 text-xs text-text-secondary">
            {item.citation} {item.court ? `· ${item.court}` : ''} · {item.year}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600">JADE</span>
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
              item.type === 'case' ? 'bg-green-50 text-green-600' : 'bg-purple-50 text-purple-600'
            }`}>
              {item.type === 'case' ? 'Case Law' : 'Legislation'}
            </span>
            {item.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <Badge variant="info">JADE</Badge>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => window.open(`https://jade.io/search?q=${encodeURIComponent(item.title)}`, '_blank')}
        >
          Open in JADE
          <Icon name="solar:arrow-right-up-linear" size={12} />
        </Button>
        <Button size="sm" variant="secondary" onClick={() => onAddAuthority(item, 'jade')}>
          <Icon name="solar:list-check-linear" size={14} />
          Add to Authorities
        </Button>
      </div>
    </article>
  );
}

export default function ClerkSearchPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState({ books: [], jade: [] });
  const [filters, setFilters] = useState({
    source: 'all',
    subject: 'all',
    jurisdiction: 'all',
    type: 'all',
    availability: 'all',
  });

  // Hub data — loaded on mount for empty-state display
  const [popularBooks, setPopularBooks] = useState([]);
  const [recentLists, setRecentLists] = useState([]);

  useEffect(() => {
    // TODO(api): Replace with GET /api/books?sort=popular — fetch most borrowed books
    getBooks().then((allBooks) => setPopularBooks(allBooks.slice(0, 5)));
    // TODO(api): Replace with GET /api/authority-lists?sort=recent — fetch recent authority lists
    getLists().then(setRecentLists);
  }, []);

  const handleSearch = useCallback(async (value) => {
    if (!value || value.trim().length < 2) {
      setResults({ books: [], jade: [] });
      return;
    }
    setSearching(true);
    // TODO(api): Replace with GET /api/search?q={query} — unified search endpoint
    const data = await searchAll(value.trim());
    setResults(data);
    setSearching(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  const { books, jade } = useMemo(() => {
    let nextBooks = results.books;
    let nextJade = results.jade;

    if (filters.source === 'book') nextJade = [];
    if (filters.source === 'jade') nextBooks = [];

    if (filters.subject !== 'all') {
      nextBooks = nextBooks.filter((book) => book.enrichment?.subject === filters.subject);
      nextJade = nextJade.filter((entry) => entry.tags.includes(filters.subject));
    }
    if (filters.jurisdiction !== 'all') {
      nextBooks = nextBooks.filter((book) => book.enrichment?.jurisdiction?.includes(filters.jurisdiction));
      nextJade = nextJade.filter((entry) => entry.tags.includes(filters.jurisdiction));
    }
    if (filters.type === 'book') nextJade = [];
    if (filters.type === 'jade') nextBooks = [];
    if (filters.availability === 'available') nextBooks = nextBooks.filter((book) => book.status === 'available');
    if (filters.availability === 'on-loan') nextBooks = nextBooks.filter((book) => book.status === 'on-loan');

    return { books: nextBooks, jade: nextJade };
  }, [filters, results.books, results.jade]);

  const totalResults = books.length + jade.length;
  const source = filters.source;

  const handleOpenLibrary = (book) => {
    addToast({ message: `Open "${book.title}" in Catalogue`, type: 'info' });
    navigate('/app/catalogue');
  };

  const handleAddAuthority = async (item, type) => {
    // TODO(api): Replace with POST /api/authority-lists/:id/items — add selected result to target list
    const lists = await getLists();
    if (lists.length === 0) {
      addToast({ message: 'Create your first authority list in Authorities', type: 'info' });
      navigate('/app/authorities');
      return;
    }

    const targetList = lists[0];
    const entry = {
      type: type === 'jade' ? item.type : 'book',
      title: item.title,
      citation: item.citation || null,
      pageRange: null,

    };
    await addItem(targetList.id, entry);
    addToast({ message: `Added to ${targetList.name}`, type: 'success' });
  };

  const interleaved = [];
  const maxLen = Math.max(books.length, jade.length);
  for (let i = 0; i < maxLen; i += 1) {
    if (i < books.length) interleaved.push({ type: 'book', item: books[i] });
    if (i < jade.length) interleaved.push({ type: 'jade', item: jade[i] });
  }

  const listBySource = source === 'book'
    ? books.map((item) => ({ type: 'book', item }))
    : source === 'jade'
      ? jade.map((item) => ({ type: 'jade', item }))
      : interleaved;

  const hasQuery = query.trim().length >= 2;

  return (
    <div className="animate-page-in pb-12">
      <PageHeader title="Search" subtitle="One search across chambers books, JADE cases, and legislation.">
        <Button size="sm" variant="secondary" onClick={() => navigate('/app/authorities')}>
          <Icon name="solar:list-check-linear" size={14} />
          Open Authorities
        </Button>
      </PageHeader>

      <div className="mt-5 max-w-2xl">
        <Input
          autoFocus
          icon="solar:magnifer-linear"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder='Try: "Cross on Evidence"'
        />
      </div>

      {/* Research hub — shown when no active query */}
      {!hasQuery && !searching && (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {/* Suggested searches */}
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 lg:col-span-2">
            <h2 className="font-serif text-card-title text-text">Start Researching</h2>
            <p className="mt-1 text-xs text-text-secondary">Search books, JADE cases, and legislation in one place.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {SUGGESTED_QUERIES.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuery(q)}
                  className="rounded-full border border-border/70 bg-slate-50 px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-slate-100 hover:text-text"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Popular in your library */}
            <div className="mt-5">
              <p className="mb-2 text-xs font-medium text-text-secondary">Popular in your library</p>
              <div className="space-y-1.5">
                {popularBooks.map((book) => (
                  <button
                    key={book.id}
                    type="button"
                    onClick={() => setQuery(book.title)}
                    className="flex w-full items-center gap-3 rounded-lg border border-border/50 px-3 py-2 text-left transition-colors hover:bg-slate-50"
                  >
                    <Icon name="solar:book-2-linear" size={14} className="shrink-0 text-brand" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-text">{book.title}</p>
                      <p className="text-[11px] text-text-muted">{book.author}</p>
                    </div>
                    <Badge variant={book.status === 'available' ? 'status' : 'default'}>
                      {book.status === 'available' ? 'Available' : 'On Loan'}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Recent authority lists */}
          <div className="space-y-4">
            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-card-title text-text">Authority Lists</h2>
                <button
                  type="button"
                  onClick={() => navigate('/app/authorities')}
                  className="text-xs font-medium text-brand hover:text-brand-hover"
                >
                  View all
                </button>
              </div>
              <p className="mt-1 text-xs text-text-secondary">Add search results directly to lists.</p>
              <div className="mt-3 space-y-2">
                {recentLists.map((list) => (
                  <button
                    key={list.id}
                    type="button"
                    onClick={() => navigate('/app/authorities')}
                    className="w-full rounded-xl border border-border/70 bg-slate-50/40 px-3 py-2.5 text-left transition-colors hover:bg-slate-100"
                  >
                    <p className="text-sm font-medium text-text">{list.name}</p>
                    <p className="mt-0.5 text-xs text-text-secondary">{list.items.length} entries</p>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <h2 className="font-serif text-card-title text-text">Search covers</h2>
              <div className="mt-3 space-y-2.5">
                <div className="flex items-center gap-2.5 text-sm text-text-secondary">
                  <Icon name="solar:book-2-linear" size={14} className="shrink-0 text-brand" />
                  <span>Chambers library books</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-text-secondary">
                  <Icon name="solar:scale-linear" size={14} className="shrink-0 text-emerald-600" />
                  <span>JADE case law</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-text-secondary">
                  <Icon name="solar:document-text-linear" size={14} className="shrink-0 text-purple-600" />
                  <span>Legislation</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* Filter pills */}
      {hasQuery && (
        <div className="mt-3">
          <FilterPillBar filters={filters} onChange={setFilters} />
        </div>
      )}

      {/* Source tabs */}
      {hasQuery && (
        <div className="mt-4 flex flex-wrap gap-2 rounded-xl border border-border/70 bg-white px-3 py-2">
          {SOURCE_TABS.map((tab) => {
            const active = source === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, source: tab.key }))}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  active ? 'bg-brand text-white' : 'bg-slate-100 text-text-secondary hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
          <span className="ml-auto self-center text-xs text-text-muted">
            {totalResults} {totalResults === 1 ? 'result' : 'results'}
          </span>
        </div>
      )}

      {/* Skeleton loading state */}
      {searching && (
        <div className="mt-4 space-y-2 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-border/50 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/5 rounded bg-slate-200" />
                  <div className="h-3 w-2/5 rounded bg-slate-100" />
                </div>
                <div className="h-8 w-20 rounded-lg bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!searching && listBySource.length > 0 && (
        <div className="mt-4 space-y-2">
          {listBySource.map(({ type, item }) =>
            type === 'book' ? (
              <BookResultCard
                key={`book-${item.id}`}
                item={item}
                onOpenLibrary={handleOpenLibrary}
                onAddAuthority={handleAddAuthority}
              />
            ) : (
              <JadeResultCard
                key={`jade-${item.id}`}
                item={item}
                onAddAuthority={handleAddAuthority}
              />
            ),
          )}
        </div>
      )}

      {hasQuery && !searching && listBySource.length === 0 && (
        <div className="mt-5 rounded-xl border border-border/70 bg-white p-5">
          <p className="text-sm font-medium text-text">No results found for "{query}".</p>
          <p className="mt-1 text-xs text-text-secondary">
            Try a broader term, or switch source filters.
          </p>
        </div>
      )}
    </div>
  );
}
