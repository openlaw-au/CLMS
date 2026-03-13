import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../atoms/Icon';
import Button from '../../atoms/Button';
import { useAppContext } from '../../../context/AppContext';
import { getLoans } from '../../../services/loansService';
import { getLists } from '../../../services/authorityListsService';
import { lookupBookByTitle, getBorrowerName } from '../../../utils/bookLookup';

export default function BarristerDashboardPage() {
  const navigate = useNavigate();
  const { onboarding } = useAppContext();
  const isSolo = onboarding.mode === 'solo';
  const firstName = onboarding.name?.trim().split(/\s+/)[0] || 'Counsel';

  const [loans, setLoans] = useState([]);
  const [lists, setLists] = useState([]);
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());
  const [alertsCollapsed, setAlertsCollapsed] = useState(false);

  // Dashboard search — navigates to authorities search page
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  const handleDashboardSearch = () => {
    const q = searchQuery.trim();
    if (!q) return;
    navigate(`/app/authorities?q=${encodeURIComponent(q)}`);
  };

  useEffect(() => {
    // TODO(api): Replace with GET /api/loans?borrower=me - fetch all borrower loans
    getLoans().then(setLoans);
    // TODO(api): Replace with GET /api/authority-lists - fetch authority lists for current barrister
    getLists().then(setLists);
  }, []);


  const activeLoans = useMemo(() => loans.filter((loan) => loan.status === 'active'), [loans]);
  const dueSoon = useMemo(
    () =>
      activeLoans.filter((loan) => {
        if (!loan.dueDate) return false;
        const diff = new Date(loan.dueDate) - new Date();
        return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
      }),
    [activeLoans],
  );

  const totalListItems = lists.reduce((sum, l) => sum + l.items.length, 0);
  const exportReadyCount = useMemo(
    () => lists.filter((list) => list.items.length > 0 && list.items.filter((i) => i.usage === 'read').every((i) => i.pageRange)).length,
    [lists],
  );

  // Actionable alerts
  const alerts = useMemo(() => {
    const result = [];
    lists.forEach((list) => {
      const missingPinpoints = list.items.filter((i) => i.usage === 'read' && !i.pageRange);
      if (missingPinpoints.length > 0) {
        result.push({
          id: `pinpoint-${list.id}`,
          icon: 'solar:pin-bold',
          message: `${missingPinpoints.length} missing ${missingPinpoints.length === 1 ? 'pinpoint' : 'pinpoints'} in "${list.name}"`,
          to: `/app/authorities?listId=${list.id}`,
        });
      }
      list.items.forEach((item) => {
        if (item.type !== 'book' || item.uncatalogued) return;
        const book = lookupBookByTitle(item.title);
        if (book && book.status === 'on-loan') {
          const borrower = getBorrowerName(book.borrower);
          result.push({
            id: `onloan-${list.id}-${item.id}`,
            icon: 'solar:book-2-linear',
            message: `"${item.title}" is on loan${borrower ? ` to ${borrower}` : ''}${book.dueDate ? `, due ${book.dueDate}` : ''}`,
            to: `/app/authorities?listId=${list.id}`,
          });
        }
      });
    });
    return result;
  }, [lists]);

  const visibleAlerts = alerts.filter((a) => !dismissedAlerts.has(a.id));

  const dashboardMetrics = [
    {
      label: 'Active Loans',
      value: activeLoans.length,
      detail: `${dueSoon.length} due soon`,
      icon: 'solar:notebook-bookmark-linear',
      to: '/app/loans',
      iconBg: activeLoans.length > 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500',
    },
    {
      label: 'Research Blockers',
      value: visibleAlerts.length,
      detail: visibleAlerts.length > 0 ? 'Pinpoints or loan blockers' : 'No active blockers',
      icon: 'solar:danger-triangle-linear',
      to: '/app/authorities',
      iconBg: visibleAlerts.length > 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-600',
    },
    {
      label: 'Authority Lists',
      value: lists.length,
      detail: `${totalListItems} entries in progress`,
      icon: 'solar:list-check-linear',
      to: '/app/authorities',
      iconBg: lists.length > 0 ? 'bg-orange-100 text-orange-700' : 'bg-slate-200 text-slate-500',
    },
    {
      label: 'Export Ready',
      value: exportReadyCount,
      detail: exportReadyCount > 0 ? 'Ready for court export' : 'Add pinpoints to finish',
      icon: 'solar:file-download-linear',
      to: '/app/authorities',
      iconBg: exportReadyCount > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-700',
    },
  ];

  return (
    <div className="animate-page-in">
      <section className="relative flex min-h-[240px] flex-col justify-center rounded-b-[40px] px-1 pb-24 pt-8 text-white md:min-h-[260px] md:px-0 md:pb-28 md:pt-10">
        <div className="max-w-3xl">
          <h1 className="font-serif text-4xl leading-none tracking-tight md:text-5xl">Hi, {firstName}.</h1>
          <p
            className="mt-3 max-w-[30ch] font-serif text-xl leading-tight text-white/84 md:max-w-[32ch] md:text-2xl"
            style={{ textWrap: 'balance' }}
          >
            Search authorities, organise your research, and export court-ready citations.
          </p>
        </div>

        {isSolo && (
          <div className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-white/18 bg-white/12 px-4 py-3 text-sm text-white/90 backdrop-blur">
            <Icon name="solar:buildings-2-linear" size={16} className="text-white/85" />
            <div>
              <p className="font-medium">You are in solo mode</p>
              <p className="text-xs text-white/70">Join chambers to unlock shared catalogue and loan workflow.</p>
            </div>
            <Button size="sm" variant="secondary" className="!border-white/20 !bg-white !text-slate-900 hover:!bg-white/90" onClick={() => navigate('/onboarding/barrister/lookup')}>
              Join Chambers
            </Button>
          </div>
        )}

        <form className="relative mt-6 max-w-2xl md:hidden" onSubmit={(e) => { e.preventDefault(); handleDashboardSearch(); }}>
          <Icon
            name="solar:magnifer-linear"
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-white/90 drop-shadow-[0_1px_1px_rgba(0,0,0,0.08)]"
          />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search books, JADE, legislation, authorities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="relative z-0 w-full rounded-[24px] border border-white/18 bg-white/12 py-4 pl-12 pr-10 text-sm text-white placeholder:text-white/65 shadow-[0_18px_40px_rgba(124,45,18,0.18)] backdrop-blur outline-none transition-colors focus:border-white/28 focus:bg-white/16"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => { setSearchQuery(''); searchInputRef.current?.focus(); }}
              className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full p-0.5 text-white/60 transition-colors hover:text-white"
            >
              <Icon name="solar:close-circle-linear" size={16} />
            </button>
          )}
        </form>

      </section>

      <div className="relative z-[1] -mt-[80px] md:-mt-[84px]">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {dashboardMetrics.map((metric) => (
              <button
                key={metric.label}
                type="button"
                onClick={() => navigate(metric.to)}
                className="min-h-[160px] rounded-[28px] border border-white/35 bg-[linear-gradient(180deg,rgba(255,255,255,0.26),rgba(255,255,255,0.84))] p-4 text-left shadow-[0_20px_50px_rgba(124,45,18,0.18)] backdrop-blur-xl transition-colors hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.34),rgba(255,255,255,0.9))]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] ${metric.iconBg}`}>
                    <Icon name={metric.icon} size={18} />
                  </span>
                  <p className="text-3xl font-semibold leading-none text-slate-950">{metric.value}</p>
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{metric.label}</p>
                <p className="mt-1 text-sm text-slate-600">{metric.detail}</p>
              </button>
            ))}
          </div>
        </div>

        <>
          <div className="mb-5 mt-8 flex items-center justify-between gap-3 md:mt-10">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">Overview</p>
              <p className="mt-1 text-sm text-text-secondary">Research alerts, authority progress, and export readiness across your matters.</p>
            </div>
          </div>

          {/* Alerts */}
          {visibleAlerts.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setAlertsCollapsed(!alertsCollapsed)}
                className="flex items-center gap-2 text-xs font-medium text-text-secondary"
              >
                <Icon name={alertsCollapsed ? 'solar:alt-arrow-right-linear' : 'solar:alt-arrow-down-linear'} size={12} />
                <span>Alerts ({visibleAlerts.length})</span>
              </button>
              {!alertsCollapsed && (
                <div className="mt-2 space-y-1.5 animate-page-in">
                  {visibleAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-2.5 transition-colors hover:bg-amber-50"
                    >
                      <button
                        type="button"
                        onClick={() => navigate(alert.to)}
                        className="flex min-w-0 items-center gap-2.5 text-left"
                      >
                        <Icon name={alert.icon} size={14} className="shrink-0 text-amber-600" />
                        <span className="text-sm text-amber-800">{alert.message}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDismissedAlerts((prev) => new Set([...prev, alert.id]))}
                        className="shrink-0 rounded p-1 text-amber-400 transition-colors hover:bg-amber-100 hover:text-amber-600"
                      >
                        <Icon name="solar:close-circle-linear" size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Authority Lists — conditional: lists exist vs promote */}
          {lists.length > 0 ? (
            <section className="mt-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-xl text-text">Authority Lists</h2>
                  <p className="mt-1 text-xs text-text-secondary">
                    {lists.length} {lists.length === 1 ? 'list' : 'lists'} with {totalListItems} entries.
                  </p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => navigate('/app/authorities')}>
                  View all
                </Button>
              </div>

              <div className="mt-4 space-y-2">
                {lists.slice(0, 4).map((list) => {
                  const missingPinpoints = list.items.filter((i) => i.usage === 'read' && !i.pageRange).length;
                  const isReady = list.items.length > 0 && missingPinpoints === 0;
                  return (
                    <button
                      key={list.id}
                      type="button"
                      onClick={() => navigate(`/app/authorities?listId=${list.id}`)}
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-border/70 bg-slate-50/40 px-4 py-3 text-left transition-colors hover:bg-slate-100"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text">{list.name}</p>
                        <p className="mt-0.5 text-xs text-text-secondary">{list.items.length} entries · {list.caseRef}</p>
                      </div>
                      <div className="shrink-0">
                        {list.items.length === 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-text-muted">
                            <Icon name="solar:list-check-linear" size={12} />
                            Empty
                          </span>
                        ) : isReady ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-600">
                            <Icon name="solar:check-circle-linear" size={12} />
                            Export ready
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-600">
                            <Icon name="solar:pin-bold" size={12} />
                            {missingPinpoints} missing
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : (
            /* Promote: no authority lists yet */
            <section className="mt-5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
              <div className="bg-gradient-to-br from-brand/5 via-white to-emerald-50/40 px-6 py-8 text-center sm:px-10 sm:py-10">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10">
                  <Icon name="solar:list-check-linear" size={28} className="text-brand" />
                </span>
                <h2 className="mt-5 font-serif text-xl text-text">Create your first authority list</h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">
                  Create your first authority list for a matter. Search cases, legislation, and books, add pinpoints, and export a court-ready table of authorities.
                </p>
                <div className="mt-6 flex justify-center">
                  <Button onClick={() => navigate('/app/authorities')}>
                    <Icon name="solar:add-circle-linear" size={16} />
                    Create Authority List
                  </Button>
                </div>

                {/* Workflow guide */}
                <div className="mx-auto mt-8 grid max-w-2xl grid-cols-[minmax(0,1fr)_24px_minmax(0,1fr)_24px_minmax(0,1fr)_24px_minmax(0,1fr)] items-start gap-y-2">
                  {[
                    { icon: 'solar:magnifer-linear', label: 'Search authorities' },
                    { icon: 'solar:add-circle-linear', label: 'Add to list' },
                    { icon: 'solar:pin-bold', label: 'Add pinpoints' },
                    { icon: 'solar:document-text-linear', label: 'Export AGLC' },
                  ].map((step, idx) => (
                    <div key={step.label} className="contents">
                      {idx > 0 && <div className="mt-5 h-px bg-border" />}
                      <div className="flex flex-col items-center gap-2 px-2 text-center">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/5">
                          <Icon name={step.icon} size={14} className="text-text-muted" />
                        </span>
                        <span className="text-[11px] font-medium leading-snug text-text-secondary">{step.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
    </div>
  );
}
