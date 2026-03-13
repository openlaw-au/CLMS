import { Link } from 'react-router-dom';
import Icon from '../atoms/Icon';
import Logo from '../atoms/Logo';
import AuthValuePanel from '../organisms/AuthValuePanel';

export default function AuthSplitLayout({ role, mode, children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-brand via-brand to-sky-400" />

      <div className="relative lg:hidden">
        <section className="bg-[#f3efe8] px-6 pb-12 pt-10 sm:px-8">
          <AuthValuePanel role={role} mode={mode} compact />
        </section>

        <section className="bg-white px-6 pb-10 pt-8 sm:px-8">
          <div className="mx-auto w-full max-w-md">
            <Link to="/" className="mb-6 flex justify-center">
              <Logo className="h-8 opacity-95" />
            </Link>
            {children}
          </div>
        </section>
      </div>

      <div className="relative hidden min-h-screen lg:grid lg:grid-cols-2">
        <section className="relative flex min-h-screen items-center justify-center border-r border-slate-200/80 bg-white px-6 py-10 sm:px-10 lg:px-14 xl:px-[72px]">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center justify-start">
              <Link
                to="/"
                className="inline-flex items-center justify-self-start gap-2 rounded-full px-3 py-2 text-sm font-medium text-text-secondary transition-all hover:bg-slate-100 hover:text-text"
              >
                <Icon name="solar:alt-arrow-left-linear" size={16} />
                Back to home
              </Link>
            </div>

            {children}
          </div>
        </section>

        <section className="relative hidden min-h-screen items-center justify-center bg-[#f3efe8] px-10 py-12 lg:flex lg:px-14 xl:px-[72px]">
          <AuthValuePanel role={role} mode={mode} />
        </section>
      </div>
    </div>
  );
}
