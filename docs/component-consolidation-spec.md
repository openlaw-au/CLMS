# Component & Token Consolidation Spec

**For**: Codex implementation
**Status**: Proposed
**Owner of authoring**: Sean (design) + Claude (spec)
**Owner of implementation**: Codex
**Goal**: Lift Barrister-side patterns into reusable components & tokens, then re-apply to Clerk pages so layouts stop drifting.

---

## Why now

Clerk pages keep breaking in the same ways. Two examples in the last hour:
- Dashboard metric grid stacked vertically (`ClerkDashboardPage.jsx`, fixed)
- Loan tabs rendered as a vertical column instead of a row (`ClerkLoansPage.jsx:147-176`, still broken — see screenshot)

Both have the **same root cause**: `ContentLoader` wraps real children in an extra `<div>` without forwarding flex/grid classes. Skeletons work (direct children) but real content breaks. This will keep biting us until we fix the underlying primitive AND extract the repeated layout patterns into components.

---

## Scope

### A. Fix `ContentLoader` once, properly
### B. Extract 5 components from Barrister-side patterns
### C. Add design tokens for the values currently hard-coded inline
### D. Re-apply those components on Clerk pages (Dashboard, Loans)

Out of scope: search page, authorities, settings, onboarding flow.

---

## A. ContentLoader fix

**File**: `clms-app/src/components/atoms/ContentLoader.jsx`

**Current bug** (lines 33–53): when not loading, real children are wrapped in `<div className={childClassName}>`. If the caller passes `className="flex"` or `className="grid grid-cols-4"` to the outer ContentLoader expecting it to apply to the layout, the wrapper div inside breaks it. Callers must remember to also pass `childClassName` matching `className`. This is fragile and has caused two bugs already.

**Proposed fix**: when not in `exiting` (overlap) phase, render real children **as a Fragment** without a wrapper div. The wrapper is only needed during the cross-fade exit overlap.

```jsx
// Pseudocode of the fix:
return (
  <div className={`${overlapping ? 'grid [&>*]:col-start-1 [&>*]:row-start-1' : ''} ${className}`}>
    {showSkeleton && (
      <div style={{ transition: ... }} className={phase === 'exiting' ? 'pointer-events-none opacity-0' : 'opacity-100'}>
        {skeleton}
      </div>
    )}
    {!loading && (
      // During exit overlap we still need the wrapper to share the grid cell.
      // After exit completes, render children as a Fragment so caller's flex/grid applies directly.
      overlapping
        ? <div className={childClassName} style={{ animation: `fade-only 350ms ease-out` }}>{children}</div>
        : <>{children}</>
    )}
  </div>
);
```

**Acceptance**: after this fix, `<ContentLoader className="flex gap-2"><button /><button /></ContentLoader>` produces a horizontal row both during loading (skeleton) and after (real buttons) without callers having to set `childClassName`.

**Migration**: search the codebase for current `childClassName=` usages (`BarristerDashboardPage.jsx:267`, the just-removed `ClerkDashboardPage.jsx`) and remove them — they become no-ops.

---

## B. Components to extract

All new components go in `clms-app/src/components/molecules/` unless flagged as organism. Each component must:
- Use design tokens (no inline hex, no arbitrary opacity unless tokenized)
- Follow `DESIGN_RULES.md` (4px spacing scale, semantic HTML, icon+text alignment)
- Include propTypes documentation in a comment block above the component

### B1. `MetricCard` (molecule)

**Pattern source**: `BarristerDashboardPage.jsx:149-188`

**Props**:
```ts
{
  icon: string;          // Iconify name e.g. 'solar:book-2-linear'
  iconBg: string;        // Tailwind classes for icon swatch e.g. 'bg-blue-100 text-blue-700'
  value: string | number;
  label: string;         // UPPERCASE caption above detail
  detail: string;        // sub-line below label
  to?: string;           // optional route — when present, card is a button
  loading?: boolean;     // when true, internal skeleton renders
}
```

**Behavior**:
- Renders the gradient pill card with the warm shadow.
- When `to` is set: `role="button"`, `tabIndex=0`, `onClick`/`onKeyDown` (Enter) navigates via `useNavigate`. Hover state lightens the gradient.
- When `loading=true`: renders the skeleton internally (icon + value + label + detail placeholders). Card chrome (gradient/shadow/border) stays visible.

**Visual spec** — these become tokens in §C, but the values:
- `min-h-[160px]`, `rounded-[28px]`, `border border-white/35`, `p-6`, `backdrop-blur-xl`
- gradient `linear-gradient(180deg, rgba(255,255,255,0.48), rgba(255,255,255,0.88))`
- hover gradient `linear-gradient(180deg, rgba(255,255,255,0.58), rgba(255,255,255,0.92))`
- shadow `0 20px 50px rgba(124,45,18,0.15)`
- icon swatch: `h-11 w-11 rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]`
- value: `text-3xl font-bold leading-none tracking-tight text-slate-950`
- label: `text-xs font-semibold uppercase tracking-[0.16em] text-slate-500`
- detail: `text-sm text-slate-600`

