import { useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import AppShell from '../organisms/AppShell';
import Input from '../atoms/Input';
import Button from '../atoms/Button';
import Icon from '../atoms/Icon';
import Badge from '../atoms/Badge';
import confetti from 'canvas-confetti';
import { useAppContext } from '../../context/AppContext';
import { searchAll } from '../../services/searchService';
import { getBooks } from '../../services/booksService';
import { getLoans, approveLoan } from '../../services/loansService';
import { getLists } from '../../services/authorityListsService';
import { getMembers, inviteMember } from '../../services/membersService';

/* ──────────────────────────────────────────
   Barrister: Dashboard
   ────────────────────────────────────────── */
function BarristerDashboard({ onboarding, navigate, firstVisit }) {
  const [loans, setLoans] = useState([]);
  const [lists, setLists] = useState([]);

  useEffect(() => {
    if (!firstVisit) {
      // TODO(api): Replace with GET /api/loans?borrower=me&status=active — fetch user's active loans
      getLoans({ status: 'active' }).then(setLoans);
      // TODO(api): Replace with GET /api/authority-lists — fetch user's authority lists
      getLists().then(setLists);
    }
  }, [firstVisit]);

  const dueSoon = loans.filter((l) => {
    if (!l.dueDate) return false;
    const diff = new Date(l.dueDate) - new Date();
    return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
  });

  if (firstVisit) {
    return (
      <div>
        <h1 className="font-serif text-3xl text-text">Welcome, {onboarding.name || 'Counsel'}!</h1>
        <p className="mt-2 text-sm text-text-secondary">Your dashboard overview.</p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            ['Active Loans', 0, 'text-text'],
            ['Due This Week', 0, 'text-brand'],
            ['Authority Lists', 0, 'text-text'],
          ].map(([label, count, color]) => (
            <article key={label} className="rounded-2xl border border-border bg-slate-50 p-4">
              <p className={`text-2xl font-semibold ${color}`}>{count}</p>
              <p className="text-sm text-text-secondary">{label}</p>
            </article>
          ))}
        </div>

        <div className="mt-6">
          <h2 className="mb-3 font-serif text-lg text-text">Get started</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <article
              className="cursor-pointer rounded-2xl border border-border bg-slate-50 p-4 transition-colors hover:bg-slate-100"
              onClick={() => navigate('/app/search')}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10">
                <Icon name="solar:magnifer-linear" size={16} className="text-brand" />
              </span>
              <p className="mt-3 text-sm font-semibold text-text">Search for a book or case</p>
              <p className="mt-1 text-xs text-text-secondary">Find books in the library or search JADE case law.</p>
            </article>
            <article
              className="cursor-pointer rounded-2xl border border-border bg-slate-50 p-4 transition-colors hover:bg-slate-100"
              onClick={() => navigate('/app/lists')}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50">
                <Icon name="solar:list-check-linear" size={16} className="text-emerald-600" />
              </span>
              <p className="mt-3 text-sm font-semibold text-text">Create an authority list</p>
              <p className="mt-1 text-xs text-text-secondary">Build AGLC-formatted authority lists for your cases.</p>
            </article>
            <article
              className="cursor-pointer rounded-2xl border border-border bg-slate-50 p-4 transition-colors hover:bg-slate-100"
              onClick={() => navigate('/app/loans')}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50">
                <Icon name="solar:book-bookmark-linear" size={16} className="text-blue-600" />
              </span>
              <p className="mt-3 text-sm font-semibold text-text">Request a book loan</p>
              <p className="mt-1 text-xs text-text-secondary">Borrow books from the chambers library.</p>
            </article>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="mb-3 font-serif text-lg text-text">Recent Authority Lists</h2>
          <p className="text-sm text-text-muted">Your authority lists will appear here once created.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-serif text-3xl text-text">Welcome, {onboarding.name || 'Counsel'}!</h1>
      <p className="mt-2 text-sm text-text-secondary">Your dashboard overview.</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl border border-border bg-slate-50 p-4">
          <p className="text-2xl font-semibold text-text">{loans.length}</p>
          <p className="text-sm text-text-secondary">Active Loans</p>
        </article>
        <article className="rounded-2xl border border-border bg-slate-50 p-4">
          <p className="text-2xl font-semibold text-brand">{dueSoon.length}</p>
          <p className="text-sm text-text-secondary">Due This Week</p>
        </article>
        <article className="rounded-2xl border border-border bg-slate-50 p-4">
          <p className="text-2xl font-semibold text-text">{lists.length}</p>
          <p className="text-sm text-text-secondary">Authority Lists</p>
        </article>
      </div>

      <div className="mt-5">
        <h2 className="mb-3 font-serif text-lg text-text">Quick Search</h2>
        <div className="max-w-xl">
          <Input
            icon="solar:magnifer-linear"
            placeholder='Try: "Cross on Evidence"'
            onFocus={() => navigate('/app/search')}
          />
        </div>
      </div>

      {lists.length > 0 && (
        <div className="mt-5">
          <h2 className="mb-3 font-serif text-lg text-text">Recent Authority Lists</h2>
          <div className="space-y-2">
            {lists.slice(0, 3).map((list) => (
              <article
                key={list.id}
                className="flex items-center justify-between rounded-xl border border-border bg-slate-50 p-3"
              >
                <div>
                  <p className="text-sm font-medium text-text">{list.name}</p>
                  <p className="text-xs text-text-secondary">{list.items.length} items</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => navigate('/app/lists')}>
                  View
                </Button>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────
   Barrister: Search
   ────────────────────────────────────────── */
function BarristerSearch({ onboarding, mode, navigate, firstVisit, clearFirstVisit }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ books: [], jade: [] });
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async (q) => {
    if (!q || q.trim().length < 2) {
      setResults({ books: [], jade: [] });
      return;
    }
    setSearching(true);
    if (firstVisit && !hasSearched) {
      setHasSearched(true);
      clearFirstVisit();
    }
    // TODO(api): Replace with GET /api/search?q={query} — unified search endpoint
    const data = await searchAll(q);
    setResults(data);
    setSearching(false);
  }, [firstVisit, hasSearched, clearFirstVisit]);

  useEffect(() => {
    const timer = setTimeout(() => handleSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  const totalResults = results.books.length + results.jade.length;

  return (
    <div>
      <h1 className="font-serif text-3xl text-text">Welcome, {onboarding.name || 'Counsel'}!</h1>
      <p className="mt-2 text-sm text-text-secondary">Search your chambers catalogue and JADE case law.</p>

      {firstVisit && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <Icon name="solar:hand-shake-linear" size={20} className="mt-0.5 shrink-0 text-emerald-600" />
          <div>
            <p className="text-sm font-medium text-emerald-800">
              {mode === 'joined'
                ? `You're connected to ${onboarding.chambersName || 'your chambers'}. Start by searching for a book or case.`
                : "You're in solo mode. Search JADE case law to build authority lists."}
            </p>
          </div>
        </div>
      )}

      {mode === 'solo' && !firstVisit && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-brand/30 bg-brand/10 p-3 text-sm text-brand">
          <span>Solo mode active. Join chambers to unlock shared library syncing.</span>
          <button
            type="button"
            onClick={() => navigate('/onboarding/barrister/lookup')}
            className="ml-3 shrink-0 rounded-full bg-brand px-3 py-1 text-xs font-medium text-white hover:bg-brand-hover"
          >
            Join Chambers
          </button>
        </div>
      )}

      <div className="mt-5 max-w-xl">
        <Input
          autoFocus
          icon="solar:magnifer-linear"
          placeholder='Try: "Cross on Evidence"'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {firstVisit && !query && (
        <div className="mt-5 rounded-xl border border-border bg-slate-50 p-4">
          <p className="mb-3 text-sm font-medium text-text">What can you search?</p>
          <div className="space-y-2">
            {mode === 'joined' && (
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Icon name="solar:book-2-linear" size={14} className="shrink-0 text-brand" />
                <span>Chambers library books and publications</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Icon name="solar:scale-linear" size={14} className="shrink-0 text-emerald-600" />
              <span>JADE case law and legislation</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Icon name="solar:list-check-linear" size={14} className="shrink-0 text-blue-600" />
              <span>Add results to authority lists</span>
            </div>
          </div>
        </div>
      )}

      {searching && <p className="mt-3 text-sm text-text-muted">Searching...</p>}

      {totalResults > 0 && (
        <div className="mt-4">
          <p className="mb-3 text-xs text-text-muted">{totalResults} results across books and case law</p>
          <div className="space-y-2">
            {results.books.map((book) => (
              <article key={book.id} className="rounded-xl border border-border bg-slate-50 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-text">{book.title}</p>
                    <p className="mt-0.5 text-xs text-text-secondary">
                      {book.author} · {book.location} · {book.edition} Edition
                    </p>
                  </div>
                  <Badge variant={book.status === 'available' ? 'status' : 'default'}>
                    {book.status === 'available' ? 'Available' : 'On Loan'}
                  </Badge>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded bg-orange-50 px-1.5 py-0.5 text-[10px] font-medium text-brand">Book</span>
                  <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">
                    {book.practiceArea}
                  </span>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" disabled={book.status !== 'available'}>Request Loan</Button>
                  <Button size="sm" variant="secondary">+ Authority List</Button>
                </div>
              </article>
            ))}

            {results.jade.map((item) => (
              <article key={item.id} className="rounded-xl border border-border bg-slate-50 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-text">{item.title}</p>
                    <p className="mt-0.5 text-xs text-text-secondary">
                      {item.citation} {item.court ? `· ${item.court}` : ''} · {item.year}
                    </p>
                  </div>
                  <Badge variant="info">JADE</Badge>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                      item.type === 'case'
                        ? 'bg-green-50 text-green-600'
                        : 'bg-purple-50 text-purple-600'
                    }`}
                  >
                    {item.type === 'case' ? 'Case Law' : 'Legislation'}
                  </span>
                  {item.tags.map((tag) => (
                    <span key={tag} className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="secondary">+ Authority List</Button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {query.length >= 2 && !searching && totalResults === 0 && (
        <p className="mt-4 text-sm text-text-muted">No results found for "{query}".</p>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────
   Barrister: Authority Lists
   ────────────────────────────────────────── */
function BarristerLists({ firstVisit, navigate }) {
  const [lists, setLists] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!firstVisit) {
      // TODO(api): Replace with GET /api/authority-lists — fetch all user authority lists
      getLists().then(setLists);
    }
  }, [firstVisit]);

  if (firstVisit) {
    return (
      <div>
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-3xl text-text">Authority Lists</h1>
          <Button size="sm" variant="secondary" disabled>
            <Icon name="solar:add-circle-linear" size={16} />
            New List
          </Button>
        </div>
        <p className="mt-2 text-sm text-text-secondary">Manage your case authority lists and export to AGLC PDF.</p>

        <div className="mt-8 flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <Icon name="solar:list-check-linear" size={24} className="text-slate-400" />
          </span>
          <p className="mt-4 text-sm font-medium text-text">No authority lists yet</p>
          <p className="mt-1 text-sm text-text-secondary">Search for cases to start building your first authority list.</p>
          <Button className="mt-4" onClick={() => navigate('/app/search')}>
            <Icon name="solar:magnifer-linear" size={16} />
            Search now
          </Button>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <article key={i} className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 opacity-40">
              <div className="h-3 w-3/4 rounded bg-slate-200" />
              <div className="mt-2 h-2 w-1/2 rounded bg-slate-200" />
              <div className="mt-3 space-y-1.5">
                <div className="h-2 w-full rounded bg-slate-200" />
                <div className="h-2 w-5/6 rounded bg-slate-200" />
              </div>
            </article>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl text-text">Authority Lists</h1>
        <Button size="sm" variant="secondary">
          <Icon name="solar:add-circle-linear" size={16} />
          New List
        </Button>
      </div>
      <p className="mt-2 text-sm text-text-secondary">Manage your case authority lists and export to AGLC PDF.</p>

      {selected ? (
        <div className="mt-5">
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="mb-3 inline-flex items-center gap-1 text-sm text-brand hover:underline"
          >
            <Icon name="solar:arrow-left-linear" size={14} />
            Back to lists
          </button>
          <h2 className="font-serif text-xl text-text">{selected.name}</h2>
          <p className="mt-1 text-xs text-text-secondary">{selected.caseRef}</p>

          <div className="mt-4 space-y-2">
            {selected.items.map((item, idx) => (
              <article
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-border bg-slate-50 p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-text">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="text-sm text-text">{item.title}</p>
                    <p className="text-xs text-text-secondary">
                      {item.citation || item.pageRange || ''}
                      {item.citation && item.pageRange ? ` · ${item.pageRange}` : ''}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                    item.type === 'book'
                      ? 'bg-orange-50 text-brand'
                      : item.type === 'case'
                        ? 'bg-green-50 text-green-600'
                        : 'bg-purple-50 text-purple-600'
                  }`}
                >
                  {item.type === 'book' ? 'Book' : item.type === 'case' ? 'Case' : 'Legislation'}
                </span>
              </article>
            ))}
          </div>

          <div className="mt-4">
            <Button size="sm" variant="secondary">
              <Icon name="solar:document-text-linear" size={16} />
              Export AGLC PDF
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-5 space-y-2">
          {lists.map((list) => (
            <article
              key={list.id}
              className="cursor-pointer rounded-xl border border-border bg-slate-50 p-4 transition-colors hover:bg-slate-100"
              onClick={() => setSelected(list)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-text">{list.name}</p>
                  <p className="text-xs text-text-secondary">{list.caseRef}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted">{list.items.length} items</span>
                  <Icon name="solar:arrow-right-linear" size={14} className="text-text-muted" />
                </div>
              </div>
            </article>
          ))}
          {lists.length === 0 && (
            <p className="text-sm text-text-muted">No authority lists yet. Create one from search results.</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────
   Barrister: Loans
   ────────────────────────────────────────── */
function BarristerLoans({ firstVisit, navigate }) {
  const [tab, setTab] = useState('active');
  const [loans, setLoans] = useState([]);

  useEffect(() => {
    if (!firstVisit) {
      // TODO(api): Replace with GET /api/loans?borrower=me — fetch all of user's loans
      getLoans().then(setLoans);
    }
  }, [firstVisit]);

  const filtered = loans.filter((l) => {
    if (tab === 'active') return l.status === 'active';
    if (tab === 'overdue') return l.status === 'overdue';
    return l.status === 'returned';
  });

  const tabs = [
    { key: 'active', label: 'Active' },
    { key: 'overdue', label: 'Overdue' },
    { key: 'history', label: 'History' },
  ];

  return (
    <div>
      <h1 className="font-serif text-3xl text-text">My Loans</h1>
      <p className="mt-2 text-sm text-text-secondary">Track your borrowed books and loan history.</p>

      <div className="mt-5 flex gap-1 rounded-xl bg-slate-100 p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-white text-text shadow-sm' : 'text-text-secondary hover:text-text'
            }`}
          >
            {t.label}
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
            <article key={loan.id} className="rounded-xl border border-border bg-slate-50 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-text">{loan.bookTitle}</p>
                  <p className="mt-0.5 text-xs text-text-secondary">
                    Borrowed {loan.dateBorrowed}
                    {loan.dueDate ? ` · Due ${loan.dueDate}` : ' · Pending approval'}
                  </p>
                </div>
                <Badge variant={loan.status === 'overdue' ? 'default' : 'status'}>
                  {loan.status}
                </Badge>
              </div>
              {loan.status === 'active' && (
                <div className="mt-3">
                  <Button size="sm" variant="secondary">Return Book</Button>
                </div>
              )}
            </article>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-text-muted">No {tab === 'history' ? 'returned' : tab} loans.</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────
   Clerk: Dashboard
   ────────────────────────────────────────── */
function ClerkDashboard({ onboarding, navigate }) {
  const [loans, setLoans] = useState([]);
  const [books, setBooks] = useState([]);

  useEffect(() => {
    // TODO(api): Replace with GET /api/loans — fetch all loans for dashboard stats
    getLoans().then(setLoans);
    // TODO(api): Replace with GET /api/books — fetch book count for dashboard
    getBooks().then(setBooks);
  }, []);

  const overdue = loans.filter((l) => l.status === 'overdue').length;
  const pending = loans.filter((l) => l.status === 'pending').length;
  const recentActivity = [
    { text: 'Cross on Evidence returned', time: '2h ago', color: 'bg-green-400' },
    { text: 'Heydon on Contract borrowed', time: '5h ago', color: 'bg-amber-400' },
    { text: 'Dal Pont on Lawyers catalogued', time: '1d ago', color: 'bg-blue-400' },
    { text: 'Overdue reminder sent to 3 members', time: '1d ago', color: 'bg-red-400' },
  ];

  return (
    <div>
      <h1 className="font-serif text-3xl text-text">Welcome, {onboarding.name || 'Clerk'}!</h1>
      <p className="mt-2 text-sm text-text-secondary">Your setup is complete. Next actions are available below.</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          ['Overdue', overdue, overdue > 0 ? 'text-red-500' : 'text-text'],
          ['Pending', pending, pending > 0 ? 'text-brand' : 'text-text'],
          ['Books', books.length, 'text-text'],
        ].map(([label, count, color]) => (
          <article key={label} className="rounded-2xl border border-border bg-slate-50 p-4">
            <p className={`text-2xl font-semibold ${color}`}>{count}</p>
            <p className="text-sm text-text-secondary">{label}</p>
          </article>
        ))}
      </div>

      <div className="mt-5 space-y-2 text-sm text-text-secondary">
        <p>
          <Icon name="solar:check-circle-linear" size={14} className="mr-1 text-green-500" />
          {onboarding.locations.filter((item) => item.name.trim()).length || 0} locations synced
        </p>
        <p>
          <Icon name="solar:check-circle-linear" size={14} className="mr-1 text-green-500" />
          Invite workflow ready
        </p>
      </div>

      <h2 className="mt-6 mb-3 font-serif text-lg text-text">Recent Activity</h2>
      <div className="space-y-2">
        {recentActivity.map((item) => (
          <div key={item.text} className="flex items-center gap-2 text-sm">
            <span className={`h-2 w-2 shrink-0 rounded-full ${item.color}`} />
            <span className="text-text-secondary">{item.text}</span>
            <span className="ml-auto text-xs text-text-muted">{item.time}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button variant="clerk" onClick={() => navigate('/app/catalogue')}>Scan ISBN</Button>
        <Button variant="secondary" onClick={() => navigate('/app/catalogue')}>Import CSV</Button>
        <Button variant="secondary" onClick={() => navigate('/app/members')}>Invite Members</Button>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   Clerk: Catalogue
   ────────────────────────────────────────── */
function ClerkCatalogue() {
  const [books, setBooks] = useState([]);
  const [sortBy, setSortBy] = useState('title');

  useEffect(() => {
    // TODO(api): Replace with GET /api/books?sort={sortBy} — fetch sorted catalogue
    getBooks().then(setBooks);
  }, []);

  const sorted = [...books].sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'author') return a.author.localeCompare(b.author);
    if (sortBy === 'status') return a.status.localeCompare(b.status);
    return 0;
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl text-text">Catalogue</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="clerk">
            <Icon name="solar:add-circle-linear" size={16} />
            Add Book
          </Button>
          <Button size="sm" variant="secondary">Import CSV</Button>
        </div>
      </div>
      <p className="mt-2 text-sm text-text-secondary">Manage your chambers library catalogue.</p>

      <div className="mt-4 flex gap-2">
        {['title', 'author', 'status'].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSortBy(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              sortBy === s ? 'bg-slate-200 text-text' : 'text-text-secondary hover:bg-slate-100'
            }`}
          >
            Sort by {s}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-text-secondary">
              <th className="pb-2 font-medium">Title</th>
              <th className="pb-2 font-medium">Author</th>
              <th className="pb-2 font-medium">Location</th>
              <th className="pb-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((book) => (
              <tr key={book.id} className="border-b border-border/50">
                <td className="py-3 font-medium text-text">{book.title}</td>
                <td className="py-3 text-text-secondary">{book.author}</td>
                <td className="py-3 text-text-secondary">{book.location}</td>
                <td className="py-3">
                  <Badge variant={book.status === 'available' ? 'status' : 'default'}>
                    {book.status === 'available' ? 'Available' : 'On Loan'}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   Clerk: Loans Management
   ────────────────────────────────────────── */
function ClerkLoans() {
  const [loans, setLoans] = useState([]);

  useEffect(() => {
    // TODO(api): Replace with GET /api/loans — fetch all loans for clerk management
    getLoans().then(setLoans);
  }, []);

  const pending = loans.filter((l) => l.status === 'pending');
  const overdue = loans.filter((l) => l.status === 'overdue');
  const active = loans.filter((l) => l.status === 'active');

  const handleApprove = async (id) => {
    // TODO(api): Replace with PATCH /api/loans/:id/approve — approve pending loan
    await approveLoan(id);
    const updated = await getLoans();
    setLoans(updated);
  };

  return (
    <div>
      <h1 className="font-serif text-3xl text-text">Loan Management</h1>
      <p className="mt-2 text-sm text-text-secondary">Approve requests and track overdue items.</p>

      {pending.length > 0 && (
        <div className="mt-5">
          <h2 className="mb-3 font-serif text-lg text-text">Pending Requests ({pending.length})</h2>
          <div className="space-y-2">
            {pending.map((loan) => (
              <article key={loan.id} className="rounded-xl border border-border bg-slate-50 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-text">{loan.bookTitle}</p>
                    <p className="mt-0.5 text-xs text-text-secondary">
                      Requested by {loan.borrower} · {loan.dateBorrowed}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="clerk" onClick={() => handleApprove(loan.id)}>Approve</Button>
                    <Button size="sm" variant="danger">Deny</Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {overdue.length > 0 && (
        <div className="mt-5">
          <h2 className="mb-3 font-serif text-lg text-text">Overdue ({overdue.length})</h2>
          <div className="space-y-2">
            {overdue.map((loan) => (
              <article key={loan.id} className="rounded-xl border border-red-200 bg-red-50 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-text">{loan.bookTitle}</p>
                    <p className="mt-0.5 text-xs text-text-secondary">
                      {loan.borrower} · Due {loan.dueDate}
                    </p>
                  </div>
                  <Button size="sm" variant="secondary">Send Reminder</Button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5">
        <h2 className="mb-3 font-serif text-lg text-text">Active Loans ({active.length})</h2>
        <div className="space-y-2">
          {active.map((loan) => (
            <article key={loan.id} className="rounded-xl border border-border bg-slate-50 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-text">{loan.bookTitle}</p>
                  <p className="mt-0.5 text-xs text-text-secondary">
                    {loan.borrower} · Due {loan.dueDate}
                  </p>
                </div>
                <Badge variant="status">Active</Badge>
              </div>
            </article>
          ))}
          {active.length === 0 && <p className="text-sm text-text-muted">No active loans.</p>}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   Clerk: Members
   ────────────────────────────────────────── */
function ClerkMembers() {
  const [members, setMembers] = useState([]);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('barrister');

  useEffect(() => {
    // TODO(api): Replace with GET /api/members — fetch all members
    getMembers().then(setMembers);
  }, []);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    // TODO(api): Replace with POST /api/members/invite — send invite
    await inviteMember(inviteEmail, inviteRole);
    const updated = await getMembers();
    setMembers(updated);
    setInviteEmail('');
    setShowInvite(false);
  };

  const barristers = members.filter((m) => m.role === 'barrister');
  const clerks = members.filter((m) => m.role === 'clerk');

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl text-text">Members</h1>
        <Button size="sm" variant="clerk" onClick={() => setShowInvite(!showInvite)}>
          <Icon name="solar:user-plus-linear" size={16} />
          Invite
        </Button>
      </div>
      <p className="mt-2 text-sm text-text-secondary">Manage chambers members and send invitations.</p>

      {showInvite && (
        <div className="mt-4 rounded-xl border border-border bg-slate-50 p-4">
          <h3 className="mb-3 text-sm font-medium text-text">Invite New Member</h3>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="email@chambers.com.au"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="rounded-xl border border-border bg-white px-3 text-sm"
            >
              <option value="barrister">Barrister</option>
              <option value="clerk">Clerk</option>
            </select>
            <Button size="sm" variant="clerk" onClick={handleInvite}>Send</Button>
          </div>
        </div>
      )}

      <div className="mt-5">
        <h2 className="mb-3 font-serif text-lg text-text">Barristers ({barristers.length})</h2>
        <div className="space-y-2">
          {barristers.map((m) => (
            <article key={m.id} className="flex items-center gap-3 rounded-xl border border-border bg-slate-50 p-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand">
                {m.initials}
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-text">{m.name}</p>
                <p className="text-xs text-text-secondary">{m.email}</p>
              </div>
              <Badge variant="role">Barrister</Badge>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <h2 className="mb-3 font-serif text-lg text-text">Clerks ({clerks.length})</h2>
        <div className="space-y-2">
          {clerks.map((m) => (
            <article key={m.id} className="flex items-center gap-3 rounded-xl border border-border bg-slate-50 p-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-text">
                {m.initials}
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-text">{m.name}</p>
                <p className="text-xs text-text-secondary">{m.email}</p>
              </div>
              <Badge variant="role">Clerk</Badge>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   Clerk: Locations
   ────────────────────────────────────────── */
function ClerkLocations({ onboarding }) {
  const locations = onboarding.locations.filter((l) => l.name.trim());

  return (
    <div>
      <h1 className="font-serif text-3xl text-text">Locations</h1>
      <p className="mt-2 text-sm text-text-secondary">Manage your chambers library locations.</p>

      <div className="mt-5 space-y-2">
        {locations.map((loc, idx) => (
          <article key={idx} className="flex items-center justify-between rounded-xl border border-border bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <Icon name="solar:map-point-linear" size={20} className="text-text-secondary" />
              <div>
                <p className="text-sm font-medium text-text">{loc.name}</p>
                <p className="text-xs text-text-secondary">Floor {loc.floor || 'N/A'}</p>
              </div>
            </div>
            <Button size="sm" variant="ghost">Edit</Button>
          </article>
        ))}
        {locations.length === 0 && (
          <p className="text-sm text-text-muted">No locations configured. Add locations in onboarding setup.</p>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   Clerk: Reports (Placeholder)
   ────────────────────────────────────────── */
function ClerkReports() {
  return (
    <div>
      <h1 className="font-serif text-3xl text-text">Reports</h1>
      <p className="mt-2 text-sm text-text-secondary">Library usage statistics and analytics.</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {[
          ['Most Borrowed', 'Cross on Evidence (12 loans)'],
          ['Avg. Loan Duration', '11 days'],
          ['Active Members', '6 of 8'],
          ['Overdue Rate', '8%'],
        ].map(([label, value]) => (
          <article key={label} className="rounded-2xl border border-border bg-slate-50 p-4">
            <p className="text-lg font-semibold text-text">{value}</p>
            <p className="text-sm text-text-secondary">{label}</p>
          </article>
        ))}
      </div>

      <p className="mt-5 text-xs text-text-muted">Full reporting will be available after API integration.</p>
    </div>
  );
}

/* ──────────────────────────────────────────
   Settings (Both roles)
   ────────────────────────────────────────── */
function SettingsSection() {
  return (
    <div>
      <h1 className="font-serif text-3xl text-text">Settings</h1>
      <p className="mt-2 text-sm text-text-secondary">Account and application preferences.</p>

      <div className="mt-5 space-y-4">
        {['Profile', 'Notifications', 'Display', 'Security'].map((section) => (
          <article key={section} className="rounded-xl border border-border bg-slate-50 p-4">
            <p className="text-sm font-medium text-text">{section}</p>
            <p className="mt-1 text-xs text-text-muted">Configuration coming soon.</p>
          </article>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   Main AppPage
   ────────────────────────────────────────── */
export default function AppPage() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const { role, setRole, onboarding, clearFirstVisit, markCelebrationShown } = useAppContext();
  const firstVisit = onboarding.firstVisit !== false;
  const celebrationShown = onboarding.celebrationShown === true;

  const roleParam = searchParams.get('role');
  const mode = searchParams.get('mode') || onboarding.mode || 'joined';
  const section = params.section || (role === 'clerk' ? 'dashboard' : 'search');

  useEffect(() => {
    if (roleParam === 'barrister' || roleParam === 'clerk') {
      setRole(roleParam);
    }
  }, [roleParam, setRole]);

  useEffect(() => {
    if (!firstVisit || celebrationShown) {
      return undefined;
    }

    markCelebrationShown();

    const shoot = () => {
      confetti({
        particleCount: 44,
        spread: 145,
        startVelocity: 56,
        gravity: 0.95,
        scalar: 1.12,
        origin: { x: 0.5, y: 0.56 },
      });
      confetti({
        particleCount: 34,
        angle: 70,
        spread: 95,
        startVelocity: 58,
        gravity: 1,
        scalar: 1.08,
        origin: { x: 0.42, y: 0.62 },
      });
      confetti({
        particleCount: 34,
        angle: 110,
        spread: 95,
        startVelocity: 58,
        gravity: 1,
        scalar: 1.08,
        origin: { x: 0.58, y: 0.62 },
      });
      confetti({
        particleCount: 26,
        spread: 360,
        startVelocity: 40,
        ticks: 170,
        scalar: 1.02,
        origin: { x: 0.5, y: 0.54 },
      });
    };

    shoot();
    const intervalId = window.setInterval(shoot, 140);
    const stopId = window.setTimeout(() => window.clearInterval(intervalId), 1800);

    return () => {
      window.clearTimeout(stopId);
      window.clearInterval(intervalId);
    };
  }, [celebrationShown, firstVisit, markCelebrationShown]);

  const activeRole = roleParam === 'barrister' || roleParam === 'clerk' ? roleParam : role;

  const renderSection = () => {
    if (activeRole === 'barrister') {
      switch (section) {
        case 'dashboard':
          return <BarristerDashboard onboarding={onboarding} navigate={navigate} firstVisit={firstVisit} />;
        case 'search':
          return <BarristerSearch onboarding={onboarding} mode={mode} navigate={navigate} firstVisit={firstVisit} clearFirstVisit={clearFirstVisit} />;
        case 'lists':
          return <BarristerLists firstVisit={firstVisit} navigate={navigate} />;
        case 'loans':
          return <BarristerLoans firstVisit={firstVisit} navigate={navigate} />;
        case 'settings':
          return <SettingsSection />;
        default:
          return <BarristerSearch onboarding={onboarding} mode={mode} navigate={navigate} firstVisit={firstVisit} clearFirstVisit={clearFirstVisit} />;
      }
    }

    switch (section) {
      case 'dashboard':
        return <ClerkDashboard onboarding={onboarding} navigate={navigate} />;
      case 'catalogue':
        return <ClerkCatalogue />;
      case 'loans':
        return <ClerkLoans />;
      case 'members':
        return <ClerkMembers />;
      case 'locations':
        return <ClerkLocations onboarding={onboarding} />;
      case 'reports':
        return <ClerkReports />;
      case 'settings':
        return <SettingsSection />;
      default:
        return <ClerkDashboard onboarding={onboarding} navigate={navigate} />;
    }
  };

  return (
    <AppShell role={activeRole}>
      {renderSection()}
    </AppShell>
  );
}
