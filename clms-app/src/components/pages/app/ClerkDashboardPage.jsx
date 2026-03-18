import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../atoms/Icon';
import Button from '../../atoms/Button';
import { useAppContext } from '../../../context/AppContext';
import { useToast } from '../../../context/ToastContext';
import { getLoans } from '../../../services/loansService';
import { getBooks } from '../../../services/booksService';
import { getLists } from '../../../services/authorityListsService';
import { getQueue, dismissQueueItem } from '../../../services/uncataloguedQueueService';

function isEnriched(book) {
  return book.enrichment && Object.values(book.enrichment).some((v) => v && (Array.isArray(v) ? v.length > 0 : true));
}

export default function ClerkDashboardPage() {
  const navigate = useNavigate();
  const { onboarding } = useAppContext();
  const { addToast } = useToast();
  const firstVisit = onboarding.firstVisit !== false;
  const firstName = onboarding.name?.trim().split(/\s+/)[0] || 'Clerk';

  const [loans, setLoans] = useState([]);
  const [books, setBooks] = useState([]);
  const [lists, setLists] = useState([]);
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    // TODO(api): Replace with GET /api/loans - fetch all chambers loans for dashboard
    getLoans().then(setLoans);
    // TODO(api): Replace with GET /api/books - fetch catalogue for coverage and recent activity
    getBooks().then(setBooks);
    // TODO(api): Replace with GET /api/authority-lists - fetch authority lists for activity
    getLists().then(setLists);
    getQueue().then(setQueue);
  }, []);

  const pendingLoans = useMemo(() => loans.filter((l) => l.status === 'pending'), [loans]);
  const overdueLoans = useMemo(() => loans.filter((l) => l.status === 'overdue'), [loans]);
  const activeLoans = useMemo(() => loans.filter((l) => l.status === 'active'), [loans]);

  const enrichedCount = useMemo(() => books.filter(isEnriched).length, [books]);
  const unenrichedCount = books.length - enrichedCount;
  const enrichedPct = books.length > 0 ? Math.round((enrichedCount / books.length) * 100) : 0;

  // Metadata gap analysis
  const missingSubject = useMemo(() => books.filter((b) => !b.enrichment?.subject).length, [books]);
  const missingJurisdiction = useMemo(() => books.filter((b) => !b.enrichment?.jurisdiction?.length).length, [books]);
  const missingResourceType = useMemo(() => books.filter((b) => !b.enrichment?.resourceType).length, [books]);

  const totalListItems = lists.reduce((sum, l) => sum + l.items.length, 0);
  const pendingQueue = useMemo(() => queue.filter((entry) => entry.status === 'pending'), [queue]);

  const locationCount = onboarding.locations.filter((l) => l.name.trim()).length;
  const inviteCount = onboarding.invites.filter((i) => i.email.trim()).length;
  const dashboardMetrics = [
    {
      label: 'Books in Catalogue',
      value: books.length,
      detail: `${enrichedCount} enriched`,
      icon: 'solar:book-2-linear',
      iconBg: books.length > 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500',
    },
    {
      label: 'Pending Requests',
      value: pendingLoans.length,
      detail: pendingLoans.length > 0 ? 'Needs review today' : 'All clear',
      icon: 'solar:inbox-linear',
      iconBg: pendingLoans.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-600',
    },
    {
      label: 'Overdue Books',
      value: overdueLoans.length,
      detail: overdueLoans.length > 0 ? 'Follow-up required' : 'No overdue items',
      icon: 'solar:danger-triangle-linear',
      iconBg: overdueLoans.length > 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-600',
    },
    {
      label: 'Catalogue Coverage',
      value: `${enrichedPct}%`,
      detail: `${locationCount} locations live`,
      icon: 'solar:chart-2-linear',
      iconBg: enrichedPct >= 80 ? 'bg-emerald-100 text-emerald-600' : enrichedPct >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700',
    },
  ];
  return (
    <div className="animate-page-in">
      <section className="relative flex min-h-[252px] flex-col justify-center rounded-b-[40px] px-1 pb-24 pt-8 text-white md:min-h-[276px] md:px-0 md:pb-28 md:pt-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <h1 className="font-serif text-4xl leading-none tracking-tight md:text-5xl">Hi, {firstName}.</h1>
            <p
              className="mt-3 max-w-[30ch] font-serif text-xl leading-tight text-white/84 md:max-w-[32ch] md:text-2xl"
              style={{ textWrap: 'balance' }}
            >
              Manage catalogue health, requests, and chambers operations in one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate('/app/catalogue')}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/18"
            >
              <Icon name="solar:add-circle-linear" size={16} />
              Add Book
            </button>
            <button
              type="button"
              onClick={() => navigate('/app/catalogue')}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 transition-colors hover:bg-white/90"
            >
              <Icon name="solar:upload-linear" size={16} />
              Import CSV
            </button>
          </div>
        </div>

        {firstVisit && (
          <div className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-emerald-200/30 bg-emerald-400/12 px-4 py-3 text-sm text-white/90 backdrop-blur">
            <Icon name="solar:check-circle-bold" size={16} className="text-emerald-200" />
            <div>
              <p className="font-medium">Setup synced</p>
              <p className="text-xs text-white/70">
                {locationCount} locations live. {inviteCount} invites ready.
              </p>
            </div>
          </div>
        )}

        <div className="relative mt-6 max-w-2xl md:hidden">
          <Icon
            name="solar:magnifer-linear"
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-white/90 drop-shadow-[0_1px_1px_rgba(0,0,0,0.08)]"
          />
          <input
            type="text"
            placeholder="Search catalogue, ISBNs, borrowers, locations..."
            onFocus={() => navigate('/app/catalogue')}
            className="relative z-0 w-full rounded-[24px] border border-white/18 bg-white/12 py-4 pl-12 pr-4 text-sm text-white placeholder:text-white/65 shadow-[0_18px_40px_rgba(124,45,18,0.18)] backdrop-blur outline-none transition-colors focus:border-white/28 focus:bg-white/16"
          />
        </div>

      </section>

      <div className="relative z-[1] -mt-[80px] md:-mt-[84px]">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {dashboardMetrics.map((metric) => (
            <article
              key={metric.label}
              className="min-h-[160px] rounded-[28px] border border-white/35 bg-[linear-gradient(180deg,rgba(255,255,255,0.26),rgba(255,255,255,0.84))] p-4 shadow-[0_20px_50px_rgba(124,45,18,0.18)] backdrop-blur-xl"
            >
              <div className="flex items-center justify-between gap-3">
                <span className={`flex h-11 w-11 items-center justify-center rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] ${metric.iconBg}`}>
                  <Icon name={metric.icon} size={18} />
                </span>
                <p className="text-3xl font-semibold leading-none text-slate-950">{metric.value}</p>
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{metric.label}</p>
              <p className="mt-1 text-sm text-slate-600">{metric.detail}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="mb-5 mt-8 flex items-center justify-between gap-3 md:mt-10">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">Overview</p>
          <p className="mt-1 text-sm text-text-secondary">Catalogue quality, requests, and authority support.</p>
        </div>
      </div>

      {/* Value chain — Catalogue → Search → Authorities */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* PRIMARY — Catalogue Health (the core clerk job) */}
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-section-title text-text">Catalogue Health</h2>
              <p className="mt-1 text-xs text-text-secondary">
                Better metadata improves search and authority lists.
              </p>
            </div>
            <Button size="sm" variant="primary" onClick={() => navigate('/app/catalogue')}>
              Enrich Now
            </Button>
          </div>

          {/* Enrichment progress */}
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

          {/* Missing metadata breakdown */}
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {[
              { label: 'Missing subject', count: missingSubject, icon: 'solar:tag-linear' },
              { label: 'Missing jurisdiction', count: missingJurisdiction, icon: 'solar:flag-linear' },
              { label: 'Missing resource type', count: missingResourceType, icon: 'solar:document-text-linear' },
            ].map((gap) => (
              <button
                key={gap.label}
                type="button"
                onClick={() => navigate('/app/catalogue')}
                className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-white px-3 py-2.5 text-left transition-colors hover:bg-slate-50"
              >
                <Icon name={gap.icon} size={16} className={gap.count > 0 ? 'text-amber-500' : 'text-emerald-500'} />
                <div>
                  <p className="text-sm font-semibold text-text">{gap.count}</p>
                  <p className="text-[11px] text-text-muted">{gap.label}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Unenriched books preview */}
          {unenrichedCount > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-text-secondary">Next to enrich</p>
              <div className="space-y-1.5">
                {books.filter((b) => !isEnriched(b)).slice(0, 3).map((book) => (
                  <button
                    key={book.id}
                    type="button"
                    onClick={() => navigate('/app/catalogue')}
                    className="flex w-full items-center justify-between rounded-lg border border-border/50 px-3 py-2 text-left transition-colors hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm text-text">{book.title}</p>
                      <p className="text-[11px] text-text-muted">{book.author}</p>
                    </div>
                    <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-text-muted">ISBN Only</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* SIDEBAR — Workflow status */}
        <div className="space-y-4">
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-serif text-card-title text-text">Uncatalogued Books</h2>
                <p className="mt-1 text-xs text-text-secondary">Barrister-added titles waiting for triage.</p>
              </div>
              <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">
                {pendingQueue.length}
              </span>
            </div>

            {pendingQueue.length > 0 ? (
              <div className="mt-3 space-y-2">
                {pendingQueue.slice(0, 3).map((entry) => (
                  <article key={entry.id} className="rounded-xl border border-border/70 bg-slate-50/40 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-text">{entry.title}</p>
                        <p className="mt-0.5 text-[11px] text-text-muted">
                          Added by {entry.addedBy} · {new Date(entry.addedAt).toLocaleDateString('en-AU')}
                        </p>
                      </div>
                      <Icon name="solar:document-text-linear" size={16} className="shrink-0 text-brand" />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => navigate(`/app/catalogue?action=add&queueId=${entry.id}`)}
                      >
                        Add to Catalogue
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => navigate(`/app/catalogue?action=link&queueId=${entry.id}&q=${encodeURIComponent(entry.title)}`)}
                      >
                        Link to Existing
                      </Button>
                      <button
                        type="button"
                        onClick={async () => {
                          await dismissQueueItem(entry.id);
                          setQueue((prev) => prev.filter((item) => item.id !== entry.id));
                          addToast({ message: 'Queue item dismissed', type: 'success' });
                        }}
                        className="inline-flex items-center rounded-full px-2.5 py-1.5 text-xs font-medium text-text-muted transition-colors hover:bg-slate-100 hover:text-text"
                      >
                        Dismiss
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-3 rounded-xl border border-dashed border-border bg-slate-50/40 px-3 py-4 text-sm text-text-muted">
                No uncatalogued books waiting.
              </div>
            )}
          </section>

          {/* Pending requests */}
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-card-title text-text">Pending Requests</h2>
              <button
                type="button"
                onClick={() => navigate('/app/loans')}
                className="text-xs font-medium text-brand hover:text-brand-hover"
              >
                View all
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {pendingLoans.slice(0, 3).map((loan) => (
                <button
                  key={loan.id}
                  type="button"
                  onClick={() => navigate('/app/loans')}
                  className="w-full rounded-xl border border-border/70 bg-slate-50/40 px-3 py-2.5 text-left transition-colors hover:bg-slate-100"
                >
                  <p className="truncate text-sm font-medium text-text">{loan.bookTitle}</p>
                  <p className="mt-0.5 text-xs text-text-secondary">by {loan.borrower}</p>
                </button>
              ))}
              {pendingLoans.length === 0 && (
                <p className="rounded-xl border border-dashed border-border p-3 text-sm text-text-muted">
                  No pending requests. Focus on enrichment.
                </p>
              )}
            </div>
          </section>

          {/* Authority activity — connects clerk work to barrister output */}
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
            <p className="mt-1 text-xs text-text-secondary">
              {lists.length} lists, {totalListItems} entries in progress.
            </p>
            <div className="mt-3 space-y-2">
              {lists.slice(0, 3).map((list) => (
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

          {/* Loan snapshot */}
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="font-serif text-card-title text-text">Loan Snapshot</h2>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between text-text-secondary">
                <span>Active</span>
                <span className="font-medium text-text">{activeLoans.length}</span>
              </div>
              <div className="flex items-center justify-between text-text-secondary">
                <span>Pending</span>
                <span className="font-medium text-text">{pendingLoans.length}</span>
              </div>
              <div className="flex items-center justify-between text-text-secondary">
                <span>Overdue</span>
                <span className="font-medium text-text">{overdueLoans.length}</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
