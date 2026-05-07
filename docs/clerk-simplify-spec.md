# Clerk Side Simplification Spec

**Date**: 2026-05-05
**Status**: Proposed
**For**: Codex implementation
**Goal**: Make the clerk side feel as simple as the clerk's actual job — check books in/out, intake catalogue, handle recalls, manage chambers settings. Strip everything else.

## Why

Clerk surface area has drifted past what Phase 1 needs:
- Sidebar has 7 items; only 4 map to real daily clerk work.
- 3 pages are dead code or duplicates (`ClerkSearchPage`, standalone `ClerkMembersPage`, standalone `ClerkLocationsPage`).
- 2 pages are barrister-level surface area pushed onto clerks (`ClerkAuthoritiesPage`, `ClerkReportsPage`).
- Header search bar lies — placeholder says `Search catalogue...` but actually navigates to authority lists / opens "Add to List" modal.
- Several pages have in-page bloat (duplicate buttons, dual views, stub actions) inflating perceived complexity.

Phase 1 spec (`docs/clerk-phase-1-spec.md`) tasks 1–5 are already implemented (verified by Codex). This spec is purely about **removing surface area and tightening what stays**, not adding features.

## Out of scope

- New design tokens, new components, new colors.
- Real auth, real backend.
- Phase 2 features (re-introducing Authorities and Insights for clerks, location management UX).
- Barrister side — do not touch barrister files unless explicitly listed below.
- Mobile-specific responsive polish beyond what falls out naturally.

## Reuse rules (must follow)

When changes touch UI, **reuse existing barrister-side patterns and design system primitives**. Do NOT introduce new tokens, new tailwind arbitrary values, or new component variants.

- **Page shell**: `animate-page-in` wrapper, `PageHeader` molecule, `ContentLoader` + `Skeleton` for fetch state, ~400ms min delay (mirror `BarristerLoansPage.jsx`).
- **Hero**: reuse `DashboardHero` organism — same hero structure as `BarristerDashboardPage.jsx:14-90`.
- **Metric cards**: reuse `MetricCard` / `MetricGrid` molecules (already used by `BarristerDashboardPage`). Match `metricCardClass` constants (`min-h-[160px] rounded-[28px] border border-white/35 ... p-6`).
- **Status filtering**: `FilterPillBar` / `SegmentedTabs` molecules.
- **Loan rows**: `LoanCard` molecule — already supports `role === 'clerk'` branch.
- **Modals**: `fixed inset-0 z-40 bg-black/30` overlay + centered card pattern (see `NewLoanModal`, `IsbnIntakeModal`).
- **Toasts**: `useToast().addToast({ message, type })` after every mutation. English copy.
- **Buttons**: `Button` atom variants only (`primary` / `secondary` / `ghost`). No bespoke button styling.
- **Spacing**: 4px grid only. Tailwind scale only. No `p-[13px]` style arbitrary values.
- **Color tokens**: `:root` design tokens (`text`, `text-secondary`, `text-muted`, `brand`, `border`, etc.). No hardcoded hex outside SVG fills.
- **Typography**: Playfair Display for serif headings (`font-serif`), Inter for body. No new font imports.
- **Animation**: Smooth transitions on appear/disappear (`motion-fade`, `animate-fade-in`, `transition-all duration-300`).

If a needed primitive does not exist, prefer copying the equivalent inline JSX from a barrister page over creating a new component.

---

## Task 1 — Sidebar reduction (7 → 4 + 1 utility)

### Changes

**`src/components/organisms/AppShell.jsx`** — `navByRole.clerk` (currently lines 18–26):

Replace with:
```js
clerk: [
  { label: 'Dashboard', slug: 'dashboard', icon: 'solar:home-2-linear' },
  { label: 'Catalogue', slug: 'catalogue', icon: 'solar:book-2-linear' },
  { label: 'Loans', slug: 'loans', icon: 'solar:bookmark-square-linear' },
  { label: 'Chambers', slug: 'chambers', icon: 'solar:buildings-2-linear' },
  { label: 'Settings', slug: 'settings', icon: 'solar:settings-linear' },
],
```

