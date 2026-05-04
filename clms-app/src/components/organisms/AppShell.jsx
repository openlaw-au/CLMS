import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../atoms/Icon';
import Button from '../atoms/Button';
import BadgeDot from '../atoms/BadgeDot';
import Breadcrumb from '../atoms/Breadcrumb';
import HeaderSearchBar from '../molecules/HeaderSearchBar';
import { useAppContext } from '../../context/AppContext';
import { getLists } from '../../services/authorityListsService';
import { getLoans } from '../../services/loansService';
const navByRole = {
  barrister: [
    { label: 'Dashboard', slug: 'dashboard', icon: 'solar:home-2-linear' },
    { label: 'Authority Lists', slug: 'authorities', icon: 'solar:list-check-linear' },
    { label: 'Library', slug: 'loans', icon: 'solar:library-linear' },
    { label: 'Settings', slug: 'settings', icon: 'solar:settings-linear' },
  ],
  clerk: [
    { label: 'Dashboard', slug: 'dashboard', icon: 'solar:home-2-linear' },
    { label: 'Catalogue', slug: 'catalogue', icon: 'solar:book-2-linear' },
    { label: 'Loans', slug: 'loans', icon: 'solar:book-bookmark-linear' },
    { label: 'Authorities', slug: 'authorities', icon: 'solar:list-check-linear' },
    { label: 'Chambers', slug: 'chambers', icon: 'solar:buildings-2-linear' },
    { label: 'Insights', slug: 'insights', icon: 'solar:chart-2-linear' },
    { label: 'Settings', slug: 'settings', icon: 'solar:settings-linear' },
  ],
};

