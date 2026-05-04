import Icon from '../atoms/Icon';
import Logo from '../atoms/Logo';
import { authContent } from '../../mocks/authContent';

function MobileBarristerPreview() {
  return (
    <div className="relative mx-auto mt-8 max-w-sm">
      <div className="overflow-hidden rounded-metric-card border border-white/80 bg-white/92 shadow-[0_28px_70px_rgba(15,23,42,0.12)]">
        <div className="flex items-center gap-1.5 border-b border-slate-200 bg-white px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
          <span className="ml-3 text-[10px] font-medium text-slate-400">clms.app/search</span>
        </div>

        <div className="space-y-3 p-4">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500">
            <Icon name="solar:magnifer-linear" size={16} className="text-slate-400" />
            <span>Cross on Evidence</span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-text">Cross on Evidence</p>
                <p className="mt-1 text-[11px] text-slate-500">J.D. Heydon · 5th Edition · East, Flr 5</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-700">
                Available
              </span>
            </div>
            <div className="mt-3 flex gap-2">
              <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-medium text-blue-600 ring-1 ring-blue-200">
                Request loan
              </span>
              <span className="rounded-full bg-blue-600 px-2.5 py-1 text-[10px] font-medium text-white">
                Add to list
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-700">Authority list</p>
              <span className="rounded-full bg-white px-2 py-1 text-[9px] font-medium text-slate-500 ring-1 ring-blue-100">
                AGLC4
              </span>
            </div>
            <div className="mt-3 space-y-2">
              <div className="rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-blue-100">
                <p className="text-sm font-semibold text-text">Smith v Jones [2024]</p>
                <p className="mt-1 text-[11px] text-slate-500">12 entries · 3 missing pinpoints</p>
              </div>
              <div className="rounded-xl bg-blue-600 px-3 py-2.5 text-white shadow-sm">
                <p className="text-sm font-semibold">Export for court</p>
                <p className="mt-0.5 text-[11px] text-blue-100">Clean structure, formatted citations.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -left-4 bottom-8 rounded-[22px] border border-white/90 bg-white/95 px-4 py-3 shadow-[0_18px_50px_rgba(15,23,42,0.14)]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Research flow</p>
        <p className="mt-1.5 text-sm font-semibold text-text">Search - List - Cite</p>
      </div>
    </div>
  );
}

function MobileClerkPreview() {
  const bookSwatches = ['bg-[#b63f2f]', 'bg-[#e8e1d4]', 'bg-[#b9aa4a]', 'bg-[#c7d8ee]', 'bg-[#f0d0b5]', 'bg-[#eadfed]'];

  return (
    <div className="relative mx-auto mt-8 max-w-sm">
      <div className="overflow-hidden rounded-metric-card border border-white/80 bg-white/92 shadow-[0_28px_70px_rgba(15,23,42,0.12)]">
        <div className="flex items-center gap-1.5 border-b border-slate-200 bg-white px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
          <span className="ml-3 text-[10px] font-medium text-slate-400">clms.app/catalogue</span>
        </div>

        <div className="grid grid-cols-[84px_minmax(0,1fr)] gap-3 p-4">
          <div className="rounded-[20px] bg-slate-950 px-3 py-4 text-slate-300">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Workspace</p>
            <div className="mt-3 space-y-2">
              {['Dashboard', 'Catalogue', 'Loans'].map((item, index) => (
                <div
                  key={item}
                  className={`rounded-lg px-2.5 py-1.5 text-[11px] ${index === 1 ? 'bg-brand text-white' : 'text-slate-400'}`}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3 grid grid-cols-3 gap-2">
              {bookSwatches.map((swatch, index) => (
                <div key={index} className={`h-20 rounded-lg ${swatch} shadow-sm`} />
              ))}
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5">
              <p className="text-sm font-semibold text-text">Books Collection</p>
              <p className="mt-1 text-[11px] text-slate-500">Manage stock, metadata, and requests.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -left-4 bottom-12 w-36 rounded-[22px] border border-white/90 bg-white/95 p-3 shadow-[0_18px_50px_rgba(15,23,42,0.14)]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Borrowing trend</p>
        <div className="mt-2 flex h-16 items-end gap-1.5">
          {[20, 32, 26, 42, 34, 48, 30].map((height, index) => (
            <span key={index} className="w-3 rounded-t bg-brand/80" style={{ height }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AuthValuePanel({ role, mode, compact = false }) {
  const content = authContent[role][mode];

  if (compact) {
    return (
      <section className="lg:hidden">
        <div className="flex flex-col items-center text-center">
          <Logo className="h-10 opacity-90" />
          <h2 className="mt-7 max-w-[12ch] font-serif text-4xl leading-[1.06] tracking-tight text-text">
            {content.heading}
          </h2>
          <p className="mt-4 max-w-[32ch] text-sm leading-relaxed text-slate-600">{content.description}</p>
        </div>

        {role === 'clerk' ? <MobileClerkPreview /> : <MobileBarristerPreview />}
      </section>
    );
  }

  return (
    <section className="relative hidden w-full max-w-[620px] lg:flex">
      <div className="absolute -left-20 bottom-8 h-72 w-72 rounded-full bg-brand/10 blur-3xl" />
      <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl" />

      <div className="relative flex w-full items-center justify-center">
        <div className="flex max-w-[520px] flex-col items-center text-center">
          <Logo className="h-14 opacity-30 blur-[0.4px]" />
          <h2 className="mt-8 max-w-[14ch] font-serif text-[40px] leading-[1.06] tracking-tight text-text xl:text-[48px]">
            {content.heading}
          </h2>
          <p className="mt-4 max-w-[44ch] text-base leading-relaxed text-slate-600">{content.description}</p>
        </div>
      </div>
    </section>
  );
}