Notes:
- Drop `Authorities` and `Insights` entries entirely.
- Swap `Loans` icon from `solar:book-bookmark-linear` to `solar:bookmark-square-linear` so it is visually distinct from `Catalogue` (`solar:book-2-linear`). Both currently feel like "book" icons.
- `Settings` stays in the list. Visual treatment: render `Settings` in the sidebar as a separate utility group below a thin divider (`border-t border-border/60 mt-2 pt-2`) so the four primary nav items read as one cluster and Settings reads as utility. Keep the same `navLinkClass` for active state. (If easier: render `mainNav` as `navItems` minus settings, then a divider, then a single `<Link>` for settings.)

### Quick action button

`AppShell.jsx:158-162` — keep the `Add Book` clerk quick action. No change.

### Search placeholder

`AppShell.jsx:155-157` — see Task 5.

### Acceptance

- Clerk sees exactly 5 sidebar items: Dashboard, Catalogue, Loans, Chambers, Settings.
- Settings is visually grouped as utility (divider above it).
- Loans and Catalogue icons are clearly different at a glance.
- Barrister sidebar unchanged.

---

## Task 2 — Remove dead and Phase-2 pages

### Files to delete

- `src/components/pages/app/ClerkSearchPage.jsx` — currently not routed in `AppPage.jsx`. Pure dead code.
- `src/components/pages/app/ClerkMembersPage.jsx` — superseded by `ClerkChambersPage` Members tab. Routing already redirects `/app/members` to chambers.
- `src/components/pages/app/ClerkLocationsPage.jsx` — superseded by `ClerkChambersPage` Locations tab. Routing already redirects.
- `src/components/pages/app/ClerkAuthoritiesPage.jsx` — defer to Phase 2.
- `src/components/pages/app/ClerkReportsPage.jsx` — defer to Phase 2.

### Routing — `src/components/pages/AppPage.jsx`

Update the `CLERK_PAGES` map (currently lines 26–39) to:
```js
const CLERK_PAGES = {
  dashboard: ClerkDashboardPage,
  catalogue: ClerkCataloguePage,
  library: ClerkCataloguePage,
  loans: ClerkLoansPage,
  chambers: ClerkChambersPage,
  members: ClerkChambersPage,
  locations: ClerkChambersPage,
  settings: SettingsPage,
};
```
- Drop imports for the 5 deleted pages.
- Drop the `authorities`, `lists`, `insights`, `reports` keys for clerk. If a clerk lands on `/app/authorities` directly (e.g. via stale link), the fallback `pages[defaultSection]` already returns `ClerkDashboardPage` — that is acceptable behavior.

### `AppShell.jsx` `slugAlias` (lines 122–128)

