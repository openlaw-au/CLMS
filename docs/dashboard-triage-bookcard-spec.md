# Dashboard Triage Queue → BookCard Inline Actions Spec

## Context

`ClerkDashboardPage.jsx` currently renders a Triage Queue side-by-side
with another section (right column of the dashboard's lower grid).
Each triage row is a thin button that **navigates** the clerk to the
relevant page. The clerk has to leave the dashboard to actually
process anything.

Sean's direction: drop the side-by-side layout, move the Triage Queue
to a **full-width section below**, and render each item as a
`BookCard` so the clerk can act inline (Approve / Deny / Send
Reminder / Catalogue) without leaving the dashboard.

## Goal

After this spec:

- Triage Queue lives in a single full-width section below the
  dashboard hero / metric grid.
- Each item renders as a `BookCard` in a responsive grid (same shape
  as `ClerkLibraryPage`'s grid).
- Cards expose inline clerk actions appropriate to the item type:
  - **Pending loan request** → `Approve` + `Deny`
  - **Overdue loan** → `Send Reminder`
  - **Uncatalogued queue entry** → `Catalogue` (opens `AddBookFlow`
    with the queue prefill)
- Clicking the action processes the item in place; the card
  disappears or updates without a page navigation.
- The "navigate to library" behaviour is gone for triage rows. (Users
  who want the full Library view still have the metric tiles linking
  to `/app/library?tab=...`.)

## Implementation

### 1. `clms-app/src/components/molecules/BookCard.jsx`

Extend the optional clerk-action props introduced by APP-016:

- Add optional props `onRemind` and `onCatalogue` to the prop list.
- Update `hasApproveActions` / `hasRecallActions` priority logic so
  the action-row branching is:

  1. If `onApprove` → render `Approve` (primary) + `Deny` (danger).
  2. Else if `onRecall` → render `Recall` (recall variant) +
     `Dismiss` (secondary).
  3. **Else if `onRemind` → render a single full-width
     `Send Reminder` button (recall variant).**
  4. **Else if `onCatalogue` → render a single full-width
     `Catalogue` button (primary variant).**
  5. Else fall through to existing barrister logic.
- For the new single-button branches, the action row should fill the
  width (no 50/50 split). Keep `mt-auto pt-3` so it sits at the
  bottom of the card.
- Update the `hasAnyAction` predicate to include the new props.

Keep the existing barrister and approve/recall paths exactly as they
are. The category tag, due-date row, white background, etc. stay
unchanged.

### 2. `clms-app/src/components/pages/app/ClerkDashboardPage.jsx`

#### Layout

Find the section that currently lays out two columns (the metric grid
+ hero + the Triage Queue right-column panel — read the file end-to-end
to locate the wrapping grid). Restructure so:

- Top: dashboard hero (existing)
- Middle: metric grid (existing)
- Bottom: **full-width** Triage Queue section, no side-by-side
  partner. If there was a sibling section in the right column,
  decide whether to drop it or stack it above/below the Triage
  section. Default: **stack it below** the Triage section (do not
  delete other content silently).

The Triage section header keeps the existing
`Triage Queue (count)` title. The empty state copy stays as is
(`No items waiting. Catalogue is healthy.`).

#### Grid

Replace the existing thin-row list (the `triageItems.map(...)` button
list around line 225) with a `BookCard` grid. Use the same Tailwind
grid the `ClerkLibraryPage` uses for its book grid. Match column
counts and spacing.

#### Item shape and card props

Each triage item must resolve to a "book object" the `BookCard` can
render plus the right action prop. Build three flavours, one per
source:

```jsx
// Pending loan requests
...pendingLoans.map((loan) => {
  const book = books.find((b) => b.id === loan.bookId) || pseudoBookFromLoan(loan);
  return {
    key: `pending-${loan.id}`,
    book,
    onLoan: false,
    pendingLoan: true,
    onApprove: () => handleApprove(loan.id),
    onDeny: () => setDenyTarget(loan),
  };
}),

// Overdue loans
...overdueLoans.map((loan) => {
  const book = books.find((b) => b.id === loan.bookId) || pseudoBookFromLoan(loan);
  return {
    key: `overdue-${loan.id}`,
    book: { ...book, dueDate: loan.dueDate },
    onLoan: true,
    overdue: true,
    onRemind: () => handleRemind(loan.id),
  };
}),

// Uncatalogued queue
...pendingQueue.map((entry) => ({
  key: `queue-${entry.id}`,
  book: pseudoBookFromQueue(entry),
  onCatalogue: () => openAddBookForQueueEntry(entry),
})),
```

Helpers Codex implements inline:

- `pseudoBookFromLoan(loan)` returns a minimal book-shaped object so
  `BookCard` can render: `{ id, title: loan.bookTitle, author:
  loan.borrower ? \`Requested by ${loan.borrower}\` : '—',
  publisher: '', edition: '', enrichment: null, practiceArea: '' }`.
  This reuses the borrower meta line aesthetically as the
  "author" slot — a designer-friendly compromise so the card still
  feels coherent. Codex may choose a slightly different mapping if
  it reads better; the goal is "no broken layout when the underlying
  book record is missing or sparse."
- `pseudoBookFromQueue(entry)` similarly: `{ id: entry.id, title:
  entry.title, author: \`Added by ${entry.addedBy}\`,
  publisher: 'ISBN ' + (entry.isbn || 'pending'), edition: '',
  enrichment: null, practiceArea: '' }`.

#### Handlers to add

These currently live on `ClerkLibraryPage` — port (or re-import) into
the dashboard, keeping the same service calls:

- `handleApprove(id)` — `approveLoan(id, defaultLoanDays)` then
  refresh loans + toast.
- `handleDeny(id, reason)` — `denyLoan(id, reason)` then refresh +
  toast.
- `handleRemind(id)` — `sendReminder(id)` then refresh + toast
  ("Reminder sent to ${borrower}").
- `openAddBookForQueueEntry(entry)` — open `AddBookFlow` modal
  prefilled with the queue entry. Mirror however
  `ClerkLibraryPage` triggers the same flow (`?action=add&queueId=...`
  pattern, or a local modal state).

Bring in `LoanActionModal` for the deny-reason flow, same as
`ClerkLibraryPage`.

#### Service imports

Add (or confirm) imports:

```js
import { approveLoan, denyLoan, sendReminder } from '../../../services/loansService';
import LoanActionModal from '../../organisms/LoanActionModal';
import AddBookFlow from '../../organisms/AddBookFlow'; // or wherever the modal trigger lives
import BookCard from '../../molecules/BookCard';
```

#### State

- `denyTarget` / `setDenyTarget`
- whatever local state `AddBookFlow` requires for prefill (queueId
  selected, etc.)
- ensure a refresh call (`getLoans()` / `getQueue()`) runs after each
  successful action so the card disappears.

### 3. Visual details

- Cards should be the same size and density as on `ClerkLibraryPage`.
  Inherit the project-wide grid breakpoints.
- The full-width Triage section can wear a subtle wrapper (the
  existing `rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5`
  pattern is fine), or sit flat. Codex picks whatever the
  surrounding dashboard already uses to keep the section aesthetic.
- The empty state stays a single muted line: `No items waiting.
  Catalogue is healthy.` — but now centered in the wider container.
- Queue entries that lack an ISBN should still render — the card
  should not crash on missing `enrichment` or `dueDate`.

## Acceptance criteria

1. The clerk dashboard renders the Triage Queue as a single
   full-width section below the metric grid; no side-by-side
   partner column.
2. Each triage item is a `BookCard` showing the title, author/meta,
   and a single inline action row.
3. Pending loan request card shows `Approve` + `Deny`. Clicking
   Approve dismisses the card and toasts success. Clicking Deny
   opens `LoanActionModal`; submitting the deny reason dismisses the
   card and toasts.
4. Overdue loan card shows `Send Reminder` (full-width button) and a
   red `Overdue {date}` text row. Clicking the button toasts and
   keeps the card (reminder action does not remove the overdue
   state).
5. Uncatalogued queue card shows `Catalogue` (full-width button).
   Clicking it opens `AddBookFlow` prefilled with the queue entry.
   Successful catalogue completion removes the card from the queue.
6. The dashboard metric tiles still link to `/app/library?tab=...`
   for full views — no regression there.
7. `npm run build` in `clms-app/` is clean.
8. `npm run lint` does not introduce new errors beyond the existing
   baseline.

## Out of scope

- Re-styling the metric grid above.
- Adding new triage categories beyond the existing three (pending
  loans, overdue loans, uncatalogued queue).
- A "send reminder for all overdue" bulk action.
- Renaming the Triage Queue section. Sean has not asked; keep the
  current label.

## Verification steps for Codex

1. `cd clms-app && npm run build` — must succeed.
2. `cd clms-app && npm run lint` — no new errors.
3. Open the clerk dashboard locally (or read the resulting JSX) and
   confirm:
   - Triage section is full width, sits below the metric grid.
   - Three card types render with the correct action button(s).
   - Empty state still works when no triage items exist.
4. Report any judgment calls (especially the
   `pseudoBookFromLoan` / `pseudoBookFromQueue` shape and how
   `AddBookFlow` is opened).