export default function AppShell({ role, children }) {
  const { onboarding, resetSession } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const profileMenuRef = useRef(null);
  const headerRef = useRef(null);
  const [measuredHeaderH, setMeasuredHeaderH] = useState(57);
  const [hasBarristerLists, setHasBarristerLists] = useState(false);
  const [sidebarLists, setSidebarLists] = useState([]);
  const [authorityListsExpanded, setAuthorityListsExpanded] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notiOpen, setNotiOpen] = useState(false);
  const notiRef = useRef(null);

  // Close sidebar and reset viewport on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname, location.search]);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname, location.search]);

  // Measure header height for viewport-locked layouts
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const update = () => setMeasuredHeaderH(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const refreshSidebarLists = useCallback(() => {
    if (role !== 'barrister') return;
    getLists().then((lists) => {
      setHasBarristerLists(lists.length > 0);
      setSidebarLists(lists);
    });
  }, [role]);

  useEffect(() => {
    refreshSidebarLists();
  }, [refreshSidebarLists, location.pathname]);

  // Listen for authority-lists-changed events from child pages
  useEffect(() => {
    const handler = () => refreshSidebarLists();
    window.addEventListener('authority-lists-changed', handler);
    return () => window.removeEventListener('authority-lists-changed', handler);
  }, [refreshSidebarLists]);

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [dismissedNotiIds, setDismissedNotiIds] = useState(new Set());
  useEffect(() => {
    // TODO(api): Replace with GET /api/notifications — fetch user notifications
    getLoans().then((loans) => {
      const notis = [];
      loans.forEach((loan) => {
        if (loan.status === 'overdue') {
          notis.push({ id: `overdue-${loan.id}`, icon: 'solar:alarm-linear', iconColor: 'text-red-600', bg: 'bg-red-50', message: `"${loan.bookTitle}" is overdue`, detail: `Due ${loan.dueDate}`, to: '/app/loans', time: '2d ago' });
        }
        if (loan.status === 'pending') {
          notis.push({ id: `pending-${loan.id}`, icon: 'solar:hourglass-linear', iconColor: 'text-amber-600', bg: 'bg-amber-50', message: `Loan request pending`, detail: loan.bookTitle, to: '/app/loans', time: '1d ago' });
        }
      });
      if (notis.length === 0) {
        notis.push({ id: 'welcome', icon: 'solar:hand-shake-linear', iconColor: 'text-emerald-600', bg: 'bg-emerald-50', message: 'Welcome to CLMS', detail: 'Start by searching or creating an authority list.', to: '/app/dashboard', time: 'now' });
      }
      setNotifications(notis);
    });
  }, []);
  const visibleNotis = notifications.filter((n) => !dismissedNotiIds.has(n.id));
  const pendingCount = visibleNotis.length;

  // Close notification dropdown on outside click (delayed to avoid toggle conflict)
  useEffect(() => {
    if (!notiOpen) return undefined;
    const handlePointerDown = (event) => {
      if (notiRef.current && !notiRef.current.contains(event.target)) setNotiOpen(false);
    };
    const handleKeyDown = (event) => { if (event.key === 'Escape') setNotiOpen(false); };
    // Use setTimeout to avoid the same click that opened it from closing it
    const id = setTimeout(() => {
      document.addEventListener('mousedown', handlePointerDown);
      document.addEventListener('keydown', handleKeyDown);
    }, 0);
    return () => { clearTimeout(id); document.removeEventListener('mousedown', handlePointerDown); document.removeEventListener('keydown', handleKeyDown); };
  }, [notiOpen]);
  const currentSlug = location.pathname.replace('/app/', '').split('/')[0] || 'dashboard';
  const slugAlias = {
    lists: 'authorities',
    library: 'catalogue',
    members: 'chambers',
    locations: 'chambers',
    reports: 'insights',
  };
  const normalizedSlug = slugAlias[currentSlug] || currentSlug;
  const isDashboardHero = normalizedSlug === 'dashboard';
  const hasHeroGradient = normalizedSlug === 'dashboard';
  const hasHeroBg = hasHeroGradient;

  const navItems = navByRole[role];
  const mainNav = navItems;
  const settingsNav = navItems.find((item) => item.slug === 'settings');
  const userName = onboarding.name || (role === 'clerk' ? 'Clerk' : 'Counsel');
  const initials = userName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const navLinkClass = (slug) =>
    `flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
      normalizedSlug === slug
        ? 'bg-brand text-white shadow-sm'
        : 'text-text-secondary hover:bg-slate-100 hover:text-text'
    }`;

  const navIconClass = (slug) =>
    normalizedSlug === slug ? 'text-brand-soft' : '';

  const searchPlaceholder = role === 'clerk'
    ? 'Search catalogue...'
    : 'Search my lists, authorities, books...';
  const quickAction = role === 'clerk'
    ? { label: 'Add Book', to: '/app/catalogue', icon: 'solar:add-circle-linear' }
    : hasBarristerLists
      ? null
      : { label: 'New List', to: '/app/authorities', icon: 'solar:add-circle-bold' };
  const isBarristerQuickAction = role === 'barrister';
  const [headerCondensed, setHeaderCondensed] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  useEffect(() => {
    if (!hasHeroGradient) {
      setHeaderCondensed(false);
      return undefined;
    }

    const handleScroll = () => {
      setHeaderCondensed(window.scrollY > 72);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasHeroGradient]);

  useEffect(() => {
    if (!profileMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [profileMenuOpen]);

  // Authority list detail / creation / search — derive header context (must be before headerClassName)
  const listIdParam = searchParams.get('listId');
  const newParam = searchParams.get('new');
  const qParam = searchParams.get('q');
  const isListDetail = normalizedSlug === 'authorities' && !!listIdParam;
  const isListCreation = normalizedSlug === 'authorities' && newParam === '1';
  const isAuthSearch = normalizedSlug === 'authorities' && !!qParam;
  const isListSubpage = isListDetail || isListCreation;
  const isAuthoritiesOverview = normalizedSlug === 'authorities' && !isListSubpage && !isAuthSearch;
  const isHeaderMinimal = isListSubpage || isAuthSearch || isAuthoritiesOverview;
  const activeList = isListDetail ? sidebarLists.find((l) => l.id === listIdParam) : null;
  const listHeaderTitle = isListCreation ? 'New List' : activeList?.name || 'List';
  // Authorities page always uses full-width layout so overview↔editor transitions don't cause layout jumps
  const isAuthPage = normalizedSlug === 'authorities';
  const mainClassName = (isListSubpage || isAuthPage)
    ? 'w-full max-w-none px-0 pb-0 pt-0'
    : hasHeroGradient
      ? 'mx-auto max-w-screen-2xl px-6 pb-8 pt-0 lg:px-14 xl:px-16 2xl:px-10'
      : 'mx-auto max-w-screen-2xl px-6 py-8 lg:px-14 xl:px-16 2xl:px-10';

  const dashboardHeaderLabel = role === 'clerk' ? 'Library Operations' : 'Research Workspace';
  const shellHeaderHeight = 57;
  const headerClassName = hasHeroGradient
    ? headerCondensed
      ? 'border-b border-border/60 bg-white/88 py-3 shadow-[0_12px_36px_rgba(15,23,42,0.08)] backdrop-blur-xl'
      : 'border-b border-white/18 bg-shell-header-glass py-3 shadow-[0_12px_32px_rgba(124,45,18,0.08)] backdrop-blur-xl'
    : 'border-b border-border/60 bg-white py-3';
  const quickActionClassName = isBarristerQuickAction
    ? 'hidden !px-3.5 !py-2 !text-xs lg:inline-flex'
    : 'hidden !px-3.5 !py-2 !text-xs lg:inline-flex';
  const quickActionVariant = isBarristerQuickAction ? 'tertiary' : 'secondary';
  const renderChambersMark = (sizeClassName, toneClassName, iconSize, shapeClassName = 'rounded-xl') => (
    <span className={`flex shrink-0 items-center justify-center overflow-hidden ${shapeClassName} ${sizeClassName} ${toneClassName}`}>
      {onboarding.chambersLogo ? (
        <img
          src={onboarding.chambersLogo}
          alt={`${onboarding.chambersName || 'Chambers'} logo`}
          className="h-full w-full object-cover"
        />
      ) : (
        <Icon name="solar:buildings-linear" size={iconSize} />
      )}
    </span>
  );
  const handleLogout = () => {
    setProfileMenuOpen(false);
    resetSession(role);
    navigate(`/login?role=${role}`);
  };
const headerProfileButtonClassName = `flex min-w-0 items-center gap-3 rounded-2xl px-2.5 py-1.5 text-left transition-colors ${
    hasHeroGradient && !headerCondensed
      ? profileMenuOpen ? 'bg-white/14' : 'hover:bg-white/10'
      : profileMenuOpen ? 'bg-slate-100' : 'hover:bg-slate-100'
  }`;
  const currentNavLabel = navItems.find((item) => item.slug === normalizedSlug)?.label || 'Workspace';

  const leftHeaderLabel = isDashboardHero && !headerCondensed ? dashboardHeaderLabel : currentNavLabel;
  const leftHeaderTextClassName = hasHeroGradient && !headerCondensed ? 'text-white/80' : 'text-text-muted';
  const leftChambersToneClassName = hasHeroGradient && !headerCondensed
    ? onboarding.chambersLogo
      ? 'bg-white/18 ring-1 ring-white/22 backdrop-blur'
      : 'bg-white/14 text-white/90 ring-1 ring-white/22 backdrop-blur'
    : onboarding.chambersLogo
      ? 'bg-slate-100 ring-1 ring-slate-200'
      : 'bg-slate-100 text-text-secondary ring-1 ring-slate-200';
  const leftChambersNameClassName = hasHeroGradient && !headerCondensed
    ? 'truncate text-sm font-medium text-white drop-shadow-[0_1px_1px_rgba(124,45,18,0.16)]'
    : 'truncate text-sm font-medium text-text';
  return (
    <div className="min-h-screen bg-slate-100">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px] transition-opacity md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 z-40 flex h-screen w-72 flex-col bg-white p-4 shadow-lg transition-transform duration-300 ease-in-out md:z-20 md:translate-x-0 md:shadow-sm ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-3 pb-5 pt-3">
          <Link to="/app/dashboard" className="flex" onClick={() => setSidebarOpen(false)}>
            <img src="/assets/CLMS_logo.svg" alt="CLMS" className="h-6 w-auto" />
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="btn-icon h-8 w-8 shrink-0 text-text-secondary hover:bg-slate-100 hover:text-text md:hidden"
            aria-label="Close sidebar"
          >
            <Icon name="solar:close-circle-linear" size={20} />
          </button>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col space-y-1">
          {mainNav.map((item) => {
            const isBarristerAuthorities = role === 'barrister' && item.slug === 'authorities';
            const isAuthoritiesActive = normalizedSlug === item.slug;

            return (
              <div key={item.label}>
                {isBarristerAuthorities ? (
                  <div
                    className={`flex items-center gap-1 rounded-xl transition-colors ${
                      isAuthoritiesActive ? 'bg-brand text-white shadow-sm' : 'text-text-secondary hover:bg-slate-100 hover:text-text'
                    }`}
                  >
                    <Link
                      to={`/app/${item.slug}`}
                      className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2.5 text-sm font-medium"
                    >
                      <Icon name={item.icon} size={18} className={navIconClass(item.slug)} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                    <button
                      type="button"
                      aria-label="Create authority list"
                      onClick={() => navigate('/app/authorities?new=1')}
                      className={`btn-icon h-8 w-8 shrink-0 ${
                        isAuthoritiesActive
                          ? 'text-white/80 hover:bg-white/12 hover:text-white'
                          : 'text-text-muted hover:bg-slate-200/80 hover:text-text'
                      }`}
                    >
                      <Icon name="solar:add-circle-linear" size={18} />
                    </button>
                    <button
                      type="button"
                      aria-label={authorityListsExpanded ? 'Collapse authority lists' : 'Expand authority lists'}
                      aria-expanded={authorityListsExpanded}
                      onClick={() => setAuthorityListsExpanded((prev) => !prev)}
                      className={`btn-icon mr-1 h-8 w-8 shrink-0 ${
                        isAuthoritiesActive
                          ? 'text-white/80 hover:bg-white/12 hover:text-white'
                          : 'text-text-muted hover:bg-slate-200/80 hover:text-text'
                      }`}
                    >
                      <Icon
                        name={authorityListsExpanded ? 'solar:alt-arrow-down-linear' : 'solar:alt-arrow-right-linear'}
                        size={16}
                      />
                    </button>
                  </div>
                ) : (
                  <Link to={`/app/${item.slug}`} className={navLinkClass(item.slug)}>
                    <Icon name={item.icon} size={18} className={navIconClass(item.slug)} />
                    <span>{item.label}</span>
                  </Link>
                )}

                {isBarristerAuthorities && authorityListsExpanded && (
                  <div className="mt-2 ml-3 pl-0.5">
                    <div className="space-y-1">
                      {sidebarLists.map((list) => {
                        const isActive = normalizedSlug === 'authorities' && searchParams.get('listId') === list.id;
                        const itemCount = list.items?.length || 0;

                        return (
                          <button
                            key={list.id}
                            type="button"
                            onClick={() => navigate(`/app/authorities?listId=${list.id}`)}
                            className={`flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left transition-colors ${
                              isActive
                                ? 'bg-slate-100 text-text'
                                : 'text-text-secondary hover:bg-slate-100/80 hover:text-text'
                            }`}
                          >
                            <div className="min-w-0 flex flex-1 items-center gap-2.5">
                              <Icon
                                name="solar:folder-open-linear"
                                size={15}
                                className={isActive ? 'text-brand' : 'text-text-muted'}
                              />
                              <span className={`min-w-0 flex-1 truncate text-sm ${isActive ? 'font-medium text-text' : ''}`}>
                                {list.name}
                              </span>
                            </div>
                            <span className={`inline-flex shrink-0 items-center gap-1.5 text-[11px] font-medium ${
                              isActive ? 'text-brand' : 'text-text-muted'
                            }`}>
                              <Icon name="solar:document-text-linear" size={13} />
                              <span>{itemCount}</span>
                            </span>
                          </button>
                        );
                      })}
                      {sidebarLists.length === 0 && (
                        <p className="px-2.5 py-2 text-xs text-text-muted">No lists yet</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {onboarding.mode === 'solo' && (
          <div className="mx-1 mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-amber-900">
              <Icon name="solar:buildings-2-linear" size={14} className="shrink-0 text-amber-700" />
              Solo mode
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-amber-800">Join chambers for shared catalogue and loans.</p>
            <Button size="sm" variant="secondary" className="mt-2 w-full !border-amber-300 !bg-white !text-amber-900 !text-xs hover:!bg-amber-50" onClick={() => navigate('/onboarding/barrister/lookup')}>
              Join Chambers
            </Button>
          </div>
        )}

        <div ref={profileMenuRef} className="relative mt-auto -mx-3 border-t border-border/60 px-3 pt-2">
          <button
            type="button"
            onClick={() => setProfileMenuOpen((prev) => !prev)}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-colors hover:bg-slate-100"
            aria-expanded={profileMenuOpen}
            aria-haspopup="menu"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium leading-tight text-text">{userName}</p>
              <p className="truncate text-xs text-text-muted">{onboarding.chambersName || 'Chambers'}</p>
            </div>
            <Icon
              name={profileMenuOpen ? 'solar:alt-arrow-up-linear' : 'solar:alt-arrow-down-linear'}
              size={14}
              className="shrink-0 text-text-muted"
            />
          </button>

          {profileMenuOpen && (
            <div
              className="absolute bottom-full left-2 right-2 z-20 mb-1 rounded-xl border border-border/80 bg-white p-1 shadow-[0_-12px_36px_rgba(15,23,42,0.12)]"
              role="menu"
            >
              <button
                type="button"
                onClick={() => { setProfileMenuOpen(false); navigate('/app/settings'); }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm text-text transition-colors hover:bg-slate-50"
                role="menuitem"
              >
                <Icon name="solar:user-circle-linear" size={16} className="text-text-secondary" />
                <span>Edit profile</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
                role="menuitem"
              >
                <Icon name="solar:logout-2-linear" size={16} />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <div
        className="relative md:pl-72"
        style={{ '--header-h': `${shellHeaderHeight}px` }}
      >
        {hasHeroGradient && (
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[340px] bg-[linear-gradient(135deg,#9a3412_0%,#c2410c_18%,#ea580c_48%,#fb923c_100%)] md:h-[356px] lg:h-[372px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(255,255,255,0.22),transparent_22%),radial-gradient(circle_at_10%_0%,rgba(255,255,255,0.12),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0),rgba(255,255,255,0.06))]" />
          </div>
        )}

        {/* Top header */}
        <header ref={headerRef} className={`sticky top-0 z-10 transition-all duration-300 ${headerClassName}`}>
          <div className="relative flex items-center gap-4 px-6 md:gap-10 lg:px-14 xl:px-16 2xl:px-10">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className={`btn-icon h-10 w-10 shrink-0 md:hidden ${
                hasHeroGradient && !headerCondensed
                  ? 'text-white/90 hover:bg-white/12 hover:text-white'
                  : 'text-text-secondary hover:bg-slate-100 hover:text-text'
              }`}
              aria-label="Open menu"
            >
              <Icon name="solar:hamburger-menu-linear" size={24} />
            </button>
            <div className="shrink-0">
              {isAuthoritiesOverview ? (
                <Breadcrumb items={[
                  { label: 'Authority Lists' },
                ]} />
              ) : isAuthSearch ? (
                <Breadcrumb items={[
                  { label: 'Authority Lists', onClick: () => navigate('/app/authorities') },
                  { label: 'Search Results' },
                ]} />
              ) : isListSubpage ? (
                <Breadcrumb items={[
                  { label: 'Authority Lists', onClick: () => navigate('/app/authorities') },
                  { label: 'List Editor' },
                ]} />
              ) : isDashboardHero ? (
                <div className="flex items-center gap-2.5">
                  {renderChambersMark(
                    'h-8 w-8',
                    headerCondensed ? 'bg-slate-100 text-slate-500' : 'bg-white/18 text-white/80',
                    16,
                    'rounded-xl',
                  )}
                  <span className={`hidden font-serif text-sm font-semibold lg:inline ${headerCondensed ? 'text-text' : 'text-white'}`}>
                    {onboarding.chambersName || 'Chambers'}
                  </span>
                </div>
              ) : (
                <Breadcrumb items={[{ label: currentNavLabel }]} />
              )}
            </div>

            <HeaderSearchBar
              placeholder={searchPlaceholder}
              role={role}
              className="absolute left-1/2 hidden w-full max-w-[500px] -translate-x-1/2 md:block"
            />

            <div className="relative ml-auto flex shrink-0 items-center gap-3">
              {quickAction && (
                <Button
                  size="sm"
                  variant={quickActionVariant}
                  className={quickActionClassName}
                  onClick={() => navigate(quickAction.to)}
                >
                  <Icon name={quickAction.icon} size={14} />
                  {quickAction.label}
                </Button>
              )}
              <div ref={notiRef} className="relative">
                <button
                  type="button"
                  onClick={() => setNotiOpen((v) => !v)}
                  className={`btn-icon relative h-10 w-10 shrink-0 ${
                    hasHeroGradient && !headerCondensed
                      ? 'text-white/90 hover:bg-white/12 hover:text-white'
                      : 'text-text-secondary hover:bg-slate-100 hover:text-text'
                  }`}
                  aria-label="Notifications"
                >
                  <Icon name="solar:bell-linear" size={22} />
                  {pendingCount > 0 && (
                    <BadgeDot className="absolute right-2 top-2" />
                  )}
                </button>
                {notiOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-80 animate-fade-in overflow-hidden rounded-2xl border border-border/60 bg-white shadow-xl ring-1 ring-black/5">
                    <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                      <h3 className="text-sm font-semibold text-text">Notifications</h3>
                      {visibleNotis.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setDismissedNotiIds(new Set(notifications.map((n) => n.id)))}
                          className="text-xs text-text-muted transition-colors hover:text-text"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {visibleNotis.length > 0 ? visibleNotis.map((noti) => (
                        <div key={noti.id} className="flex items-start gap-3 border-b border-border/40 px-4 py-3 last:border-b-0 transition-colors hover:bg-slate-50">
                          <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${noti.bg}`}>
                            <Icon name={noti.icon} size={16} className={noti.iconColor} />
                          </span>
                          <button
                            type="button"
                            onClick={() => { navigate(noti.to); setNotiOpen(false); }}
                            className="min-w-0 flex-1 text-left"
                          >
                            <p className="text-xs font-medium text-text">{noti.message}</p>
                            <p className="mt-0.5 truncate text-xs text-text-muted">{noti.detail}</p>
                          </button>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="text-xs text-text-muted">{noti.time}</span>
                            <button
                              type="button"
                              onClick={() => setDismissedNotiIds((prev) => new Set([...prev, noti.id]))}
                              className="rounded-full p-1 text-text-muted transition-colors hover:bg-slate-100 hover:text-text"
                            >
                              <Icon name="solar:close-circle-linear" size={14} />
                            </button>
                          </div>
                        </div>
                      )) : (
                        <div className="px-4 py-8 text-center">
                          <Icon name="solar:bell-linear" size={24} className="mx-auto text-slate-300" />
                          <p className="mt-2 text-xs text-text-muted">No notifications</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main
          className={mainClassName}
          style={(isListSubpage || isAuthPage) ? { height: `calc(100vh - ${measuredHeaderH}px)`, overflow: 'hidden' } : undefined}
        >
          {children}
        </main>
      </div>

    </div>
  );
}
