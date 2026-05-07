# Clerk Library — Toolbar, Icons, Card Actions, History List Spec

**Status**: Draft (awaiting Sean's review before Codex execution)

## Context

`ClerkLibraryPage` (the unified library introduced in APP-016) is the
clerk's main work surface. Three issues surfaced after first use:

1. **Toolbar disappears on Requests / Overdue tabs**, which causes the
   tab bar to shift right (no toolbar above to anchor it). Sean wants
   the toolbar visible on every tab.
2. **Icons broken**: the Overdue tab icon (`solar:danger-triangle-linear`)
   renders as a generic circle, and the History tab icon
   (`solar:history-linear`) is missing from the icon registry entirely.
3. **No actions on On Loan / Overdue cards**. The clerk currently can
   only act inside the Requests tab. Real clerk workflow needs:
   - **Overdue**: Send Reminder, Extend, Mark Returned
   - **On Loan**: Recall, Mark Returned

Plus Sean's follow-up: **History tab should be a list, not a card
grid** — read-only, accumulates over time, scanning a list reads better
than browsing cards.

## Goal

After this spec ships, the clerk can:

- See and use the toolbar on every tab (search / category filter /
  sort always visible).
- Recognize the Overdue tab and History tab by their icons.
- Approve loans, send reminders, extend, mark returned, recall, and
  dismiss recalls — all inline from cards / rows on the relevant tab.
- Browse loan history as a tight list view that scales as it grows.

## Implementation

### 1. Toolbar always visible

`clms-app/src/components/pages/app/ClerkLibraryPage.jsx`

- Remove the conditional that hides the toolbar on the Requests tab.
  The toolbar (search input + `CategoryDropdown` + `Select` for sort)
  renders on every tab.
- The toolbar **filters apply to whatever the current tab is showing**:
  - All / On Loan / Overdue: filter the book list as today.
  - **Requests**: filter the underlying request rows by book title /
    borrower / category. Search query matches `book.title`,
    `book.author`, `loan.borrower`, or `request.currentBorrower`.
    Category filter applies to the underlying book's `practiceArea`.
  - **History**: filter the history list (returned + denied loans) by
    book title / borrower / category, same fields as Requests.
- Sort options stay the same set (Title / Author / Practice Area /
  Publisher) for All / On Loan / Overdue. For Requests and History,
  add a sensible default sort (Requests: oldest pending first;
  History: most recent activity first) but **don't add new dropdown
  options yet** — the existing options are fine, the default just
  becomes context-aware.

### 2. Icon registry fixes

`clms-app/src/components/atoms/Icon.jsx`

- **Add** `'solar:history-linear'` mapping. Use lucide `History` icon
  (or a close visual equivalent if `History` isn't a clean fit). The
  current registry imports lucide icons; pick the one that visually
  reads as a clock-with-arrow-left or list-with-clock.
- **Re-map** `'solar:danger-triangle-linear'`. Current map points it
  at `CircleAlert`, which is the wrong shape (circle, not triangle).
  Replace with lucide `TriangleAlert` (or `AlertTriangle` depending
  on the version's export name). Keep the registry key the same so
  no caller has to change.
- Audit the registry once for any other Solar icon name that maps to
  a visually mismatched lucide icon — call out anything obvious in
  the report but don't fix in this spec unless it's a one-line
  swap.

### 3. History tab → list view

The History tab leaves the `BookCard` grid and renders as a row list:

- Use the existing `LoanCard` (`clms-app/src/components/molecules/LoanCard.jsx`)
  with `role="clerk"` and `type="returned"` / `type="denied"`. The
  same component is already used in the old `ClerkLoansPage` history
  tab, so the visual lineage is intact.
- Wrap the rows in a divided container similar to the old loans
  page:
  ```jsx
  <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 overflow-hidden">
    <div className="divide-y divide-border/40">
      {historyRows.map((row) => (
        <LoanCard key={row.id} loan={row.loan} role="clerk" type={row.type} />
      ))}
    </div>
  </div>
  ```
- Each row should be read-only (no action buttons). `LoanCard`
  already supports a passive render mode when no action handlers are
  provided.
- The toolbar above (item 1) still applies — search filters the list,
  sort decides ordering.

### 4. Card actions per tab

Two pieces: extend `BookCard` props to support the new actions, and
wire each tab to the right action set.

#### `BookCard` prop extensions

`clms-app/src/components/molecules/BookCard.jsx`

Add these optional props:

- `onMarkReturned` — clerk marks a loan as returned. Renders as
  `Mark Returned` (primary variant).
- `onExtend` — clerk extends a loan by 7/14 days. Lives in the
  overflow menu (see "Overdue overflow menu" below).
- `onRemind` — clerk sends a reminder to the borrower. Lives in the
  overflow menu when alongside `onMarkReturned`; renders standalone
  full-width when used by the dashboard triage.

`onApprove` / `onDeny` / `onRecall` / `onDismissRecall` already exist
from APP-016. Keep them. The new props join the same priority chain.

#### Overdue overflow menu (new pattern)

Sean's design call for the Overdue tab: instead of cramming three
buttons in the card footer, use a **primary action + overflow menu**:

```
[ Mark Returned (primary, flex-1) ]  [ ⋮ (kebab, w-9) ]
                                          ↓ on click
                                       ┌──────────────────────┐
                                       │ ⏰ Send Reminder       │
                                       │ ↻ Extend by 7 days    │
                                       └──────────────────────┘
```

- The kebab is a square icon button (`w-9` to match `h-9` of the
  primary button), variant `secondary`, icon
  `solar:menu-dots-bold` or similar from the registry.
- The menu is a small dropdown (~180 px wide) that opens **below
  and right-aligned to the kebab**, with a click-outside handler to
  close. Implement inline in `BookCard` — do **not** create a new
  atomic `Dropdown` component; the chambers app does not have one
  yet, and a localized inline implementation keeps scope tight.
- Each menu item is a row: leading icon + label, hover state
  `hover:bg-slate-100`, full-width inside the menu, padding
  `px-3 py-2`, text `text-sm text-text`.
- Menu items render only if their corresponding handler prop is
  passed:
  - `Send Reminder` if `onRemind`
  - `Extend by 7 days` if `onExtend`
- If neither secondary action prop is passed, the kebab does not
  render (just `Mark Returned` full-width).

#### Action priority (decides which buttons render)

Read the props in this order — first match wins:

1. `onApprove` → `Approve` + `Deny` (2-button row).
2. `onRecall` → `Recall` + `Dismiss` (2-button row).
3. `onMarkReturned` (with `onRemind` and/or `onExtend`) →
   **`Mark Returned` (primary, flex-1) + kebab dropdown** holding
   the secondary actions. This is the **Overdue tab** case.
4. `onMarkReturned` alone (no `onRemind`, no `onExtend`) →
   render **2-button row**: `Recall` (recall variant, flex-1) +
   `Mark Returned` (primary, flex-1). This is the **On Loan (active,
   not overdue)** tab case. Pair with `onRecall` from the same tab.
5. `onRemind` alone (no `onMarkReturned`, no `onExtend`) → keep the
   current dashboard-triage behaviour: full-width single
   `Send Reminder` button. Do not regress this — the dashboard
   triage relies on it.
6. `onCatalogue` alone → existing full-width `Catalogue` button.
7. Else fall through to existing barrister logic.

Keep `hasAnyAction` updated to include the new props.

#### Tab → action wiring

`ClerkLibraryPage.jsx`:

| Tab | Card actions passed | Renders as |
|---|---|---|
| All | none — info only | no action row |
| On Loan | `onRecall`, `onMarkReturned` | 2-button row: Recall + Mark Returned |
| Overdue | `onMarkReturned`, `onRemind`, `onExtend` | Primary `Mark Returned` + kebab dropdown holding `Send Reminder`, `Extend by 7 days` |
| Requests | (existing) `onApprove`, `onDeny` for loan requests; `onRecall`, `onDismissRecall` for recall requests | unchanged |
| History | n/a — rendered as `LoanCard` list, not `BookCard` grid | passive rows |

Handlers:

- `handleMarkReturned(loanId)` — calls `returnLoan(id)` from
  `loansService.js`, refreshes loans, toasts `"Marked returned"`.
- `handleExtend(loanId)` — calls `renewLoan(id)`, refreshes,
  toasts `"Extended by 7 days. New due {date}."`.
- `handleRemind(loanId)` — calls `sendReminder(id)`, refreshes,
  toasts `"Reminder sent to {borrower}"`.

These handlers already exist in the old `ClerkLoansPage` (now
deleted) — port the bodies if `ClerkLibraryPage` doesn't already
have them. The dashboard triage spec
(`docs/dashboard-triage-bookcard-spec.md`) is also adding
`handleRemind` to `ClerkDashboardPage`; keep the two handler bodies
identical (same service call, same toast copy) so behaviour matches
across surfaces.

### 5. Empty states

The empty-state copy on each tab stays as it is, but should still
render *below* a visible toolbar (no layout collapse when the tab
has no rows).

## Acceptance criteria

1. Switching between All / On Loan / Overdue / Requests / History
   keeps the toolbar (search + category filter + sort) visible at
   the same position. The tab bar does not jump right when the
   toolbar previously hid.
2. The Overdue tab pill shows a triangle icon (not a circle).
3. The History tab pill shows a clock/history icon (no longer
   broken).
4. On the Overdue tab, each `BookCard` shows a primary
   `Mark Returned` button plus a kebab (`⋮`) icon button to its
   right. Clicking the kebab opens a dropdown with `Send Reminder`
   and `Extend by 7 days`. Each action hits the corresponding
   service and toasts; clicking outside the dropdown closes it.
5. On the On Loan tab, each `BookCard` shows two buttons:
   `Recall`, `Mark Returned`. Both work end to end.
6. On the Requests tab, Approve / Deny / Recall / Dismiss continue
   to work as before.
7. The History tab renders a row list (using `LoanCard`), not a
   `BookCard` grid. Rows are read-only.
8. `BookCard` still renders without action props (the action row
   collapses) — barrister side unaffected.
9. `npm run build` clean. `npm run lint` no new errors.

## Decisions taken (Sean signed off in chat)

- **Overdue density**: option B selected — primary `Mark Returned` +
  kebab dropdown (Send Reminder, Extend). Replaces the original
  3-button row idea.
- **On Loan tab keeps `Recall` action**.
- **History default sort**: most-recent-first; date filters are a
  later follow-up.

## Out of scope

- Pagination on History (small chambers libraries won't hit limits
  for a long time; tackle when row counts cross ~200).
- Bulk actions (e.g. "remind all overdue").
- New visual variant of `BookCard` for clerk role. Reuse the same
  card with prop-driven action row.

---

**Next step**: Sean reviews this draft, especially the three open
questions. After Sean signs off, run Codex against this spec to
implement.