### B2. `MetricGrid` (molecule)

**Purpose**: renders a fixed 4-card grid that handles loading state at the grid level. Solves the "skeleton vs real" alignment without relying on ContentLoader gotchas.

**Props**:
```ts
{
  metrics: MetricCardProps[];   // length must be 4 — assert at runtime
  loading: boolean;
}
```

**Implementation**: render `[0,1,2,3].map((i) => <MetricCard key={i} loading={loading} {...metrics[i]} />)` inside `<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">`. Each `MetricCard` handles its own internal skeleton.

**Note**: this replaces the `[0,1,2,3].map(...)` boilerplate currently inlined in `BarristerDashboardPage.jsx:151-187` and `ClerkDashboardPage.jsx`.

### B3. `DashboardHero` (organism, in `organisms/`)

**Pattern source**: `BarristerDashboardPage.jsx:131-146` (clean) vs `ClerkDashboardPage.jsx:94-148` (bloated)

**Props**:
```ts
{
  greeting: string;       // e.g. "Hi, sean."
  subtitle: string;
  loading?: boolean;
}
```

No buttons, no banners, no search. CTAs already live in PageHeader on detail pages, and the global app bar holds search. If we ever need a hero CTA again, add it as an explicit prop later — don't pre-design the slot.

**Markup**:
```jsx
<section className="relative flex min-h-[240px] flex-col justify-center rounded-b-[40px] px-1 pb-24 pt-16 text-white md:min-h-[260px] md:px-0 md:pb-28 md:pt-20">
  {loading ? <SkeletonGroup /> : (
    <>
      <h1 className="font-serif text-4xl leading-none tracking-tight md:text-5xl">{greeting}</h1>
      <p className="mt-3 font-serif text-xl leading-tight text-white/84 md:text-2xl">{subtitle}</p>
    </>
  )}
</section>
```

The orange gradient background lives outside this component (parent layout shell or an enclosing wrapper) — don't bundle it here, since both Barrister and Clerk inherit the same chamber-shell color.

### B4. `SegmentedTabs` (molecule)

