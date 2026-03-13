import { Link } from 'react-router-dom';
import Logo from '../atoms/Logo';
import PersonaToggle from '../atoms/PersonaToggle';
import Button from '../atoms/Button';

export default function Navbar({
  role,
  onRoleChange,
  showNavRoleToggle = false,
  activeSection = '',
  onNavigateSection = () => {},
}) {
  const handleLogoClick = (event) => {
    if (window.location.pathname === '/' && !window.location.search && !window.location.hash) {
      event.preventDefault();
      window.location.reload();
    }
  };

  return (
    <header className="sticky top-0 left-0 right-0 z-50 w-full">
      <nav className="animate-fade-in border-b border-slate-200 bg-[var(--color-bg)]/90 backdrop-blur-md">
        <div className="relative mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-12">
          <div className="flex items-center gap-6">
            <a href="/" className="flex items-center" onClick={handleLogoClick}>
              <Logo className="h-8" />
            </a>

            <div id="nav-toggle" className={`hidden md:block ${showNavRoleToggle ? 'visible' : ''}`}>
              <PersonaToggle compact value={role} onChange={onRoleChange} />
            </div>
          </div>

          <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a
              href="#features"
              onClick={(event) => {
                event.preventDefault();
                onNavigateSection('features');
              }}
              className={`nav-link transition-colors hover:text-text ${activeSection === 'features' ? 'active' : ''}`}
              data-section="features"
            >
              Features
            </a>
            <a
              href="#why-clms"
              onClick={(event) => {
                event.preventDefault();
                onNavigateSection('why-clms');
              }}
              className={`nav-link transition-colors hover:text-text ${activeSection === 'why-clms' ? 'active' : ''}`}
              data-section="why-clms"
            >
              Why CLMS
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link to={`/login?role=${role}`}>
              <Button variant="secondary" size="sm">Login</Button>
            </Link>
            <Link to={`/signup?role=${role}`}>
              <Button variant="primary" size="sm">Sign Up</Button>
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