Drop the `reports: 'insights'` alias since neither slug is in the clerk nav anymore. Keep `members` and `locations` aliases pointing to `chambers`. Drop `lists: 'authorities'` for clerk path-matching (barrister still needs it — leave it; alias is global, but since clerks won't have the slug in their nav the alias is harmless. No change needed here in practice, just verify.)

### Cross-references to clean

- `BarristerDashboardPage.jsx`, `BarristerLoansPage.jsx` and other barrister pages may import `getLists` from `authorityListsService` — leave those untouched. The service file itself stays.
- If any clerk-side component imports from the deleted Authorities/Reports/Search pages, update or remove the import. Run a project-wide grep before deleting.

### Acceptance

- 5 page files deleted.
- `npm run build` passes without unresolved imports.
- Clerk navigates Dashboard → Catalogue → Loans → Chambers → Settings without hitting a broken route.
- Barrister side untouched (sidebar, dashboard, lists, loans all behave identically).

---

## Task 3 — Header search bar: stop lying

`HeaderSearchBar.jsx` is a powerful component — autosuggest, JADE/book results, "Add to List" modal. That makes sense **for barrister**. For clerks, the placeholder says `Search catalogue...` but the actual behavior navigates to authority lists or opens an Add-to-List modal. This is the single most disorienting element on the clerk side.

### Decision

**For clerks: redirect the header search to the Catalogue page with a query param. No autosuggest dropdown, no Add-to-List modal.**

Rationale: clerks already have a powerful search/filter UI inside `ClerkCataloguePage`. Header search should just be a fast jump into it.

### Changes

**`src/components/molecules/HeaderSearchBar.jsx`**:
- Add a `role` prop (`'barrister' | 'clerk'`).
- When `role === 'clerk'`:
  - Skip the autosuggest fetch entirely.
  - On submit (Enter or Search button), `navigate(\`/app/catalogue?q=\${encodeURIComponent(query.trim())}\`)`.
  - Do not render the suggestions dropdown or the Add-to-List modal portal.
- When `role === 'barrister'`: behave exactly as today.

**`src/components/organisms/AppShell.jsx`**:
- Pass `role` to `HeaderSearchBar`.
- Keep clerk placeholder as `Search catalogue...` — it now matches behavior.

**`src/components/pages/app/ClerkCataloguePage.jsx`**:
- On mount, read `searchParams.get('q')` and seed the catalogue search state with it.

### Acceptance

- Clerk types in header search → Enter → lands on `/app/catalogue?q=...` with the catalogue page's own search field pre-filled.
- No autosuggest dropdown or modal appears for clerks.
- Barrister header search behaves identically to today (autosuggest + add-to-list modal still work).

---

## Task 4 — Dashboard execution (existing refactor spec, finish it)

Codex review confirmed hero + metric structure is already aligned with `clerk-dashboard-refactor-spec.md`. Remaining gap is the **bottom section: 5 cards → 2 cards**.

### Changes

**`src/components/pages/app/ClerkDashboardPage.jsx`**:

1. **Remove the `Overview` label** above the bottom section.
2. **Drop these sub-sections entirely** from the bottom grid:
   - `Next to enrich` preview list (inside Catalogue Health card — it stays in the page but the preview list goes away).
   - `Pending Requests` standalone card.
   - `Authority Lists` card.
   - `Loan Snapshot` card.
3. **Keep two cards in a `mt-12 grid gap-4 md:grid-cols-2`**, mirroring `BarristerDashboardPage.jsx:262-315`:
   - **Left — Catalogue Health**: enrichment progress bar + 3 missing-metadata buttons + `Enrich Now` CTA in header. Drop the preview list.
   - **Right — Triage Queue**: merged scrollable list of overdue loans → pending loans → uncatalogued queue items. Each row: icon + title + meta line. Click navigates to the relevant page. Empty state: `No items waiting. Catalogue is healthy.`
4. **Drop `getLists` import + `lists` state** if no longer referenced (Authority Lists card is gone).
5. **Drop `dismissQueueItem` import** from this file if only used by the removed sidebar card.

### Reuse

- Triage card visual = clone the JSX shell of Barrister's Alerts card (`BarristerDashboardPage.jsx:262-315`) including the absolute-positioned scrollable inner column so heights match.
- Card container classes must equal Barrister's exactly. No new tokens.

### Acceptance

- Dashboard bottom is exactly two equal cards on `md+`.
- Triage Queue sorts: overdue → pending loans → uncatalogued queue.
- Empty state renders gracefully.
- `Overview` label is gone.
- No console warnings, no layout shifts during loading → loaded transition.

---

## Task 5 — Catalogue page slim-down

**`src/components/pages/app/ClerkCataloguePage.jsx`**:

### Single primary view

Currently has dual `Card View` / `Admin Table` toggle. Pick **Card View as the only view**. Remove the `Admin Table` toggle and table JSX entirely.

Rationale: clerks scan a catalogue visually; the admin table duplicates information at lower density and adds a control no one will set differently across sessions.

### Merge View + Edit Metadata buttons

Currently each row has both `View` and `Edit Metadata` buttons that open the same `BookDetailPanel`. Replace with a **single `Open` button** that opens the panel in view mode with an inline `Edit` toggle inside the panel. (Edit affordance moves into the panel itself.)

### Drop sidecards

Remove the `Inventory` / `Locations` sidecards next to the catalogue list. Inventory metrics already live on the dashboard's metric row; Locations belongs in Chambers.

### Keep

- 4 intake CTAs in PageHeader (`Add Book`, `Import CSV`, `Scan ISBN`, `Paste ISBNs`). Phase 1 spec.
- Search input + filter pills.
- Pending queue strip (uncatalogued items awaiting addition).

### Search seeding

Wire `searchParams.get('q')` (Task 3) to the existing search state on mount.

### Acceptance

- Single list view (cards). No view toggle.
- Each row has one primary action button (`Open`) that reveals view + edit in one panel.
- No `Inventory` / `Locations` sidebars on the page.
- `?q=` URL parameter pre-fills the search field.

---

## Task 6 — Loans page slim-down

**`src/components/pages/app/ClerkLoansPage.jsx`**:

- Remove the right-hand `Summary` card. Tab counts (in `StatusPillBar` / `SegmentedTabs`) already convey the same numbers. Use the freed width to let the loan list breathe.
- Keep `+ New Loan`, all 5 tabs (Pending / Recalls / Active / Overdue / History), `LoanCard` actions (`Mark Returned`, `Extend`, `Send Reminder`).

### Acceptance

- Loans page is single-column on `md+`.
- Tab badges show counts. No standalone Summary card.
- All Phase 1 loan workflows still pass: New Loan, Mark Returned, Extend, Send Reminder, Recall, Dismiss.

---

## Task 7 — Chambers page slim-down

**`src/components/pages/app/ClerkChambersPage.jsx`**:

- Remove the top metrics strip (members count, locations count). Counts are visible inside each tab's content already.
- Remove stub action buttons that only fire a toast: `QR` and `Edit location` row actions on the locations tree.
- Keep: tab structure (Members | Locations), invite form, members table, locations tree (read-only display only).

If users later need editable locations, that returns in a Phase 2 spec.

### Acceptance

- Chambers page opens directly to tabs (no metrics strip above).
- No `QR` or `Edit` action chips on locations rows.
- Invite form + members table on the Members tab work as before.

---

## Task 8 — Notifications dropdown sanity check

`AppShell.jsx:86-103` — notifications are derived from loans (overdue + pending). Verify the bell still works after Task 2 (Authorities removal does not break this; should be untouched). No code change expected, just a runtime smoke test.

---

## Execution order

1. **Task 1** — sidebar config (low-risk, immediate visual win).
2. **Task 2** — delete dead/Phase-2 pages + route cleanup.
3. **Task 3** — header search clerk redirect.
4. **Task 4** — dashboard 5 → 2 cards.
5. **Task 5** — catalogue slim-down.
6. **Task 6** — loans slim-down.
7. **Task 7** — chambers slim-down.
8. **Task 8** — notifications smoke test.

## Conventions checklist (per task)

- [ ] All English copy in code; no em dashes (use commas/periods).
- [ ] No new design tokens; reuse Tailwind scale only.
- [ ] No hardcoded chamber names in primary content.
- [ ] No hardcoded hex outside SVG fills.
- [ ] `// TODO(api):` annotations preserved on every service call.
- [ ] Smooth transitions on appearance/disappearance (`motion-fade`, `animate-fade-in`, `transition-all duration-300`).
- [ ] Skeleton + ContentLoader pattern for any new fetch.
- [ ] Toast on every mutation.
- [ ] `npm run build` passes.
- [ ] No console errors on Dashboard / Catalogue / Loans / Chambers / Settings routes.

## Out of scope (do not do)

- Do not introduce new components — reuse atoms/molecules/organisms that already exist.
- Do not modify barrister pages, services, or shared components except `HeaderSearchBar.jsx` (Task 3) and `AppShell.jsx` (Tasks 1, 3) and `AppPage.jsx` (Task 2).
- Do not delete `authorityListsService.js`, `searchService.js`, or any service the barrister still uses, even if clerk no longer references them.
- Do not rename routes or break existing barrister deep-links.
