import { Link } from 'react-router-dom';
import Icon from '../atoms/Icon';
import Button from '../atoms/Button';

export default function FooterSection({ role = 'barrister' }) {
  return (
    <footer id="support" className="relative z-10 w-full bg-[var(--color-bg-dark)] py-16 text-slate-400">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 grid grid-cols-1 gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <h4 className="mb-3 font-serif text-base font-semibold text-white">Chambers Library Management System</h4>
            <p className="mb-4 max-w-sm text-sm leading-relaxed">
              Search and cite from anywhere. Track every book in your library. One system for barristers and clerks.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link to={`/signup?role=${role}`}>
                <Button variant="primary" size="sm" className="px-4 py-2 text-sm">
                  Get Started
                </Button>
              </Link>
              <Button type="button" size="sm" variant="secondary" className="px-4 py-2 text-sm">
                <Icon name="solar:calendar-linear" size={14} />
                <span>Book a Walkthrough</span>
              </Button>
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-medium uppercase tracking-widest text-white">Product</h4>
            <ul className="space-y-3">
              <li><a href="#features" className="text-sm transition hover:text-white">Features</a></li>
              <li><a href="#why-clms" className="text-sm transition hover:text-white">Why CLMS</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-medium uppercase tracking-widest text-white">Support</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm transition hover:text-white">Documentation</a></li>
              <li><a href="#" className="text-sm transition hover:text-white">Technical Support</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 text-center text-xs">
          <div className="mb-4 flex justify-center">
            <img src="/assets/CLMS_logo.svg" alt="CLMS" className="h-5 opacity-30 brightness-0 invert" />
          </div>
          <p>&copy; 2026 Chambers Library Management System. Built for Australian legal professionals.</p>
        </div>
      </div>
    </footer>
  );
}
