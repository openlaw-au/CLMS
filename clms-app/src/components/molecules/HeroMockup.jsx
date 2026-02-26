import { useEffect, useState } from 'react';
import Icon from '../atoms/Icon';
import ReviewCard from './ReviewCard';

function AnimatedCount({ target, delay = 0 }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let rafId = 0;
    let timeoutId = 0;
    const duration = 800;
    const start = performance.now();

    const step = (timestamp) => {
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.round(eased * target));
      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      }
    };

    timeoutId = window.setTimeout(() => {
      rafId = requestAnimationFrame(step);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(rafId);
    };
  }, [delay, target]);

  return value.toLocaleString();
}

function BarristerMockup({ reviews }) {
  return (
    <div className="tab-mockup active animate relative" id="mockup-barristers" key="barrister-mockup">
      <ReviewCard className="review-card-left" {...reviews[0]} />
      <ReviewCard className="review-card-right" {...reviews[1]} />

      <div className="relative z-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center gap-1.5 border-b border-slate-200 bg-slate-100 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
          <span className="ml-3 text-[10px] font-medium text-slate-400">clms.app/search</span>
        </div>

        <div className="relative min-h-[380px] bg-white p-4">
          <div className="mockup-scan-line" />
          <div className="mockup-search-bar mb-4 flex items-center gap-2">
            <div className="flex flex-1 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
              <Icon name="solar:magnifer-linear" size={14} className="text-slate-400" />
              <span className="mockup-search-query">Cross on Evidence</span>
            </div>
            <div className="rounded-lg bg-brand px-2.5 py-2 text-[14px] leading-[14px]">
              <Icon name="solar:magnifer-linear" size={14} className="block text-white" />
            </div>
          </div>

          <div className="mockup-result-count mb-3 text-[10px] text-slate-400">3 results across books and case law</div>

          <div className="space-y-2.5">
            <div className="mockup-result rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="mb-1 flex items-start justify-between">
                <div className="text-[11px] font-semibold text-text">Cross on Evidence</div>
                <span className="badge-pulse rounded-full bg-green-50 px-1.5 py-0.5 text-[9px] font-medium text-green-600">Available</span>
              </div>
              <div className="text-[10px] text-slate-400">J.D. Heydon · Owen Dixon East · 12th Edition</div>
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded bg-orange-50 px-1.5 py-0.5 text-[9px] font-medium text-brand">Book</span>
                <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-medium text-blue-600">Evidence</span>
              </div>
            </div>

            <div className="mockup-result rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="mb-1 flex items-start justify-between">
                <div className="text-[11px] font-semibold text-text">Evidence Act 1995 (Cth)</div>
                <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[9px] font-medium text-blue-600">JADE</span>
              </div>
              <div className="text-[10px] text-slate-400">Federal legislation · Current version</div>
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded bg-purple-50 px-1.5 py-0.5 text-[9px] font-medium text-purple-600">Legislation</span>
                <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-medium text-blue-600">Evidence</span>
              </div>
            </div>

            <div className="mockup-result rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="mb-1 flex items-start justify-between">
                <div className="text-[11px] font-semibold text-text">Dasreef v Hawchar [2011] HCA 21</div>
                <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[9px] font-medium text-blue-600">JADE</span>
              </div>
              <div className="text-[10px] text-slate-400">High Court of Australia · Expert evidence</div>
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded bg-green-50 px-1.5 py-0.5 text-[9px] font-medium text-green-600">Case Law</span>
                <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-medium text-blue-600">Evidence</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClerkMockup({ reviews }) {
  return (
    <div className="tab-mockup active animate relative" id="mockup-clerks" key="clerk-mockup">
      <ReviewCard className="review-card-left" {...reviews[0]} />
      <ReviewCard className="review-card-right" {...reviews[1]} />

      <div className="relative z-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center gap-1.5 border-b border-slate-200 bg-slate-100 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
          <span className="ml-3 text-[10px] font-medium text-slate-400">clms.app/dashboard</span>
        </div>

        <div className="flex min-h-[380px]">
          <aside className="hidden w-36 shrink-0 flex-col border-r border-slate-100 bg-slate-50 p-3 sm:flex">
            <nav className="space-y-0.5">
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-brand shadow-sm">
                <Icon name="solar:home-2-linear" size={14} />
                <span>Dashboard</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-slate-500">
                <Icon name="solar:book-linear" size={14} />
                <span>Library</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-slate-500">
                <Icon name="solar:transfer-horizontal-linear" size={14} />
                <span>Lending</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-slate-500">
                <Icon name="solar:users-group-rounded-linear" size={14} />
                <span>Members</span>
              </div>
            </nav>
          </aside>

          <div className="flex-1 overflow-hidden bg-white p-4">
            <div className="mockup-dash-header">
              <div className="mb-1 font-serif text-sm font-semibold text-text">Dashboard</div>
              <div className="mb-4 text-[10px] text-slate-400">Overview across all locations</div>
            </div>

            <div className="mb-4 grid grid-cols-3 gap-2">
              <div className="mockup-stat rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-center">
                <div className="font-serif text-lg font-semibold text-text"><AnimatedCount target={1250} delay={500} /></div>
                <div className="text-[9px] text-slate-400">Total Books</div>
              </div>
              <div className="mockup-stat rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-center">
                <div className="font-serif text-lg font-semibold text-brand"><AnimatedCount target={23} delay={700} /></div>
                <div className="text-[9px] text-slate-400">On Loan</div>
              </div>
              <div className="mockup-stat rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-center">
                <div className="font-serif text-lg font-semibold text-red-500"><AnimatedCount target={5} delay={900} /></div>
                <div className="text-[9px] text-slate-400">Overdue</div>
              </div>
            </div>

            <div className="mockup-activity-header mb-2 text-[10px] font-medium uppercase tracking-wider text-slate-500">Recent Activity</div>
            <div className="space-y-2">
              <div className="mockup-activity flex items-center gap-2 text-[10px]">
                <span className="dot-pulse h-1.5 w-1.5 shrink-0 rounded-full bg-green-400" />
                <span className="text-slate-600"><span className="font-medium text-text">Cross on Evidence</span> returned</span>
                <span className="ml-auto text-slate-300">2h ago</span>
              </div>
              <div className="mockup-activity flex items-center gap-2 text-[10px]">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                <span className="text-slate-600"><span className="font-medium text-text">Heydon on Contract</span> borrowed</span>
                <span className="ml-auto text-slate-300">5h ago</span>
              </div>
              <div className="mockup-activity flex items-center gap-2 text-[10px]">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                <span className="text-slate-600"><span className="font-medium text-text">Dal Pont on Lawyers</span> catalogued</span>
                <span className="ml-auto text-slate-300">1d ago</span>
              </div>
              <div className="mockup-activity flex items-center gap-2 text-[10px]">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                <span className="text-slate-600"><span className="font-medium text-text">Overdue reminder</span> sent to 3 members</span>
                <span className="ml-auto text-slate-300">1d ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HeroMockup({ role, reviews }) {
  if (role === 'clerk') {
    return <ClerkMockup key="clerk" reviews={reviews} />;
  }

  return <BarristerMockup key="barrister" reviews={reviews} />;
}
