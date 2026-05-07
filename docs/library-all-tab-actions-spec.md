# Library All Tab — Inline Actions Per Book State Spec

## Context

`ClerkLibraryPage`'s `All` tab currently passes the book to `BookCard`
without any action props, so every card renders as info-only. The
clerk has to switch tabs (On Loan / Overdue / Requests) to act on
anything. Sean wants actions inline on the All tab too — the All tab
is a superset of every other tab, so the action set should match the
underlying book/loan state.

## Goal

On the All tab, each `BookCard` shows the same inline action set that
the dedicated tab would render for that book's current state:

| Book / loan state | Action set (matches existing tabs) |
|---|---|
| `on-loan`, overdue | `Mark Returned` + `More ▾` (Send Reminder, Extend) — Overdue tab pattern |
| `on-loan`, not overdue | `Recall` + `Mark Returned` — On Loan tab pattern |
| pending loan request matches the book | `Approve` + `Deny` — Requests tab pattern |
| pending recall request matches the book | `Recall` + `Dismiss` — Requests tab pattern |
| `available` | `Loan Out` (full-width primary) — opens `NewLoanModal` prefilled with this book |

`Loan Out` is the inline shortcut for walk-in checkouts. The clerk
clicks the card's `Loan Out` button, the existing `NewLoanModal`
opens with the book pre-selected, the clerk picks the borrower and
confirms, and the book flips to `on-loan`. The card then re-renders
with the on-loan action set (Recall + Mark Returned). The header
`+ New Loan` button still works as a generic entry point.

## Implementation

`clms-app/src/components/pages/app/ClerkLibraryPage.jsx`

The page already has the per-tab action wiring written out for On
Loan / Overdue / Requests. Refactor that into a single helper function
and reuse it in the All tab's `BookCard` call site too.

### 1. Helper

Near the existing helper functions at the top of the file, add a
`getCardActionProps(book)` (or similar) that returns the right action
prop bag based on the book's state plus matching pending requests:

```js
function buildClerkCardActions({
  book,
  loans,
  recallRequests,
  isOverdue,
  handlers,
}) {
  // Pending recall request for this book — treat as Requests-tab actions
  const matchingRecall = recallRequests.find(
    (r) => r.bookId === book.id && r.status === 'pending',
  );
  if (matchingRecall) {
    return {
      onRecall: () => handlers.onRecall(matchingRecall.id),
      onDismissRecall: () => handlers.onDismissRecall(matchingRecall.id),
    };
  }

  // Pending loan request for this book — Approve/Deny
  const matchingPendingLoan = loans.find(
    (l) => l.bookId === book.id && l.status === 'pending',
  );
  if (matchingPendingLoan) {
    return {
      onApprove: () => handlers.onApprove(matchingPendingLoan.id),
      onDeny: () => handlers.onDeny(matchingPendingLoan),
    };
  }

  if (book.status === 'available') {
    return {
      onLoanOut: () => handlers.onLoanOut(book),
    };
  }

  if (book.status !== 'on-loan') return {};

  // On-loan: find the active/overdue loan record (one borrow at a time)
  const activeLoan = loans.find(
    (l) => l.bookId === book.id && (l.status === 'active' || l.status === 'overdue'),
  );
  if (!activeLoan) return {};

  if (isOverdue(book)) {
    return {
      onMarkReturned: () => handlers.onMarkReturned(activeLoan.id),
      onRemind: () => handlers.onRemind(activeLoan.id),
      onExtend: () => handlers.onExtend(activeLoan.id),
    };
  }

  return {
    onRecall: () => handlers.onRecallLoan(activeLoan.id),
    onMarkReturned: () => handlers.onMarkReturned(activeLoan.id),
  };
}
```

Notes:

- The helper does **not** take the `tab` param — it reads book/loan
  state directly. So All / On Loan / Overdue can all call the same
  helper and get tab-equivalent actions.