**Pattern sources**:
- `ClerkLoansPage.jsx:147-176` (broken vertical tab — what we're fixing)
- `ClerkCataloguePage.jsx:163-208` (similar pattern, also vulnerable)
- `BarristerLoansPage.jsx` `StatusPillBar` usage

**Replaces**: ad-hoc `<div className="flex gap-1 rounded-xl bg-slate-100 p-1">{buttons}</div>` blocks scattered across pages.

**Props**:
```ts
{
  items: { key: string; label: string; count?: number; tone?: 'neutral' | 'amber' | 'red' | 'emerald' }[];
  value: string;
  onChange: (key: string) => void;
  fullWidth?: boolean;   // when true, items use flex-1 to fill row (Loans page); default false (Catalogue page filter group)
  loading?: boolean;
}
```

**Behavior**:
- Renders horizontal flex row. When `fullWidth`, items use `flex-1`. Otherwise items size to content.
- Active item: `bg-white text-text shadow-sm`. Inactive: `text-text-secondary hover:text-text`.
- Count badge tone follows `tone` prop. Default `neutral` = `bg-slate-200 text-text-muted`.
- When `loading=true`: render N skeleton pills sized to `items.length`.

**Replaces** today:
- ClerkLoansPage tabs → `<SegmentedTabs items={tabs} value={tab} onChange={setTab} fullWidth loading={loading} />`
- ClerkCataloguePage filterTabs → same with `fullWidth=false`
- BarristerLoansPage StatusPillBar can be migrated as a follow-up (lower priority — already works).

### B5. `SummaryCard` (molecule)

**Pattern source**: `ClerkLoansPage.jsx:259-297` (Summary sidebar) — also a near-twin of the "Loan Snapshot" card on Clerk dashboard.

**Props**:
```ts
{
  title: string;
  rows: { label: string; value: number | string; icon: string; tone: 'amber' | 'red' | 'emerald' | 'neutral' | 'brand' }[];
  loading?: boolean;
}
```

**Behavior**: white rounded card with title + rows of icon-swatch + label (left) + count (right). Tones map to fixed swatch + count colors via design tokens.

**Replaces**:
- ClerkLoansPage Summary card
- ClerkDashboardPage "Loan Snapshot" card (the smaller sidebar one)

---

## C. Design tokens

**File**: `clms-app/src/styles/tokens.css` and `clms-app/tailwind.config.js`

Add:

### Radii
```css
--radius-metric-card: 28px;
--radius-hero: 40px;
```
Tailwind: extend `borderRadius`: `'metric-card': '28px'`, `'hero': '40px'`.

### Shadows
```css
--shadow-metric: 0 20px 50px rgba(124, 45, 18, 0.15);
--shadow-metric-loading: 0 20px 50px rgba(124, 45, 18, 0.18);
```
Tailwind: extend `boxShadow`: `'metric': '0 20px 50px rgba(124, 45, 18, 0.15)'`.

### Gradients (custom utility — Tailwind doesn't tokenize gradients out of the box)
Add to `tokens.css`:
```css
--gradient-metric: linear-gradient(180deg, rgba(255,255,255,0.48), rgba(255,255,255,0.88));
--gradient-metric-hover: linear-gradient(180deg, rgba(255,255,255,0.58), rgba(255,255,255,0.92));
```
Add small utility classes `.bg-metric` / `.bg-metric-hover` that reference these vars. `MetricCard` uses these classes instead of inline `bg-[linear-gradient(...)]`.

### Tone palette for badges/swatches
Standardize the 4 tones used across `MetricCard.iconBg`, `SummaryCard.rows[].tone`, `SegmentedTabs.items[].tone`. Define semantic pairs:

```css
--tone-amber-bg: var(--color-warning-soft);    /* bg-amber-100 */
--tone-amber-fg: theme(colors.amber.700);
--tone-red-bg:   theme(colors.red.50);
--tone-red-fg:   theme(colors.red.600);
--tone-emerald-bg: theme(colors.emerald.100);
--tone-emerald-fg: theme(colors.emerald.600);
--tone-neutral-bg: theme(colors.slate.100);
--tone-neutral-fg: theme(colors.text.muted);
--tone-brand-bg: rgba(234, 88, 12, 0.10);       /* bg-brand/10 */
--tone-brand-fg: var(--color-primary);
```

Codex can decide whether to express these as a JS lookup (`TONE_CLASSES = { amber: ['bg-amber-100', 'text-amber-700'], ... }`) inside the components or as utility classes — pick whichever results in less indirection.

---

## D. Re-apply on Clerk pages

After §A–C are merged, update:

### D1. `ClerkDashboardPage.jsx`
- Replace metric grid (lines ~151–186) with `<MetricGrid metrics={dashboardMetrics} loading={loading} />`.
- Replace hero (lines ~94–148) with `<DashboardHero greeting={`Hi, ${firstName}.`} subtitle="Manage catalogue health, requests, and chambers operations in one place." loading={loading} />`.
- Remove the standalone Setup-synced banner (the metric card "Catalogue Coverage" already shows location count).
- Bottom section: leave for follow-up (covered in `clerk-dashboard-refactor-spec.md`).

### D2. `ClerkLoansPage.jsx`
- Replace tab bar (lines 147–177) with `<SegmentedTabs items={tabs} value={tab} onChange={setTab} fullWidth loading={loading} />`. **This fixes the screenshot bug.**
- Replace Summary card (lines 259–297) with `<SummaryCard title="Summary" rows={summaryRows} loading={loading} />`.
- The lone "Total loans recorded" mini-card can either fold into SummaryCard as a 5th row or stay as-is for now (low priority).

### D3. `BarristerDashboardPage.jsx` (the source pattern)
- Replace its inline metric grid with `<MetricGrid />` and inline hero with `<DashboardHero />`. This proves the components match what's already shipped — no visual regression.
- Drop the `childClassName` workaround on the alerts ContentLoader once §A is in.

---

## Implementation order

Codex should land this in **3 PRs** to keep blast radius small:

**PR 1 — Primitives** (§A, §C, half of §B):
- Fix ContentLoader
- Add tokens
- Build `MetricCard` + `MetricGrid`
- Migrate `BarristerDashboardPage` to use them (proves no regression)

**PR 2 — Tab + Hero**:
- Build `SegmentedTabs` + `DashboardHero`
- Migrate `BarristerDashboardPage` hero
- Migrate `ClerkLoansPage` tabs (this **fixes the visible bug**)
- Migrate `ClerkDashboardPage` hero & metric grid

**PR 3 — Summary**:
- Build `SummaryCard`
- Migrate `ClerkLoansPage` Summary card
- Migrate Clerk dashboard "Loan Snapshot" card

---

## Acceptance for the whole epic

- [ ] `ContentLoader` no longer wraps real children in a div (except during cross-fade).
- [ ] No file outside the new components contains `bg-[linear-gradient(180deg,rgba(255,255,255,...))]`, `rounded-[28px]`, `rounded-b-[40px]`, or `shadow-[0_20px_50px_rgba(124,45,18,...)]` for metric/hero usage.
- [ ] `ClerkLoansPage` tabs render in a single horizontal row (regression check: screenshot from this thread).
- [ ] `ClerkDashboardPage` and `BarristerDashboardPage` have visually identical metric card grids at `xl` breakpoint side by side.
- [ ] Adding a 5th metric to either dashboard requires changing one number (and the metrics array), not touching layout code.
- [ ] No console warnings about array length mismatches in MetricGrid (assert at runtime, fail loudly in dev).

---

## Open questions for Sean (please answer before Codex starts)

1. **Setup-synced banner** — kill it on the dashboard, or keep as a one-off below metrics? (Recommendation: kill — Catalogue Coverage card already conveys this.)
2. **"Total loans recorded" mini-card** on Clerk Loans — fold into SummaryCard as a row, or keep as a separate small card? (Recommendation: fold into SummaryCard.)
3. **Hero CTAs** — confirm clerk dashboard hero should have NO buttons (matching Barrister). The Add Book / Import CSV buttons inside the catalogue page's PageHeader are sufficient.
