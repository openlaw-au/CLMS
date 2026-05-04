# Inline Button Cleanup Spec

**For**: Codex implementation
**Status**: Proposed
**Run order**: After `button-system-spec.md` lands.
**Goal**: Eliminate every hand-rolled `<button>` clone in the React app and route through `<Button>`, `<Badge>`, `<SegmentedTabs>`, or `<FilterPill>` per intent.

---

## Why

The previous Codex run reduced `Button.jsx` to 5 variants. But 32 hand-rolled `<button>` elements with brand/red/slate styling still bypass the atom — they will drift the moment the design changes. The button system rules (orange = primary only; neutral elsewhere; red = highlight, not shout) only hold if every clickable thing on screen actually goes through the atoms.

## Hard rules (apply to EVERY migration)

1. **Brand fill (`bg-brand` / `bg-brand text-white`)** on a clickable element → `<Button variant="primary">`.
2. **Brand soft (`bg-brand/10 text-brand`)** on a clickable element → `<Button variant="secondary">`. **No exceptions** — Sean's rule: only the one primary action gets orange. Soft-brand chips violate that.
3. **Hand-rolled outline (`border border-brand` or `border border-slate-300`) used as an action** → `<Button variant="secondary">`.
4. **Hand-rolled red action (`bg-red-50 text-red-600` etc.) on a clickable element** → `<Button variant="danger">`.
5. **Tab toggles** (one of N selected, exclusive group) → `<SegmentedTabs>`.
6. **Filter dropdown / multi-select chip** → keep `<FilterPill>` (it's already an atom; just make sure unique-pattern call sites are using it).
7. **Non-clickable visual chip** (status, count, label) → `<Badge>` if it exists, otherwise leave as inline span (those are NOT buttons and out of scope for this spec).
8. **Status pills with custom dot/animation** (e.g. `StatusPillBar.jsx`) → already a dedicated component; **leave as is**.

When the call-site uses `<button>` only because the surrounding context already wraps it (e.g. inside a row that's the actual interactive target), and the inner element should NOT be a separate focusable target, **collapse the inner button into a `<span>`** and let the parent handle interaction — but only if that's clearly the intent. When in doubt, keep it as a `<Button>` so accessibility doesn't regress.

## Per-site assignments

Codex must work each row below. The classification is based on the audit; verify by reading the surrounding code before applying. If the actual call site contradicts the assignment (e.g. it's a static label, not a clickable button), record the deviation in the final report.

### Group A — replace with `<Button variant="primary">`

| File:Line | Today | Notes |
|---|---|---|
| `clms-app/src/components/molecules/HeaderSearchBar.jsx:168` | `bg-brand` round | Search trigger |
| `clms-app/src/components/organisms/IsbnLookupFlow.jsx:556` | small `bg-brand` rect | Add/confirm |
| `clms-app/src/components/pages/ScanPage.jsx:308` | `bg-brand` rect | Primary CTA on scan page |
| `clms-app/src/components/pages/app/BarristerSearchPage.jsx:320` | `bg-brand` chip | Confirms search action |

### Group B — replace with `<Button variant="secondary">`

These were brand-soft (`bg-brand/10 text-brand`) or outline-style hand-rolls. Per rule 2, all become `secondary` (slate-100 neutral). They lose the orange tint **on purpose**.

| File:Line | Today | Notes |
|---|---|---|
| `clms-app/src/components/molecules/BookCard.jsx:121` | full-width `bg-brand/10` | Card primary action — verify intent: if it's the card's main CTA, **upgrade to `primary`**, otherwise `secondary` |
| `clms-app/src/components/molecules/SearchResultCard.jsx:53` | icon-only `bg-brand/10` |  |
| `clms-app/src/components/molecules/SearchResultCard.jsx:108` | icon-only `bg-brand/10` |  |
| `clms-app/src/components/molecules/SearchResultCard.jsx:163` | icon-only `bg-brand/10` |  |
| `clms-app/src/components/molecules/SearchResultCard.jsx:253` | icon-only `bg-brand/10` |  |
| `clms-app/src/components/pages/app/ClerkAuthoritiesPage.jsx:318` | `bg-brand/10` chip |  |
| `clms-app/src/components/pages/app/ClerkAuthoritiesPage.jsx:345` | `bg-brand/10` chip |  |
| `clms-app/src/components/pages/app/ClerkAuthoritiesPage.jsx:402` | `bg-brand/5` chip |  |
| `clms-app/src/components/organisms/IsbnLookupFlow.jsx:502` | `border border-brand` outline | Plain secondary action |
| `clms-app/src/components/pages/app/BarristerDashboardPage.jsx:157` | small `border-slate-300` | "View all" link in card header |
| `clms-app/src/components/pages/app/BarristerListsPage.jsx:1656` | `border border-brand` |  |
| `clms-app/src/components/pages/app/BarristerListsPage.jsx:1680` | `border border-border` |  |
| `clms-app/src/components/pages/app/BarristerListsPage.jsx:2377` | small white pill |  |
| `clms-app/src/components/organisms/FooterSection.jsx:18` | `border border-slate-700` | Footer dark theme — verify the `secondary` variant reads OK on dark background. If contrast breaks, keep inline and flag in report. |

### Group C — replace with `<SegmentedTabs>`

These are exclusive toggle groups (one of N selected). Use the existing molecule.

| File:Line | Today | Notes |
|---|---|---|
| `clms-app/src/components/pages/app/ClerkCataloguePage.jsx:174` | view-mode toggle | Card View / Admin Table |
| `clms-app/src/components/pages/app/ClerkCataloguePage.jsx:183` | (paired with above) | Same toggle group — collapse into one `<SegmentedTabs>` |
| `clms-app/src/components/pages/app/ClerkSearchPage.jsx:351` | active vs inactive toggle | Verify it's a true segmented group |
| `clms-app/src/components/pages/WizardPage.jsx:287` | step pill | If this is a wizard progress indicator (non-clickable), leave inline. If clickable jump-to-step, use `<SegmentedTabs>`. |

### Group D — already a component, audit only

| File:Line | Today | Action |
|---|---|---|
| `clms-app/src/components/molecules/FilterPill.jsx:21` | this IS the FilterPill atom | Verify the inline class is intentional (it's the component itself). Leave alone. |
| `clms-app/src/components/molecules/StatusPillBar.jsx:15` | dedicated component | Leave alone. |

### Group E — filter pills (verify they should use `<FilterPill>`)

| File:Line | Today | Notes |
|---|---|---|
| `clms-app/src/components/pages/app/BarristerSearchPage.jsx:344` | filter chip | If multi-select dropdown, `<FilterPill>`. If toggle, `<SegmentedTabs>`. |
| `clms-app/src/components/pages/app/ClerkSearchPage.jsx:252` | filter chip | Same triage. |
| `clms-app/src/components/pages/app/BarristerListsPage.jsx:1784` | filter chip | Same triage. |

### Group F — red action vs status (judgment call)

| File:Line | Today | Decision rule |
|---|---|---|
| `clms-app/src/components/pages/app/BarristerDashboardPage.jsx:234` | red alert row | If clickable destructive action → `<Button variant="danger">`. If clickable navigation to alert detail → `<Button variant="secondary">` with red icon (the row isn't itself destructive, it's a link). **Most likely**: navigation row, not a destructive action — keep inline as a clickable card-like element, NOT a Button atom. Flag the decision in the report. |
| `clms-app/src/components/pages/app/BarristerListsPage.jsx:220` | red pill | Likely a "Recall" badge/status, not a button. Verify clickability — if static, leave inline as a Badge candidate. |
| `clms-app/src/components/pages/app/BarristerListsPage.jsx:2359` | red pill | Same as above. |

### Group G — special: brand-fill chip in BarristerSearchPage

| File:Line | Today | Notes |
|---|---|---|
| `clms-app/src/components/pages/app/BarristerSearchPage.jsx:344` (already in Group E) | re-eval if this is filter or action | If it's an action (Add to list, etc.), Group A. If filter, Group E. |

---

## Implementation rules

1. **Read the call site before migrating**. If the assignment in the table contradicts what the code is actually doing, deviate and record it.
2. **Preserve behavior exactly**: existing onClick handlers, disabled states, loading states, accessibility attributes (`aria-*`), and any size/spacing constraints around the button.
3. **Do not change the visual size beyond what `<Button size="sm|md|lg">` provides**. If the inline button uses unusual padding, pick the closest size and accept a 1–2px shift. Flag in the report if any call site has a constrained parent that would visibly break.
4. **Icon-only buttons**: use `<Button>` with the icon as the only child, plus `aria-label` so the accessible name survives.
5. After migration, search for hand-rolled buttons that match these patterns and report any leftovers:
   - `bg-brand` on a `<button>` element
   - `bg-brand/10` on a `<button>` element
   - `border border-brand` on a `<button>` element
   - Any `<button>` with `rounded-full` and brand/red coloring

## Verification

1. `npm run build` from `clms-app/` — must pass.
2. Targeted lint on touched files — must pass.
3. Manual sanity check: open `BookCard`, `SearchResultCard`, `ClerkAuthoritiesPage`, `BarristerListsPage`, `BarristerDashboardPage` and confirm no orange-tinted soft buttons remain.
4. **Do not commit.** Sean reviews the diff.

## Report at the end

- Files modified per group.
- For Group F items, record the per-site decision (Button atom vs left inline) and one-line reason.
- Any deviations from the per-site assignment table.
- Any leftover hand-rolled buttons the search caught (file:line).
- Build/lint result.

## Hard constraints

- Do NOT touch services, mocks, onboarding, settings, or `index.html`.
- Do NOT install dependencies.
- Do NOT delete spec/decision docs.
- Do NOT modify the `<Button>` atom itself — it's locked from the previous run.
