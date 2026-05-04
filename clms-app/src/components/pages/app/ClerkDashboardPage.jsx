import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../atoms/Icon';
import Button from '../../atoms/Button';
import Skeleton from '../../atoms/Skeleton';
import ContentLoader from '../../atoms/ContentLoader';
import MetricGrid from '../../molecules/MetricGrid';
import SummaryCard from '../../molecules/SummaryCard';
import DashboardHero from '../../organisms/DashboardHero';
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
  const firstName = onboarding.name?.trim().split(/\s+/)[0] || 'Clerk';

  const [loading, setLoading] = useState(true);
  const [loans, setLoans] = useState([]);
  const [books, setBooks] = useState([]);
  const [lists, setLists] = useState([]);
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    const min = new Promise((r) => setTimeout(r, 400));
    // TODO(api): Replace with real API calls - GET /api/loans, /api/books, /api/authority-lists, /api/queue
    Promise.all([getLoans(), getBooks(), getLists(), getQueue(), min]).then(([l, b, li, q]) => {
      setLoans(l);
      setBooks(b);
      setLists(li);
      setQueue(q);
      setLoading(false);
    });
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
  const dashboardMetrics = [
    {
      label: 'Books in Catalogue',
      value: books.length,
      detail: `${enrichedCount} enriched`,
      icon: 'solar:book-2-linear',
      to: '/app/catalogue',
      iconBg: books.length > 0 ? 'info' : 'neutral',
    },
    {
      label: 'Pending Requests',
      value: pendingLoans.length,
      detail: pendingLoans.length > 0 ? 'Needs review today' : 'All clear',
      icon: 'solar:inbox-linear',
      to: '/app/loans',
      iconBg: pendingLoans.length > 0 ? 'amber' : 'emerald',
    },
    {
      label: 'Overdue Books',
      value: overdueLoans.length,
      detail: overdueLoans.length > 0 ? 'Follow-up required' : 'No overdue items',
      icon: 'solar:danger-triangle-linear',
      to: '/app/loans',
      iconBg: overdueLoans.length > 0 ? 'red' : 'emerald',
    },
    {
      label: 'Catalogue Coverage',
      value: `${enrichedPct}%`,
      detail: `${locationCount} locations live`,
      icon: 'solar:chart-2-linear',
      to: '/app/catalogue',
      iconBg: enrichedPct >= 80 ? 'emerald' : enrichedPct >= 50 ? 'amber' : 'red',
    },
  ];

  const loanSnapshotRows = [
    { label: 'Active', value: activeLoans.length, icon: 'solar:book-bookmark-linear', tone: 'emerald' },
    { label: 'Pending', value: pendingLoans.length, icon: 'solar:hourglass-linear', tone: 'amber' },
    { label: 'Overdue', value: overdueLoans.length, icon: 'solar:alarm-linear', tone: 'red' },
  ];

  return (
    <div className="animate-page-in">
      <DashboardHero
        greeting={`Hi, ${firstName}.`}
        loading={loading}
        subtitle="Manage catalogue health, requests, and chambers operations in one place."
      />

      <div className="relative z-[1] -mt-[56px] md:-mt-[60px]">
        <MetricGrid metrics={dashboardMetrics} loading={loading} />
      </div>

      {/* Overview label */}
      <div className="mb-5 mt-8 flex items-center justify-between gap-3 md:mt-10">
        <div>
          <ContentLoader
            loading={loading}
            skeleton={
              <>
                <Skeleton className="h-3 w-16 rounded" />
                <Skeleton className="mt-2 h-4 w-64 rounded" />
              </>
            }
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">Overview</p>
            <p className="mt-1 text-sm text-text-secondary">Catalogue quality, requests, and authority support.</p>
          </ContentLoader>
        </div>
      </div>

      {/* Value chain — Catalogue → Search → Authorities */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* PRIMARY — Catalogue Health (the core clerk job) */}
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 lg:col-span-2">
          <ContentLoader
            loading={loading}
            skeleton={
              <>
                <Skeleton className="h-5 w-36 rounded-lg" />
                <Skeleton className="mt-2 h-3 w-56 rounded" />
                <div className="mt-4 rounded-xl border border-border/70 bg-slate-50/40 p-4">
                  <Skeleton className="h-4 w-48 rounded" />
                  <Skeleton className="mt-3 h-2 w-full rounded-full" />
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {[0, 1, 2].map((j) => (
                    <Skeleton key={j} className="h-14 w-full rounded-xl" />
                  ))}
                </div>
              </>
            }
          >
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
          </ContentLoader>
        </section>

        {/* SIDEBAR — Workflow status */}
        <div className="space-y-4">
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <ContentLoader
              loading={loading}
              skeleton={
                <>
                  <Skeleton className="h-5 w-36 rounded-lg" />
                  <div className="mt-3 space-y-2">
                    {[0, 1, 2].map((j) => <Skeleton key={j} className="h-10 w-full rounded-xl" />)}
                  </div>
                </>
              }
            >
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
            </ContentLoader>
          </section>

          {/* Pending requests */}
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <ContentLoader
              loading={loading}
              skeleton={
                <>
                  <Skeleton className="h-5 w-36 rounded-lg" />
                  <div className="mt-3 space-y-2">
                    {[0, 1, 2].map((j) => <Skeleton key={j} className="h-10 w-full rounded-xl" />)}
                  </div>
                </>
              }
            >
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
            </ContentLoader>
          </section>

          {/* Authority activity — connects clerk work to barrister output */}
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <ContentLoader
              loading={loading}
              skeleton={
                <>
                  <Skeleton className="h-5 w-36 rounded-lg" />
                  <div className="mt-3 space-y-2">
                    {[0, 1, 2].map((j) => <Skeleton key={j} className="h-10 w-full rounded-xl" />)}
                  </div>
                </>
              }
            >
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
            </ContentLoader>
          </section>

          <SummaryCard title="Loan Snapshot" rows={loanSnapshotRows} loading={loading} />
        </div>
      </div>
    </div>
  );
}
