import { Link } from 'react-router-dom';
import Badge from '../atoms/Badge';
import Icon from '../atoms/Icon';
import { useAppContext } from '../../context/AppContext';

const navByRole = {
  barrister: [
    { label: 'Dashboard', slug: 'dashboard', icon: 'solar:home-2-linear' },
    { label: 'Search', slug: 'search', icon: 'solar:magnifer-linear' },
    { label: 'Authority Lists', slug: 'lists', icon: 'solar:list-check-linear' },
    { label: 'My Loans', slug: 'loans', icon: 'solar:book-bookmark-linear' },
    { label: 'Settings', slug: 'settings', icon: 'solar:settings-linear' },
  ],
  clerk: [
    { label: 'Dashboard', slug: 'dashboard', icon: 'solar:home-2-linear' },
    { label: 'Catalogue', slug: 'catalogue', icon: 'solar:book-2-linear' },
    { label: 'Loans', slug: 'loans', icon: 'solar:book-bookmark-linear' },
    { label: 'Members', slug: 'members', icon: 'solar:users-group-rounded-linear' },
    { label: 'Reports', slug: 'reports', icon: 'solar:clipboard-list-linear' },
    { label: 'Locations', slug: 'locations', icon: 'solar:map-point-linear' },
    { label: 'Settings', slug: 'settings', icon: 'solar:settings-linear' },
  ],
};

export default function AppShell({ role, children }) {
  const { onboarding } = useAppContext();
  const isJoined = onboarding.mode === 'joined' && onboarding.chambersName;

  const navItems = navByRole[role];
  const mainNav = navItems.filter((item) => item.slug !== 'settings');
  const settingsNav = navItems.find((item) => item.slug === 'settings');

  return (
    <div className="min-h-screen bg-white">
      <aside className="fixed left-0 top-0 z-10 hidden h-screen w-64 flex-col border-r border-border bg-slate-50 p-5 md:flex">
        <div>
          <div className="pt-1">
            <p className="font-serif text-xl text-text">CLMS</p>
            <Badge variant="role">{role}</Badge>
            {isJoined && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                <Icon name="solar:buildings-linear" size={12} />
                {onboarding.chambersName}
              </div>
            )}
          </div>
          <nav className="mt-4 space-y-1">
            {mainNav.map((item) => (
              <Link
                key={item.label}
                to={`/app/${item.slug}`}
                className="block rounded-xl px-3 py-2.5 text-sm text-text-secondary hover:bg-slate-200 hover:text-text"
              >
                <span className="inline-flex items-center gap-2">
                  <Icon name={item.icon} size={16} />
                  <span>{item.label}</span>
                </span>
              </Link>
            ))}
          </nav>
        </div>
        {settingsNav && (
          <div className="mt-auto border-t border-border pt-3">
            <Link
              to={`/app/${settingsNav.slug}`}
              className="block rounded-xl px-3 py-2.5 text-sm text-text-secondary hover:bg-slate-200 hover:text-text"
            >
              <span className="inline-flex items-center gap-2">
                <Icon name={settingsNav.icon} size={16} />
                <span>{settingsNav.label}</span>
              </span>
            </Link>
          </div>
        )}
      </aside>
      <main className="min-h-screen bg-white md:ml-64">
        <div className="mx-auto max-w-5xl px-6 py-8 lg:px-10">
          {children}
        </div>
      </main>
    </div>
  );
}