- `handlers` is just an object grouping the existing page-level
  handlers (`handleApprove`, `handleDeny`, `handleMarkReturned`,
  `handleRemind`, `handleExtend`, `handleRecallLoan`,
  `handleRecall`, `handleDismissRecall`). Wire them in the
  consumer.
- `handleRecallLoan` is the **clerk-initiated direct recall** (the On
  Loan tab's existing Recall action) — it's a different code path from
  `handleRecall` which approves a pending recall *request*. Today's
  ClerkLibraryPage already has both; the helper just plumbs them
  through.

### 2. Consumer

In the `BookCard` render block for the All tab, spread the helper's
result onto the card:

```jsx
<BookCard
  key={book.id}
  book={book}
  onLoan={book.status === 'on-loan'}
  overdue={isOverdue(book)}
  extended={book.extended || activeLoanFor(book)?.extended}
  {...buildClerkCardActions({ book, loans, recallRequests, isOverdue, handlers })}
/>
```

Apply the **same** spread to the On Loan and Overdue tab `BookCard`
call sites. The result is identical to today's behaviour for those
tabs, but the wiring lives in one place.

The Requests tab continues to render its own request-row shape (loan
request vs recall request) since those rows are not just books. No
change there.

History tab — unchanged.

### 3. Acceptance criteria

1. On the All tab, a book in each state shows the right action set:
   - on-loan + overdue → Mark Returned + More dropdown (Send
     Reminder, Extend)
   - on-loan + active → Recall + Mark Returned
   - has a pending loan request → Approve + Deny
   - has a pending recall request → Recall + Dismiss
   - available → no action row
2. Clicking any action behaves the same as it does on the dedicated
   tab today (toast, refresh, card moves accordingly).
3. The On Loan and Overdue tabs continue to work — no regressions.
4. The Requests tab continues to render its own row shape.
5. `npm run build` clean, `npx eslint` on the touched file clean.

## BookCard prop addition: `onLoanOut`

`clms-app/src/components/molecules/BookCard.jsx`

Add an optional `onLoanOut` prop. When passed (and no other clerk
action group beats it in the priority chain), render a single
full-width primary button labelled `Loan Out`:

```jsx
} else if (hasLoanOutAction) {
  <Button size="sm" variant="primary" onClick={onLoanOut} className="w-full text-xs">
    Loan Out
  </Button>
}
```

Priority chain ordering (first match wins, unchanged otherwise):

1. `onApprove` → Approve + Deny
2. `onRecall` + `onDismissRecall` → Recall + Dismiss
3. `onMarkReturned` + (`onRemind` or `onExtend`) → Mark Returned + More ▾
4. `onMarkReturned` + `onRecall` (no Dismiss) → Recall + Mark Returned
5. **`onLoanOut` → full-width Loan Out** (new)
6. `onRemind` alone → full-width Send Reminder (dashboard triage)
7. `onCatalogue` alone → full-width Catalogue/Library button
8. Barrister fallback

`hasAnyAction` includes `onLoanOut`.

## ClerkLibraryPage `handleLoanOut`

Add a handler that opens `NewLoanModal` with the book preselected:

```js
const [newLoanBook, setNewLoanBook] = useState(null);
const handleLoanOut = (book) => {
  setNewLoanBook(book);
  setShowNewLoan(true);
};
```

Pass `newLoanBook` as a prefill prop into `NewLoanModal`. If
`NewLoanModal` does not currently accept a prefill, add a
`prefillBook` prop and use it to default the book selection inside
the modal. Clear the prefill on modal close.

## Out of scope

- "Edit metadata" inline action on `available` cards.
- Pagination / virtualization on long All-tab grids.
- A confirmation toast for Loan Out beyond what `NewLoanModal`
  already shows.

## Verification steps

1. `cd clms-app && npm run build`.
2. `npx eslint src/components/pages/app/ClerkLibraryPage.jsx`.
3. Visit `/app/library` in dev mode, switch through tabs, verify
   each state's actions and that they behave identically on All vs
   the dedicated tab.
