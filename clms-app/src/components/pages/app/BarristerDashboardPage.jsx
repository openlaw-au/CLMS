import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../atoms/Icon';
import Button from '../../atoms/Button';
import Skeleton from '../../atoms/Skeleton';
import ContentLoader from '../../atoms/ContentLoader';
import MetricGrid from '../../molecules/MetricGrid';
import DashboardHero from '../../organisms/DashboardHero';
import { useAppContext } from '../../../context/AppContext';
import { getLoans } from '../../../services/loansService';
import { getLists } from '../../../services/authorityListsService';
import { lookupBookByTitle, getBorrowerName } from '../../../utils/bookLookup';

export default function BarristerDashboardPage() {
  const navigate = useNavigate();
  const { onboarding } = useAppContext();
  const firstName = onboarding.name?.trim().split(/\s+/)[0] || 'Counsel';

  const [loans, setLoans] = useState([]);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());

  useEffect(() => {
    // TODO(api): Replace with GET /api/loans?borrower=me - fetch all borrower loans
    // TODO(api): Replace with GET /api/authority-lists - fetch authority lists for current barrister
    const min = new Promise((r) => setTimeout(r, 400));
    Promise.all([getLoans(), getLists(), min]).then(([l, li]) => {
      setLoans(l);
      setLists(li);
      setLoading(false);
    });
  }, []);


  const activeLoans = useMemo(() => loans.filter((loan) => loan.status === 'active'), [loans]);
  const overdueLoans = useMemo(() => loans.filter((loan) => loan.status === 'overdue'), [loans]);
  const totalActive = activeLoans.length + overdueLoans.length;
  const dueSoon = useMemo(
    () => activeLoans.filter((loan) => {
      if (!loan.dueDate) return false;
      const diff = new Date(loan.dueDate) - new Date();
      return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
    }),
    [activeLoans],
  );

  const totalListItems = lists.reduce((sum, l) => sum + l.items.length, 0);

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
      const incompleteCitations = list.items.filter((i) => i.type === 'book' && !i.uncatalogued && (!i.author || !i.publisher || !i.year));
      if (incompleteCitations.length > 0) {
        result.push({
          id: `citation-${list.id}`,
          icon: 'solar:document-text-linear',
          message: `${incompleteCitations.length} incomplete ${incompleteCitations.length === 1 ? 'citation' : 'citations'} in "${list.name}"`,
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
      value: totalActive,
      detail: overdueLoans.length > 0 ? `${overdueLoans.length} overdue` : 'No overdue',
      icon: 'solar:notebook-bookmark-linear',
      to: '/app/loans',
      iconBg: totalActive > 0 ? 'info' : 'neutral',
    },
    {
      label: 'Due Soon',
      value: dueSoon.length,
      detail: dueSoon.length > 0 ? 'Due within 7 days' : 'Nothing due soon',
      icon: 'solar:calendar-linear',
      to: '/app/loans',
      iconBg: dueSoon.length > 0 ? 'amber' : 'neutral',
    },
    {
      label: 'Research Blockers',
      value: visibleAlerts.length,
      detail: visibleAlerts.length > 0 ? 'Pinpoints or loan blockers' : 'No active blockers',
      icon: 'solar:danger-triangle-linear',
      to: '/app/authorities',
      iconBg: visibleAlerts.length > 0 ? 'red' : 'emerald',
    },
    {
      label: 'Authority Lists',
      value: lists.length,
      detail: `${totalListItems} entries in progress`,
      icon: 'solar:list-check-linear',
      to: '/app/authorities',
      iconBg: lists.length > 0 ? 'brand' : 'neutral',
    },
  ];

  return (
    <div className="animate-page-in">
      <DashboardHero
        greeting={`Hi, ${firstName}.`}
        loading={loading}
        subtitle="Search authorities, organise your research, and export court-ready citations."
      />

      <div className="relative z-[1] -mt-[56px] md:-mt-[60px]">
        <MetricGrid metrics={dashboardMetrics} loading={loading} />
      </div>

      {/* Bottom cards — containers always visible */}
      <div className="mt-12 grid gap-4 md:grid-cols-2">
        {/* Authority Lists card */}
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <ContentLoader
            loading={loading}
            skeleton={
              <>
                <Skeleton className="h-5 w-40 rounded-lg" />
                <div className="mt-4 space-y-2">
                  {[0, 1, 2].map((j) => <Skeleton key={j} className="h-10 w-full rounded-xl" />)}
                </div>
              </>
            }
          >
            <div className="flex min-h-[36px] items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="solar:list-check-linear" size={22} className="text-brand" />
                <h2 className="font-serif text-section-title text-text">Recent Authority Lists</h2>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => navigate('/app/authorities')}
                className="shrink-0 whitespace-nowrap px-3 py-1.5 text-xs"
              >
                {lists.length > 0 ? 'View all' : 'Create'}
              </Button>
            </div>
            {lists.length > 0 ? (
              <div className="mt-3 space-y-1.5">
                {[...lists].sort((a, b) => (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || '')).slice(0, 5).map((list) => {
                  const missingPinpoints = list.items.filter((li) => li.usage === 'read' && !li.pageRange).length;
                  const incompleteCites = list.items.filter((li) => li.type === 'book' && !li.uncatalogued && (!li.author || !li.publisher || !li.year)).length;
                  const issueCount = missingPinpoints + incompleteCites;
                  const isReady = list.items.length > 0 && issueCount === 0;
                  return (
                    <button
                      key={list.id}
                      type="button"
                      onClick={() => navigate(`/app/authorities?listId=${list.id}`)}
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-border/70 bg-slate-50/40 px-3 py-2 text-left transition-colors hover:bg-slate-100"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-text">{list.name}</p>
                        <p className="mt-0.5 text-[11px] text-text-secondary">{list.items.length} entries · {list.caseRef}</p>
                      </div>
                      <div className="shrink-0">
                        {list.items.length === 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-text-muted">Empty</span>
                        ) : isReady ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
                            <Icon name="solar:check-circle-linear" size={11} />
                            Ready
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600">
                            <Icon name="solar:danger-triangle-linear" size={11} />
                            {issueCount} {issueCount === 1 ? 'issue' : 'issues'}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="mt-3 text-xs text-text-muted">No lists yet. Create one to get started.</p>
            )}
          </ContentLoader>
        </section>

        {/* Alerts card — height pinned to left card, scrollable */}
        <section className="relative rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
          <div className="absolute inset-0 flex flex-col overflow-hidden rounded-2xl p-5">
            <ContentLoader
              loading={loading}
              className="flex flex-1 flex-col min-h-0"
              skeleton={
                <>
                  <Skeleton className="h-5 w-24 rounded-lg" />
                  <div className="mt-4 space-y-2">
                    {[0, 1, 2].map((j) => <Skeleton key={j} className="h-10 w-full rounded-xl" />)}
                  </div>
                </>
              }
            >
              <div className="flex min-h-[36px] shrink-0 items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="solar:danger-triangle-linear" size={22} className="text-red-600" />
                  <h2 className="font-serif text-section-title text-text">
                    Alerts{visibleAlerts.length > 0 ? ` (${visibleAlerts.length})` : ''}
                  </h2>
                </div>
              </div>
              {visibleAlerts.length > 0 ? (
                <div className="thin-scrollbar mt-3 min-h-0 flex-1 space-y-1.5 overflow-y-auto">
                  {visibleAlerts.map((alert) => (
                    <button
                      key={alert.id}
                      type="button"
                      onClick={() => navigate(alert.to)}
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50/60 px-3 py-2 text-left transition-colors hover:bg-red-100/80"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <Icon name={alert.icon} size={13} className="shrink-0 text-red-600" />
                        <span className="text-xs text-red-800">{alert.message}</span>
                      </span>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); setDismissedAlerts((prev) => new Set([...prev, alert.id])); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); setDismissedAlerts((prev) => new Set([...prev, alert.id])); } }}
                        className="shrink-0 rounded-full p-1.5 text-text-muted transition-colors hover:bg-slate-200 hover:text-text"
                      >
                        <Icon name="solar:close-circle-linear" size={14} />
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-xs text-text-muted">No active alerts. You're all clear.</p>
              )}
            </ContentLoader>
          </div>
        </section>
      </div>
    </div>
  );
}
