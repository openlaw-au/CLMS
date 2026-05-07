import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../atoms/Icon';
import Button from '../../atoms/Button';
import Skeleton from '../../atoms/Skeleton';
import ContentLoader from '../../atoms/ContentLoader';
import MetricGrid from '../../molecules/MetricGrid';
import AuthorityListCard from '../../molecules/AuthorityListCard';
import SectionCard from '../../molecules/SectionCard';
import DashboardHero from '../../organisms/DashboardHero';
import { useAppContext } from '../../../context/AppContext';
import { getLoans } from '../../../services/loansService';
import { getLists } from '../../../services/authorityListsService';
import { lookupBookByTitle, getBorrowerName } from '../../../utils/bookLookup';

const CARD_GRID = 'grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4';

export default function BarristerDashboardPage() {
  const navigate = useNavigate();
  const { onboarding } = useAppContext();
  const firstName = onboarding.name?.trim().split(/\s+/)[0] || 'Counsel';

  const [loans, setLoans] = useState([]);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);

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
  const sortedLists = useMemo(
    () => [...lists].sort((a, b) => (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || '')),
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
          kind: 'Pinpoints',
          message: `${missingPinpoints.length} missing ${missingPinpoints.length === 1 ? 'pinpoint' : 'pinpoints'} in "${list.name}"`,
          to: `/app/authorities?listId=${list.id}`,
        });
      }
      const incompleteCitations = list.items.filter((i) => i.type === 'book' && !i.uncatalogued && (!i.author || !i.publisher || !i.year));
      if (incompleteCitations.length > 0) {
        result.push({
          id: `citation-${list.id}`,
          icon: 'solar:document-text-linear',
          kind: 'Citations',
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
            kind: 'On loan',
            message: `"${item.title}" is on loan${borrower ? ` to ${borrower}` : ''}${book.dueDate ? `, due ${book.dueDate}` : ''}`,
            to: `/app/authorities?listId=${list.id}`,
          });
        }
      });
    });
    return result;
  }, [lists]);
  const visibleAlerts = alerts;

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
      value: alerts.length,
      detail: alerts.length > 0 ? 'Pinpoints or loan blockers' : 'No active blockers',
      icon: 'solar:danger-triangle-linear',
      to: '/app/authorities',
      iconBg: alerts.length > 0 ? 'red' : 'emerald',
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

      <SectionCard className="mt-12">
        <ContentLoader
          loading={loading}
          skeleton={
            <>
              <div className="flex min-h-[36px] items-center justify-between gap-3">
                <Skeleton className="h-5 w-40 rounded-lg" />
                <Skeleton className="h-8 w-20 rounded-xl" />
              </div>
              <div className={`mt-4 ${CARD_GRID}`}>
                {[0, 1, 2, 3].map((index) => (
                  <div key={index} className="min-h-[148px] overflow-hidden rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
                    <Skeleton className="h-5 w-3/4 rounded" />
                    <Skeleton className="mt-2 h-4 w-2/5 rounded" />
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Skeleton className="h-5 w-16 rounded-md" />
                      <Skeleton className="h-5 w-20 rounded-md" />
                      <Skeleton className="h-5 w-14 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            </>
          }
        >
          <div className="flex min-h-[36px] items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Icon name="solar:list-check-linear" size={22} className="text-brand" />
              <h2 className="font-serif text-section-title text-text">Recent Authority Lists</h2>
            </div>
            {lists.length > 0 ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => navigate('/app/authorities')}
                className="shrink-0 whitespace-nowrap px-3 py-1.5 text-xs"
              >
                View all
              </Button>
            ) : (
              <Button
                size="sm"
                variant="primary"
                onClick={() => navigate('/app/authorities')}
                className="shrink-0 whitespace-nowrap px-3 py-1.5 text-xs"
              >
                Create
              </Button>
            )}
          </div>
          {lists.length > 0 ? (
            <div className={`mt-4 ${CARD_GRID}`}>
              {sortedLists.slice(0, 4).map((list) => (
                <AuthorityListCard
                  key={list.id}
                  list={list}
                  compact
                  onClick={() => navigate(`/app/authorities?listId=${list.id}`)}
                />
              ))}
            </div>
          ) : (
            <p className="mt-3 text-xs text-text-muted">No lists yet. Create one to get started.</p>
          )}
        </ContentLoader>
      </SectionCard>

      <SectionCard className="mt-4">
        <ContentLoader
          loading={loading}
          skeleton={
            <>
              <div className="flex min-h-[36px] items-center gap-2">
                <Skeleton className="h-5 w-28 rounded-lg" />
              </div>
              <div className={`mt-4 ${CARD_GRID}`}>
                {[0, 1, 2, 3].map((index) => (
                  <div key={index} className="min-h-[148px] rounded-2xl border border-red-200/70 bg-red-50/40 p-4">
                    <Skeleton className="h-9 w-9 rounded-xl" />
                    <Skeleton className="mt-3 h-4 w-full rounded" />
                    <Skeleton className="mt-2 h-4 w-4/5 rounded" />
                  </div>
                ))}
              </div>
            </>
          }
        >
          <div className="flex min-h-[36px] items-center gap-2">
            <Icon name="solar:danger-triangle-linear" size={22} className="text-red-600" />
            <h2 className="font-serif text-section-title text-text">
              Alerts{visibleAlerts.length > 0 ? ` (${visibleAlerts.length})` : ''}
            </h2>
          </div>
          {visibleAlerts.length > 0 ? (
            <div className={`mt-4 ${CARD_GRID}`}>
              {visibleAlerts.map((alert) => (
                <button
                  key={alert.id}
                  type="button"
                  onClick={() => navigate(alert.to)}
                  className="flex min-h-[148px] flex-col items-start gap-2 rounded-2xl border border-red-200/70 bg-red-50/40 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-red-300 hover:shadow-sm"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100">
                    <Icon name={alert.icon} size={16} className="text-red-600" />
                  </span>
                  <p className="text-sm font-medium text-text">{alert.message}</p>
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-xs text-text-muted">No active alerts. You're all clear.</p>
          )}
        </ContentLoader>
      </SectionCard>
    </div>
  );
}
