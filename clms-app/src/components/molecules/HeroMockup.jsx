import { useEffect, useState } from 'react';
import Icon from '../atoms/Icon';
import Tag from '../atoms/Tag';
import ReviewCard from './ReviewCard';
import { reviewCards } from '../../mocks/landingContent';

/* ──────────────────────────────────────────
   Animation loop — holds final scene, then fades
   and immediately restarts via key remount.
   ────────────────────────────────────────── */
function useAnimationLoop(holdUntil = 7800) {
  const [cycle, setCycle] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Hold final scene for 2s after last animation, then fade out
    const t1 = setTimeout(() => setFading(true), holdUntil);
    // After fade (500ms) → restart immediately (no empty pause)
    const t2 = setTimeout(() => {
      setCycle((c) => c + 1);
      setFading(false);
    }, holdUntil + 500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [cycle, holdUntil]);

  return { cycle, fading };
}

function AnimatedCount({ target, delay = 0, secondTarget, secondDelay }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const timers = [];
    const rafs = [];
    const duration = 800;

    // First count-up
    timers.push(window.setTimeout(() => {
      const start = performance.now();
      const step = (timestamp) => {
        const progress = Math.min((timestamp - start) / duration, 1);
        const eased = 1 - (1 - progress) ** 3;
        setValue(Math.round(eased * target));
        if (progress < 1) rafs.push(requestAnimationFrame(step));
      };
      rafs.push(requestAnimationFrame(step));
    }, delay));

    // Optional second count (e.g. 3 → 2)
    if (secondTarget != null && secondDelay) {
      timers.push(window.setTimeout(() => {
        const start = performance.now();
        const from = target;
        const step = (timestamp) => {
          const progress = Math.min((timestamp - start) / 400, 1);
          const eased = 1 - (1 - progress) ** 3;
          setValue(Math.round(from + (secondTarget - from) * eased));
          if (progress < 1) rafs.push(requestAnimationFrame(step));
        };
        rafs.push(requestAnimationFrame(step));
      }, secondDelay));
    }

    return () => {
      timers.forEach(clearTimeout);
      rafs.forEach(cancelAnimationFrame);
    };
  }, [delay, target, secondDelay, secondTarget]);

  return value.toLocaleString();
}

/* ──────────────────────────────────────────
   Browser chrome (shared)
   ────────────────────────────────────────── */
