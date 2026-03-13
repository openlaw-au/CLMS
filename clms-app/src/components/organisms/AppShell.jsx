import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../atoms/Icon';
import Button from '../atoms/Button';
import Breadcrumb from '../atoms/Breadcrumb';
import { useAppContext } from '../../context/AppContext';
import { getLists } from '../../services/authorityListsService';
import { getLoans } from '../../services/loansService';
import { getSuggestions } from '../../services/searchService';
const navByRole = {
  barrister: [
    { label: 'Dashboard', slug: 'dashboard', icon: 'solar:home-2-linear' },
    { label: 'Authority Lists', slug: 'authorities', icon: 'solar:list-check-linear' },
    { label: 'Loans', slug: 'loans', icon: 'solar:book-bookmark-linear' },
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
  const [headerQuery, setHeaderQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchWrapperRef = useRef(null);
  const searchInputRef = useRef(null);
  const [hasBarristerLists, setHasBarristerLists] = useState(false);
  const [sidebarLists, setSidebarLists] = useState([]);
  const [authorityListsExpanded, setAuthorityListsExpanded] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  // Autosuggest — debounced fetch
  const fetchSuggestions = useCallback(async (q) => {
    if (!q || q.trim().length < 1) { setSuggestions([]); return; }
    const results = await getSuggestions(q);
    setSuggestions(results);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchSuggestions(headerQuery), 120);
    return () => clearTimeout(timer);
  }, [headerQuery, fetchSuggestions]);

  useEffect(() => {
    if (role !== 'barrister') return undefined;

    let cancelled = false;

    getLists().then((lists) => {
      if (!cancelled) {
        setHasBarristerLists(lists.length > 0);
        setSidebarLists(lists);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [role, location.pathname]);

  // Close suggestions when clicking outside
  useEffect(() => {
    if (!showSuggestions) return undefined;
    const handleClickOutside = (e) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSuggestions]);

  // Notification badge — pending actions count
  const [pendingCount, setPendingCount] = useState(0);
  useEffect(() => {
    // TODO(api): Replace with GET /api/notifications/count — fetch unread notification count
    getLoans().then((loans) => {
      const pending = loans.filter((l) => l.status === 'pending' || l.status === 'overdue').length;
      setPendingCount(pending);
    });
  }, []);
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

  const navItems = navByRole[role];
  const mainNav = navItems.filter((item) => item.slug !== 'settings');
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
    : 'Search books, JADE, and authorities...';
  const quickAction = role === 'clerk'
    ? { label: 'Add Book', to: '/app/catalogue', icon: 'solar:add-circle-linear' }
    : hasBarristerLists
      ? null
      : { label: 'New List', to: '/app/authorities', icon: 'solar:add-circle-bold' };
  const isBarristerQuickAction = role === 'barrister';
  const [headerCondensed, setHeaderCondensed] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isDashboardHero) {
      setHeaderCondensed(false);
      return undefined;
    }

    const handleScroll = () => {
      setHeaderCondensed(window.scrollY > 72);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDashboardHero]);

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
  const isHeaderMinimal = isListSubpage || isAuthSearch;
  const activeList = isListDetail ? sidebarLists.find((l) => l.id === listIdParam) : null;
  const listHeaderTitle = isListCreation ? 'New List' : activeList?.name || 'List';
  const mainClassName = isListSubpage
    ? 'w-full max-w-none px-0 pb-0 pt-0'
    : isDashboardHero
      ? 'mx-auto max-w-screen-2xl px-6 pb-8 pt-0 lg:px-14 xl:px-16 2xl:px-10'
      : 'mx-auto max-w-screen-2xl px-6 py-8 lg:px-14 xl:px-16 2xl:px-10';

  const dashboardHeaderLabel = role === 'clerk' ? 'Library Operations' : 'Research Workspace';
  const shellHeaderHeight = isDashboardHero && !headerCondensed ? 72 : 57;
  const headerClassName = isDashboardHero
    ? headerCondensed
      ? 'border-b border-border/60 bg-white/88 py-3 shadow-[0_12px_36px_rgba(15,23,42,0.08)] backdrop-blur-xl'
      : 'border-b border-white/18 bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.08))] py-4 shadow-[0_12px_32px_rgba(124,45,18,0.08)] backdrop-blur-xl'
    : isListSubpage ? 'border-b border-border/60 bg-white py-3' : 'border-b border-border/60 bg-white/80 py-3 backdrop-blur-sm';
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
  const headerUtilityButtonClassName = isDashboardHero && !headerCondensed
    ? 'relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-transparent text-white/90 transition-colors hover:bg-white/12 hover:text-white'
    : 'relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-transparent text-text-secondary transition-colors hover:bg-slate-100 hover:text-text';
  const headerProfileButtonClassName = `flex min-w-0 items-center gap-3 rounded-2xl px-2.5 py-1.5 text-left transition-colors ${
    isDashboardHero && !headerCondensed
      ? profileMenuOpen ? 'bg-white/14' : 'hover:bg-white/10'
      : profileMenuOpen ? 'bg-slate-100' : 'hover:bg-slate-100'
  }`;
  const currentNavLabel = navItems.find((item) => item.slug === normalizedSlug)?.label || 'Workspace';

  const leftHeaderLabel = isDashboardHero && !headerCondensed ? dashboardHeaderLabel : currentNavLabel;
  const leftHeaderTextClassName = isDashboardHero && !headerCondensed ? 'text-white/80' : 'text-text-muted';
  const leftChambersToneClassName = isDashboardHero && !headerCondensed
    ? onboarding.chambersLogo
      ? 'bg-white/18 ring-1 ring-white/22 backdrop-blur'
      : 'bg-white/14 text-white/90 ring-1 ring-white/22 backdrop-blur'
    : onboarding.chambersLogo
      ? 'bg-slate-100 ring-1 ring-slate-200'
      : 'bg-slate-100 text-text-secondary ring-1 ring-slate-200';
  const leftChambersNameClassName = isDashboardHero && !headerCondensed
    ? 'truncate text-sm font-medium text-white drop-shadow-[0_1px_1px_rgba(124,45,18,0.16)]'
    : 'truncate text-sm font-medium text-text';
  const headerSearchWrapperClassName = isDashboardHero && !headerCondensed
    ? 'relative hidden min-w-0 flex-1 md:block'
    : 'relative hidden min-w-0 flex-1 md:block';
  const handleHeaderSearchSubmit = (event) => {
    event.preventDefault();
    const trimmedQuery = headerQuery.trim();
    setShowSuggestions(false);

    if (role === 'clerk') {
      navigate(trimmedQuery ? `/app/catalogue?q=${encodeURIComponent(trimmedQuery)}` : '/app/catalogue');
      return;
    }

    navigate(trimmedQuery ? `/app/authorities?q=${encodeURIComponent(trimmedQuery)}` : '/app/authorities');
  };

  const handleSuggestionSelect = (suggestion) => {
    setShowSuggestions(false);
    setHeaderQuery('');
    if (role === 'clerk') {
      navigate(`/app/catalogue?q=${encodeURIComponent(suggestion.title)}`);
      return;
    }

    navigate(`/app/authorities?q=${encodeURIComponent(suggestion.title)}`);
  };

  const handleSearchKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSuggestionSelect(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  };

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
      <aside className={`fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-white p-4 shadow-lg transition-transform duration-300 ease-in-out md:z-20 md:translate-x-0 md:shadow-sm ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-3 pb-3 pt-2">
          <Link to="/app/dashboard" className="flex" onClick={() => setSidebarOpen(false)}>
            <img src="/assets/CLMS_logo.svg" alt="CLMS" className="h-6 w-auto" />
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-slate-100 hover:text-text md:hidden"
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
                      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
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
                      className={`mr-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
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
        className={`relative md:pl-64 ${isDashboardHero ? 'overflow-hidden' : ''}`}
        style={{ '--header-h': `${shellHeaderHeight}px` }}
      >
        {isDashboardHero && (
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[340px] bg-[linear-gradient(135deg,#9a3412_0%,#c2410c_18%,#ea580c_48%,#fb923c_100%)] md:h-[356px] lg:h-[372px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(255,255,255,0.22),transparent_22%),radial-gradient(circle_at_10%_0%,rgba(255,255,255,0.12),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0),rgba(255,255,255,0.06))]" />
          </div>
        )}

        {/* Top header */}
        <header ref={headerRef} className={`sticky top-0 z-10 transition-all duration-300 ${headerClassName}`}>
          <div className="flex items-center gap-4 px-6 md:gap-10 lg:px-14 xl:px-16 2xl:px-10">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-colors md:hidden ${
                isDashboardHero && !headerCondensed
                  ? 'text-white/90 hover:bg-white/12 hover:text-white'
                  : 'text-text-secondary hover:bg-slate-100 hover:text-text'
              }`}
              aria-label="Open menu"
            >
              <Icon name="solar:hamburger-menu-linear" size={24} />
            </button>
            <div className="shrink-0">
              {isAuthSearch ? (
                <Breadcrumb items={[
                  { label: 'Authority Lists', onClick: () => navigate('/app/authorities') },
                  { label: 'Search Results' },
                ]} />
              ) : isListSubpage ? (
                <Breadcrumb items={[
                  { label: 'Authority Lists', onClick: () => navigate('/app/authorities') },
                  { label: 'List Editor' },
                ]} />
              ) : (
                <>
                  <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${leftHeaderTextClassName}`}>{leftHeaderLabel}</p>
                  <div className="mt-1 flex items-center gap-2">
                    {renderChambersMark('h-7 w-7', leftChambersToneClassName, 14, 'rounded-full')}
                    <p className={leftChambersNameClassName}>
                      {onboarding.chambersName || 'Chambers Dashboard'}
                    </p>
                  </div>
                </>
              )}
            </div>

            <form onSubmit={handleHeaderSearchSubmit} ref={searchWrapperRef} className={`${headerSearchWrapperClassName} mx-auto${isHeaderMinimal ? ' !hidden' : ''}`} style={{ maxWidth: 500 }}>
              <div className="flex items-center gap-3 rounded-full border border-white/70 bg-white px-3 py-2 ring-1 ring-black/5">
                <span className="flex shrink-0 items-center justify-center pl-1 text-brand">
                  <Icon
                    name="solar:magnifer-linear"
                    size={18}
                  />
                </span>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={headerQuery}
                  onChange={(event) => { setHeaderQuery(event.target.value); setShowSuggestions(true); setActiveIndex(-1); }}
                  onFocus={() => { if (headerQuery.trim()) setShowSuggestions(true); }}
                  onKeyDown={handleSearchKeyDown}
                  placeholder={searchPlaceholder}
                  className="min-w-0 flex-1 bg-transparent py-1 text-sm text-text placeholder:text-slate-400 focus:outline-none"
                  autoComplete="off"
                  role="combobox"
                  aria-expanded={showSuggestions && suggestions.length > 0}
                  aria-autocomplete="list"
                  aria-controls="header-search-suggestions"
                />
                <button
                  type="submit"
                  className="inline-flex shrink-0 items-center justify-center rounded-full bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
                >
                  Search
                </button>
              </div>

              {/* Autosuggest dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  id="header-search-suggestions"
                  role="listbox"
                  className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 rounded-[24px] border border-slate-200 bg-white p-2 shadow-[0_22px_48px_rgba(15,23,42,0.14)] ring-1 ring-black/5"
                >
                  <p className="px-2 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">
                    Suggestions
                  </p>
                  {suggestions.map((s, idx) => (
                    <button
                      key={s.id}
                      type="button"
                      role="option"
                      aria-selected={idx === activeIndex}
                      onClick={() => handleSuggestionSelect(s)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors ${
                        idx === activeIndex ? 'bg-slate-100' : 'hover:bg-slate-50'
                      }`}
                    >
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        s.type === 'book' ? 'bg-brand/10 text-brand' : s.jadeType === 'legislation' ? 'bg-violet-100 text-violet-600' : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        <Icon name={s.icon} size={15} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-text">{s.title}</p>
                        <p className="truncate text-xs text-text-muted">{s.subtitle}</p>
                      </div>
                      {s.type === 'book' && (
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          s.status === 'available' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {s.status === 'available' ? 'Available' : 'On loan'}
                        </span>
                      )}
                      {s.type === 'jade' && (
                        <span className="shrink-0 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-600">
                          JADE
                        </span>
                      )}
                    </button>
                  ))}
                  <div className="mt-1 border-t border-slate-100 px-2 pt-2">
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2 rounded-lg px-1 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-slate-50 hover:text-brand"
                    >
                      <Icon name="solar:magnifer-linear" size={13} />
                      Search all for "{headerQuery}"
                      <span className="ml-auto rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-text-muted">Enter</span>
                    </button>
                  </div>
                </div>
              )}
            </form>

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
              <button type="button" className={headerUtilityButtonClassName} aria-label="Notifications">
                <Icon name="solar:bell-linear" size={24} />
                {pendingCount > 0 && (
                  <span className={`animate-bell-dot absolute right-2 top-2 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 ${isDashboardHero && !headerCondensed ? 'ring-2 ring-[rgba(234,88,12,0.4)]' : 'ring-2 ring-white'}`} />
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/app/settings')}
                className={headerUtilityButtonClassName}
                aria-label="Settings"
              >
                <Icon name="solar:settings-linear" size={24} />
              </button>
            </div>
          </div>
        </header>

        <main
          className={mainClassName}
          style={isListSubpage ? { height: `calc(100vh - ${measuredHeaderH}px)`, overflow: 'hidden' } : undefined}
        >
          {children}
        </main>
      </div>

    </div>
  );
}
