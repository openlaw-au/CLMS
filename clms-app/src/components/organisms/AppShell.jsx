import { Link } from 'react-router-dom';
import Badge from '../atoms/Badge';
import Icon from '../atoms/Icon';

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
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 gap-4 p-4 md:grid-cols-[220px_1fr]">
        <aside className="rounded-2xl border border-border bg-white p-4">
          <p className="font-serif text-xl text-text">CLMS</p>
          <Badge variant="role">{role}</Badge>
          <nav className="mt-4 space-y-1">
            {navByRole[role].map((item) => (
              <Link
                key={item.label}
                to={`/app/${item.slug}`}
                className="block rounded-xl px-3 py-2 text-sm text-text-secondary hover:bg-slate-100 hover:text-text"
              >
                <span className="inline-flex items-center gap-2">
                  <Icon name={item.icon} size={16} />
                  <span>{item.label}</span>
                </span>
              </Link>
            ))}
          </nav>
        </aside>
        <main className="rounded-2xl border border-border bg-white p-6">{children}</main>
      </div>
    </div>
  );
}