function BrowserChrome({ children }) {
  return (
    <div className="flex items-center gap-1.5 border-b border-slate-200 bg-slate-100 px-4 py-2.5">
      <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
      <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
      <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════
   BARRISTER MOCKUP
   One search → Book + JADE together → Authority List → Export
   No fluff. Action and result only.
   ══════════════════════════════════════════ */
function BarristerMockup() {
  // Last animation: review cards at ~8.0s + 8s hold
  const { cycle, fading } = useAnimationLoop(16000);

  return (
    <div className="tab-mockup active animate relative" id="mockup-barristers">
      <div key={cycle} className={fading ? 'opacity-0 transition-opacity duration-500' : ''}>
        <div className="relative z-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <BrowserChrome>
            <span className="ml-3 text-2xs font-medium text-slate-400">clms.app/search</span>
          </BrowserChrome>

          <div className="min-h-[380px] bg-white p-4">

            {/* Search bar */}
            <div className="mockup-search-bar mb-4 flex items-center gap-2">
              <div className="flex h-8 flex-1 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[11px]">
                <Icon name="solar:magnifer-linear" size={14} className="shrink-0 text-slate-400" />
                <span className="mockup-search-query leading-none">Cross on Evidence</span>
              </div>
              <div className="relative flex h-8 items-center rounded-lg bg-brand px-2.5">
                <Icon name="solar:magnifer-linear" size={14} className="mockup-search-icon block text-white" />
                <span className="mockup-search-spinner absolute inset-0 m-auto h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white" />
              </div>
            </div>

            {/* Skeleton → Results swap (same position, no gap) */}
            <div className="relative">
              {/* Skeleton cards — appear immediately, fade out when results arrive */}
              <div className="mockup-skeleton absolute inset-0 space-y-2.5">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="h-3 w-3/5 animate-pulse rounded bg-slate-200/70" />
                  <div className="mt-2 h-2.5 w-2/5 animate-pulse rounded bg-slate-100" />
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex gap-1">
                      <div className="h-4 w-10 animate-pulse rounded bg-slate-100" />
                      <div className="h-4 w-14 animate-pulse rounded bg-slate-100" />
                    </div>
                    <div className="flex gap-1">
                      <div className="h-5 w-14 animate-pulse rounded-md bg-slate-100" />
                      <div className="h-5 w-20 animate-pulse rounded-md bg-slate-200/60" />
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="h-3 w-2/5 animate-pulse rounded bg-slate-200/70" />
                  <div className="mt-2 h-2.5 w-3/5 animate-pulse rounded bg-slate-100" />
                  <div className="mt-3 flex gap-1">
                    <div className="h-4 w-16 animate-pulse rounded bg-slate-100" />
                    <div className="h-4 w-12 animate-pulse rounded bg-slate-100" />
                  </div>
                </div>
              </div>

              {/* Real results */}
              <div className="mockup-results space-y-2.5">

              {/* Result 1: Physical book with live status */}
              <div className="mockup-result relative rounded-xl border border-slate-100 bg-slate-50 p-3">
                <span className="mockup-available-badge absolute right-3 top-3 inline-flex h-5 items-center rounded-full bg-black/8 px-2 text-[9px] font-medium leading-none text-slate-600">Available</span>
                <span className="mockup-status-requested absolute right-3 top-3 inline-flex h-5 items-center rounded-full bg-black/8 px-2 text-[9px] font-medium leading-none text-slate-600">Requested</span>
                <div className="text-[11px] font-semibold text-text">Cross on Evidence</div>
                <div className="mt-0.5 text-2xs text-slate-400">J.D. Heydon · 5th Edition</div>
                <div className="mt-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-500">Book</span>
                    <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-medium text-emerald-700">
                      Available
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex h-5 items-center">
                      <span className="mockup-request-btn inline-flex h-5 items-center rounded-md border border-blue-200 bg-white px-2.5 text-[9px] font-semibold leading-none text-blue-600 shadow-sm">
                        Request
                      </span>
                      <span className="mockup-requested-btn absolute right-0 top-0 inline-flex h-5 items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2.5 text-[9px] font-semibold leading-none text-blue-600 whitespace-nowrap">
                        <Icon name="solar:check-circle-linear" size={10} className="shrink-0" />
                        Requested
                      </span>
                      <span className="mockup-cursor-track pointer-events-none absolute inset-0 z-10 m-auto h-9 w-9 rounded-full" />
                    </div>
                    <div className="relative flex h-5 items-center">
                      <span className="mockup-add-list-btn inline-flex h-5 items-center gap-0.5 rounded-md bg-blue-600 px-2.5 text-[9px] font-semibold leading-none text-white shadow-sm">
                        <Icon name="solar:add-circle-linear" size={10} className="shrink-0" />
                        Authority List
                      </span>
                      <span className="mockup-added-list-btn absolute right-0 top-0 inline-flex h-5 items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2.5 text-[9px] font-semibold leading-none text-blue-600 whitespace-nowrap">
                        <Icon name="solar:check-circle-linear" size={10} className="shrink-0" />
                        Added to List
                      </span>
                      <span className="mockup-cursor-cite pointer-events-none absolute inset-0 z-10 m-auto h-9 w-9 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Result 2: JADE — same search, digital resource right below */}
              <div className="mockup-result relative rounded-xl border border-slate-100 bg-slate-50 p-3">
                <span className="absolute right-3 top-3 inline-flex h-5 items-center rounded-full bg-black/8 px-2">
                  <img src="/jade.svg" alt="JADE" className="h-2.5" />
                </span>
                <div className="mb-1">
                  <div className="text-[11px] font-semibold text-text">Evidence Act 1995 (Cth)</div>
                </div>
                <div className="text-2xs text-slate-400">Federal legislation · Current version</div>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="rounded bg-legislation/5 px-1.5 py-0.5 text-[9px] font-medium text-legislation">Legislation</span>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-500">Federal</span>
                </div>
              </div>
            </div>
            </div>

            {/* Authority List panel — payoff: search result → court-ready list */}
            <div className="mockup-authority-panel mt-3 rounded-xl border border-blue-200 bg-blue-50/50 p-3">
              <div className="mb-2 flex items-center">
                <span className="text-2xs font-semibold text-blue-600">Authority List</span>
                <span className="ml-auto text-[9px] text-slate-400">AGLC4</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="mockup-list-item flex min-w-0 flex-1 items-start gap-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                    <Icon name="solar:book-2-linear" size={12} className="text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[9px] font-medium text-slate-600">Cross on Evidence, ch 4</div>
                    <div className="text-[8px] text-slate-400">Court-ready citation format</div>
                  </div>
                </div>
                <span className="mockup-export-btn inline-flex shrink-0 items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1 text-[9px] font-semibold text-white shadow-sm">
                  <Icon name="solar:file-download-linear" size={11} className="shrink-0" />
                  Export PDF
                </span>
              </div>
            </div>

            {/* Success toast — slides down from top after Request click */}
            <div className="mockup-track-toast absolute left-3 right-3 top-[42px] z-30 flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 shadow-sm">
              <Icon name="solar:check-circle-bold" size={11} className="shrink-0 text-emerald-500" />
              <span className="text-[9px] font-medium text-emerald-700">Loan requested</span>
              <span className="text-[9px] text-slate-400">Clerk notified</span>
            </div>

          </div>
        </div>

        {/* Review cards — floating overlays, hidden on mobile/tablet */}
        <ReviewCard
          className="mockup-review-left hidden lg:block"
          {...reviewCards.barrister[0]}
        />
        <ReviewCard
          className="mockup-review-right hidden lg:block"
          {...reviewCards.barrister[1]}
        />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   CLERK MOCKUP
   Story: Quick ISBN scan → RDA enrichment → Control Tower dashboard → Approve action
   Energy: Order + Control — chaos becomes managed
   ══════════════════════════════════════════ */
function ClerkMockup() {
  // Last animation: clerk review cards at ~17.2s + 8s hold
  const { cycle, fading } = useAnimationLoop(25500);

  return (
    <div className="tab-mockup active animate relative" id="mockup-clerks">
      <div key={cycle} className={fading ? 'opacity-0 transition-opacity duration-500' : ''}>
      <div className="relative z-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <BrowserChrome>
          <span className="ml-3 text-2xs font-medium text-slate-400">clms.app</span>
        </BrowserChrome>

        <div className={`flex min-h-[380px]`}>
          {/* Sidebar */}
              <aside className="hidden w-36 shrink-0 flex-col border-r border-slate-100 bg-slate-50 p-3 sm:flex">
                <nav className="space-y-0.5">
                  <div className="mockup-nav-dash flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-brand shadow-sm">
                    <Icon name="solar:home-2-linear" size={14} />
                    <span>Dashboard</span>
                  </div>
                  <div className="mockup-nav-cat relative flex items-center gap-2 rounded-lg border border-transparent bg-transparent px-2.5 py-1.5 text-[11px] font-medium text-slate-500">
                    <Icon name="solar:book-2-linear" size={14} />
                    <span>Library</span>
                    <span className="mockup-cursor-nav-cat pointer-events-none absolute inset-0 z-10 m-auto h-8 w-8 rounded-full" />
                  </div>
                  <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-slate-500">
                    <Icon name="solar:transfer-horizontal-linear" size={14} />
                    <span>Loans</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-slate-500">
                <Icon name="solar:users-group-rounded-linear" size={14} />
                <span>Members</span>
              </div>
            </nav>
          </aside>

          {/* Main content area */}
          <div className="relative flex-1 overflow-hidden bg-white">

            {/* ── Phase 0: Dashboard welcome — static skeleton ── */}
            <div className="mockup-dash-welcome pointer-events-none absolute inset-0 z-15 p-4">
              <div className="mb-1 font-serif text-sm font-semibold text-text">Hi, John</div>
              <div className="mb-3 text-2xs text-slate-400">Your library at a glance</div>
              <div className="mb-3 grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center rounded-xl bg-slate-50 p-2">
                  <div className="h-4 w-6 rounded bg-slate-200/70" />
                  <div className="mt-1 h-2 w-10 rounded bg-slate-100" />
                </div>
                <div className="flex flex-col items-center rounded-xl bg-slate-50 p-2">
                  <div className="h-4 w-6 rounded bg-slate-200/70" />
                  <div className="mt-1 h-2 w-10 rounded bg-slate-100" />
                </div>
                <div className="flex flex-col items-center rounded-xl bg-slate-50 p-2">
                  <div className="h-4 w-6 rounded bg-slate-200/70" />
                  <div className="mt-1 h-2 w-10 rounded bg-slate-100" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                  <div className="h-2.5 w-3/5 rounded bg-slate-200/70" />
                  <div className="mt-1.5 h-2 w-2/5 rounded bg-slate-100" />
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                  <div className="h-2.5 w-2/5 rounded bg-slate-200/70" />
                  <div className="mt-1.5 h-2 w-3/5 rounded bg-slate-100" />
                </div>
              </div>
            </div>

            {/* Loading skeleton after Library nav click */}
            <div className="mockup-cat-loading pointer-events-none absolute inset-0 z-20 p-4">
              <div className="mb-2 h-3.5 w-28 animate-pulse rounded bg-slate-200/70" />
              <div className="mb-3 h-8 w-full animate-pulse rounded-lg bg-slate-100" />
              <div className="space-y-2">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="h-3 w-3/5 animate-pulse rounded bg-slate-200/70" />
                  <div className="mt-2 h-2.5 w-2/5 animate-pulse rounded bg-slate-100" />
                  <div className="mt-2 flex gap-1">
                    <div className="h-4 w-14 animate-pulse rounded bg-slate-100" />
                    <div className="h-4 w-12 animate-pulse rounded bg-slate-100" />
                  </div>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="h-3 w-2/5 animate-pulse rounded bg-slate-200/70" />
                  <div className="mt-2 h-2.5 w-3/5 animate-pulse rounded bg-slate-100" />
                  <div className="mt-2 flex gap-1">
                    <div className="h-4 w-16 animate-pulse rounded bg-slate-100" />
                    <div className="h-4 w-10 animate-pulse rounded bg-slate-100" />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Phase 1-2: Library — ISBN scan + RDA enrichment ── */}
            <div className="mockup-cat-phase pointer-events-none absolute inset-0 z-10 p-4">
              <div className="mockup-dash-header">
                <div className="mb-2 font-serif text-sm font-semibold text-text">Add to Library</div>
                {/* Method tabs — reusing persona-toggle / hero-tab styles */}
                <div className="persona-toggle mockup-compact mb-3">
                  <span className="hero-tab mockup-compact active">
                    <span className="inline-flex items-center gap-1">
                      <Icon name="solar:pen-new-square-linear" size={10} />
                      <span>Enter ISBN</span>
                    </span>
                  </span>
                  <span className="hero-tab mockup-compact">
                    <span className="inline-flex items-center gap-1">
                      <Icon name="solar:scanner-linear" size={10} />
                      <span>Scan Barcode</span>
                    </span>
                  </span>
                </div>
              </div>

              {/* ISBN input field */}
              <div className="mockup-isbn-scan mb-3 flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5">
                <Icon name="solar:magnifer-linear" size={14} className="shrink-0 text-slate-400" />
                <span className="mockup-isbn-typing text-[11px] font-medium leading-none text-text">978-0-409-343953</span>
                <span className="mockup-isbn-status ml-auto inline-flex items-center gap-1 text-[9px] font-medium leading-none text-slate-400">
                  <span className="mockup-spinner inline-block h-2.5 w-2.5 rounded-full border border-slate-300 border-t-slate-500" />
                  Looking up...
                </span>
              </div>

              {/* Auto-filled book card */}
              <div className="mockup-book-card mb-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="mb-1 flex items-start justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100">
                      <Icon name="solar:book-2-linear" size={11} className="text-slate-500" />
                    </div>
                    <span className="text-[11px] font-semibold text-text">Cross on Evidence</span>
                  </div>
                  <div className="relative">
                    <span className="mockup-isbn-badge rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-500">ISBN Only</span>
                    <span className="mockup-enriched-badge absolute right-0 top-0 inline-flex items-center rounded-full bg-brand/10 px-1.5 py-0.5 text-[9px] font-medium text-brand whitespace-nowrap">
                      <Icon name="solar:check-circle-linear" size={9} className="mr-0.5" />
                      Enriched
                    </span>
                  </div>
                </div>
                <div className="text-2xs text-slate-400">J.D. Heydon · 5th Edition · LexisNexis</div>

                {/* RDA enrichment — step-by-step clerk interaction */}
                <div className="mt-2 space-y-1">
                  {/* Subject dropdown interaction (RDA: "what this resource is about") */}
                  <div className="relative inline-block w-40">
                    <div className="mb-0.5 text-[8px] font-medium text-slate-500">Subject</div>
                    <div className="relative">
                      <div className="mockup-pa-placeholder relative w-full rounded border border-slate-200 bg-white px-1.5 py-0.5 pr-4 text-[9px] text-slate-400">
                        <span>Select subject</span>
                        <Icon
                          name="solar:alt-arrow-down-linear"
                          size={8}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 shrink-0 text-slate-300"
                        />
                      </div>
                      <span className="mockup-cursor-pa pointer-events-none absolute z-30 h-9 w-9 rounded-full" />
                      <div className="mockup-pa-dropdown absolute left-0 top-full z-20 mt-0.5 w-full rounded-lg border border-slate-200 bg-white py-0.5 shadow-lg">
                        <div className="mockup-pa-option mockup-pa-option-criminal px-2 py-1 text-[9px]">Criminal</div>
                        <div className="mockup-pa-option mockup-pa-option-evidence px-2 py-1 text-[9px]">Evidence</div>
                        <div className="mockup-pa-option mockup-pa-option-civil px-2 py-1 text-[9px]">Civil Procedure</div>
                      </div>
                      <span className="mockup-pa-selected absolute left-0 top-0 w-full rounded border border-slate-200 bg-white px-1.5 py-0.5 pr-4 text-[9px] text-slate-600">
                        <span>Evidence</span>
                        <Icon
                          name="solar:alt-arrow-down-linear"
                          size={8}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 shrink-0 text-slate-400"
                        />
                      </span>
                    </div>
                  </div>

                  {/* Jurisdiction — appears empty, then fills */}
                  <div className="mockup-jurisdiction w-40">
                    <div className="mb-0.5 text-[8px] font-medium text-slate-500">Jurisdiction</div>
                    <div className="relative">
                      <div className="mockup-jurisdiction-placeholder relative w-full rounded border border-slate-200 bg-white px-1.5 py-0.5 pr-4 text-[9px] text-slate-400">
                        <span>Select jurisdiction</span>
                        <Icon
                          name="solar:alt-arrow-down-linear"
                          size={8}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 shrink-0 text-slate-300"
                        />
                      </div>
                      <span className="mockup-jurisdiction-selected absolute left-0 top-0 w-full rounded border border-slate-200 bg-white px-1.5 py-0.5 pr-4 text-[9px] text-slate-600">
                        <span>Federal, NSW</span>
                        <Icon
                          name="solar:alt-arrow-down-linear"
                          size={8}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 shrink-0 text-slate-400"
                        />
                      </span>
                    </div>
                  </div>

                  {/* Tags — wider + dynamic height for longer content */}
                  <div className="mockup-subject w-full">
                    <div className="mb-0.5 text-[8px] font-medium text-slate-500">Tags</div>
                    <div className="relative">
                      <div className="mockup-tags-placeholder min-h-[22px] w-full rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] text-slate-400">
                        Add tags...
                      </div>
                      <div className="mockup-tags-filled absolute left-0 top-0 flex min-h-[22px] w-full flex-wrap items-start gap-0.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] text-slate-600">
                        <Tag label="Cross-examination" removable />
                        <Tag label="Documentary evidence" removable />
                        <Tag label="Case prep" removable />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mockup-catalogue-toast absolute left-4 right-4 top-3 z-30 flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 shadow-sm">
                <Icon name="solar:check-circle-bold" size={11} className="shrink-0 text-emerald-500" />
                <span className="truncate text-[9px] font-medium text-emerald-700">Cross on Evidence added to library</span>
                <span className="text-[9px] text-emerald-600/70">Synced</span>
              </div>
            </div>

            {/* ── Phase 3-4: Dashboard — Control Tower ── */}
            <div className="mockup-dash-phase pointer-events-none absolute inset-0 p-4">
              <div className="mockup-dash-title">
                <div className="mb-1 font-serif text-sm font-semibold text-text">Dashboard</div>
                <div className="mb-3 text-2xs text-slate-400">Action required</div>
              </div>

              {/* Actionable stats — problems first, not vanity metrics */}
              <div className="mockup-dash-stats mb-3 grid grid-cols-3 gap-2">
                <div className="mockup-stat flex flex-col items-center rounded-xl bg-slate-50 p-2">
                  <div className="flex items-center justify-center gap-1">
                    <Icon name="solar:clock-circle-linear" size={14} className="shrink-0 text-red-400" />
                    <div className="font-serif text-base font-semibold leading-none text-text"><AnimatedCount target={3} delay={0} secondTarget={2} secondDelay={14400} /></div>
                  </div>
                  <div className="mt-1 text-[8px] font-medium text-slate-500">Overdue</div>
                </div>
                <div className="mockup-stat flex flex-col items-center rounded-xl bg-slate-50 p-2">
                  <div className="flex items-center justify-center gap-1">
                    <Icon name="solar:hourglass-line-linear" size={14} className="shrink-0 text-amber-500" />
                    <div className="font-serif text-base font-semibold leading-none text-text">2</div>
                  </div>
                  <div className="mt-1 text-[8px] font-medium text-slate-500">Pending</div>
                </div>
                <div className="mockup-stat flex flex-col items-center rounded-xl bg-slate-50 p-2">
                  <div className="flex items-center justify-center gap-1">
                    <Icon name="solar:chart-2-linear" size={14} className="shrink-0 text-brand/70" />
                    <div className="font-serif text-base font-semibold leading-none text-text">67%</div>
                  </div>
                  <div className="mt-1 text-[8px] font-medium text-slate-500">Enriched</div>
                </div>
              </div>

              {/* Notification — the aha: actionable control */}
              <div className="mockup-notification rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm">
                <div className="mb-1.5 flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-wider text-slate-400">
                  <span className="mockup-request-dot h-1.5 w-1.5 rounded-full bg-brand" />
                  <span>New Request</span>
                  <span className="ml-auto text-[8px] normal-case tracking-normal text-slate-400">just now</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-[9px] font-bold text-blue-600">J</div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-2xs font-medium text-text">
                      James requested <span className="text-brand">Cross on Evidence</span>
                    </div>
                    <div className="text-[9px] text-slate-400">just now</div>
                  </div>
                  <div className="relative flex h-5 shrink-0 items-center">
                    <span className="mockup-approve-btn inline-flex h-5 items-center rounded-md bg-emerald-600 px-2.5 text-[9px] font-semibold leading-none text-white shadow-sm">
                      Approve
                    </span>
                    <span className="mockup-approved-state absolute right-0 top-0 inline-flex h-5 items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 text-[9px] font-semibold leading-none text-emerald-600 whitespace-nowrap">
                      <Icon name="solar:check-circle-linear" size={10} className="shrink-0" />
                      Approved
                    </span>
                    <span className="mockup-cursor-approve pointer-events-none absolute inset-0 z-10 m-auto h-9 w-9 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Overdue card — system already handling it */}
              <div className="mockup-overdue-card mt-2 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm">
                <div className="mb-1.5 flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-wider text-red-400">
                  <Icon name="solar:clock-circle-linear" size={10} className="shrink-0" />
                  <span>Overdue</span>
                  <span className="ml-auto text-[8px] normal-case tracking-normal text-slate-400">7 days</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-[9px] font-bold text-red-500">S</div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-2xs font-medium text-text">
                      Sarah — <span className="text-slate-500">Uniform Evidence Law</span>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-emerald-600">
                      <Icon name="solar:check-circle-linear" size={9} className="shrink-0" />
                      <span>Auto-reminder sent</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-slate-400">Escalation in 3d</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Review cards — floating overlays, hidden on mobile/tablet */}
        <ReviewCard
          className="mockup-clerk-review-left hidden lg:block"
          {...reviewCards.clerk[0]}
        />
        <ReviewCard
          className="mockup-clerk-review-right hidden lg:block"
          {...reviewCards.clerk[1]}
        />
      </div>
    </div>
  );
}

export default function HeroMockup({ role }) {
  if (role === 'clerk') {
    return <ClerkMockup key="clerk" />;
  }

  return <BarristerMockup key="barrister" />;
}
