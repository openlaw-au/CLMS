# Clerk Dashboard Refactor Spec

**For**: Codex implementation
**Status**: Proposed
**Target file**: `clms-app/src/components/pages/app/ClerkDashboardPage.jsx`
**Reference**: `clms-app/src/components/pages/app/BarristerDashboardPage.jsx` (the "good" pattern to align with)

## Why

Current Clerk dashboard is structurally inconsistent with Barrister dashboard:
- Hero is cluttered (CTAs + onboarding banner + search inside hero)
- Metric cards grid is wrapped by `ContentLoader` at the wrong level → grid breaks; cards stack vertically
- Section tree below metrics is over-elaborated (5 sections vs Barrister's 2)
- Visual rhythm doesn't match — different overlap, padding, card opacity, font weight

Goal: bring the Clerk dashboard to the same **hero → metrics → 2-column bottom** rhythm as Barrister, while keeping clerk-specific data (catalogue health, uncatalogued queue, pending requests, authority lists).

## What to copy from Barrister (architectural)

### 1. Hero — strip down

**Current**: heading + subtitle + 2 CTAs + Setup-synced banner + mobile search input.

**Target**: heading + subtitle ONLY. Match Barrister's structure exactly:

```jsx
<section className="relative flex min-h-[240px] flex-col justify-center rounded-b-[40px] px-1 pb-24 pt-16 text-white md:min-h-[260px] md:px-0 md:pb-28 md:pt-20">
  <ContentLoader loading={loading} skeleton={<>...</>}>
    <h1 className="font-serif text-4xl leading-none tracking-tight md:text-5xl">Hi, {firstName}.</h1>
    <p className="mt-3 font-serif text-xl leading-tight text-white/84 md:text-2xl">
      Manage catalogue health, requests, and chambers operations in one place.
    </p>
  </ContentLoader>
</section>
```

- Remove `Add Book` and `Import CSV` buttons from hero. They already exist on the Catalogue page header (`PageHeader` in `ClerkCataloguePage.jsx:139-159`) and the global app bar.
- Remove the mobile search input (`md:hidden`). Search lives in the global app bar.
- Remove the Setup-synced banner from hero (keep relocated version per §3).
- Drop the `max-w-[30ch] md:max-w-[32ch]` constraint on the subtitle — Barrister has no constraint and reads cleanly.

### 2. Metric cards — fix the grid pattern

**Current** (broken):
```jsx
<ContentLoader className="grid ..." childClassName="grid ...">
  {dashboardMetrics.map((metric) => <article ...>)}
</ContentLoader>
```
The double-grid hack works but is fragile. Match Barrister's pattern instead.

**Target** (Barrister pattern, per `BarristerDashboardPage.jsx:149-188`):
```jsx
<div className="relative z-[1] -mt-[56px] md:-mt-[60px]">
  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
    {[0, 1, 2, 3].map((i) => {
      const metric = !loading ? dashboardMetrics[i] : null;
      return (
        <div
          key={i}
          role={metric ? 'button' : undefined}
          tabIndex={metric ? 0 : undefined}
          onClick={metric ? () => navigate(metric.to) : undefined}
          onKeyDown={metric ? (e) => { if (e.key === 'Enter') navigate(metric.to); } : undefined}
          className={`${metricCardClass} text-left ${metric ? 'cursor-pointer transition-colors hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.58),rgba(255,255,255,0.92))]' : ''}`}
        >
          <ContentLoader loading={loading} skeleton={<>...</>}>
            {/* card content */}
          </ContentLoader>
        </div>
      );
    })}
  </div>
</div>
```

Where `metricCardClass` matches Barrister exactly:
```js
const metricCardClass = 'min-h-[160px] rounded-[28px] border border-white/35 bg-[linear-gradient(180deg,rgba(255,255,255,0.48),rgba(255,255,255,0.88))] p-6 backdrop-blur-xl shadow-[0_20px_50px_rgba(124,45,18,0.15)]';
```

Key changes:
- `ContentLoader` is **per-card**, not wrapping the grid. The grid is a plain `<div>`.
- `p-6` (not `p-4`) for breathing room.
- More opaque gradient (`0.48 → 0.88`, not `0.26 → 0.84`).
- `font-bold tracking-tight` on the value (not `font-semibold`).
- `-mt-[56px] md:-mt-[60px]` overlap (not `-mt-[80px] md:-mt-[84px]`).
- Each metric is **clickable** → navigate to relevant page. Add `to` field to each `dashboardMetrics` entry:
  - `Books in Catalogue` → `/app/catalogue`
  - `Pending Requests` → `/app/loans`
  - `Overdue Books` → `/app/loans`
  - `Catalogue Coverage` → `/app/catalogue`

### 3. Setup-synced banner — relocate or remove

Two acceptable options. **Pick option A by default**:

**Option A (preferred)**: remove the banner entirely from the dashboard. The "Catalogue Coverage" metric card already shows `${locationCount} locations live`. Onboarding completion toast (already shown post-onboarding) is enough confirmation. One less thing to dismiss.

**Option B**: if Sean wants the banner kept, place it as a slim emerald-tinted strip directly above the Overview label (after metric cards), matching the styling I added previously. Make it dismissible via `firstVisit` flag stored in `onboarding` context.

### 4. Bottom section — collapse 5 cards into 2

**Current**: `lg:col-span-2 + 4 sidebar cards` =
1. Catalogue Health (primary, 2/3 width)
2. Uncatalogued Books
3. Pending Requests
4. Authority Lists
5. Loan Snapshot

This is too many sections for a dashboard summary view. Each section's full functionality already lives on a dedicated page.

**Target**: `md:grid-cols-2` with two cards, mirroring Barrister:

**Left card — "Catalogue Health"** (primary clerk job)
- Keep enrichment progress bar (`enrichedCount / books.length`)
- Keep 3 missing-metadata buttons (subject / jurisdiction / resourceType)
- Drop the "Next to enrich" preview list (clutter; users go to Catalogue page anyway)
- Keep `Enrich Now` CTA in header

**Right card — "Triage Queue"** (action-required items)

Combine the two highest-action-value sidebars into one scrollable triage list, styled like Barrister's Alerts card. Each row is a single action item:

- Each `pendingQueue` item → "📚 *{title}* added by {addedBy}" → links to `/app/catalogue?action=add&queueId={id}`
- Each `pendingLoans` item → "📥 Loan request: *{bookTitle}* by {borrower}" → links to `/app/loans`
- Each `overdueLoans` item → "⚠️ Overdue: *{bookTitle}* — {daysLate} days" → links to `/app/loans`

Sort: overdue → pending loans → uncatalogued queue (priority order).

Empty state: "No items waiting. Catalogue is healthy."

Reuse Barrister's Alerts card visual treatment (`BarristerDashboardPage.jsx:262-315`) including the absolute-positioned scrollable inner column so the right card height matches the left.

**Drop entirely**:
- Standalone Authority Lists card (move to its own page; clerks rarely need this on the dashboard)
- Standalone Loan Snapshot card (the metric cards already show pending/overdue counts)

### 5. Section spacing

Replace `mb-5 mt-8 md:mt-10` (Overview label) and the multi-section grid with Barrister's `mt-12 grid gap-4 md:grid-cols-2` directly after metrics. Remove the `Overview` label — it's not in Barrister and adds nothing.

## Concrete file diff plan

1. **`ClerkDashboardPage.jsx`**: rewrite the JSX return body to follow the structure above. Keep the data hooks (`useEffect`, `useMemo` blocks) intact except:
   - Add `to` field to each `dashboardMetrics` entry.
   - Add a derived `triageItems` memo that merges + sorts overdue loans, pending loans, and pending queue entries into a single flat array of `{ id, icon, message, to, severity }`.
   - Drop `dismissQueueItem` import if no longer used inside dashboard (it stays available on the Catalogue page).
   - Drop `getLists` import + `lists` state if Authority Lists card is removed (confirmed in §4).

2. **No changes** to `BarristerDashboardPage.jsx`, `ContentLoader.jsx`, or any service file.

3. **No new components** needed. The triage card is a one-off composition, same as Barrister's Alerts card.

## Acceptance checks (Codex must verify before declaring done)

- [ ] On `xl` viewport, 4 metric cards render in a single row.
- [ ] On `md` viewport, metric cards render as 2×2.
- [ ] Hero contains only heading + subtitle. No buttons, no banner, no search input.
- [ ] Subtitle does not wrap awkwardly mid-phrase on standard desktop widths.
- [ ] Each metric card is keyboard-focusable and navigates on Enter/click.
- [ ] Hero overlap (`-mt-[56px] md:-mt-[60px]`) and metric card padding (`p-6`) match Barrister visually.
- [ ] Triage card is height-pinned to Catalogue Health card and scrolls internally when overflowing.
- [ ] No console warnings, no layout shifts during the loading → loaded transition.
- [ ] Empty states render gracefully (no books, no loans, no queue).

## Out of scope

- Sidebar nav changes
- Catalogue page changes
- Service layer / mock data changes
- Onboarding flow changes
- Mobile-specific tweaks beyond what falls out naturally from the Barrister pattern
