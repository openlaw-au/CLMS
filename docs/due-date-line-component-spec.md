# DueDateLine Component + Extended Flag Spec

## Context

Two issues:

1. The icon-and-text alignment in due-date rows drifts across the app.
   `BookCard` uses one set of classes (`flex items-center gap-1 text-[11px] leading-none`),
   `LoanCard` uses another, and other surfaces eyeball it. Sean wants a
   single component that owns this rendering so it stays consistent
   across barrister and clerk surfaces.
2. After a loan is extended via `renewLoan`, the new due date is
   indistinguishable from a fresh due date. Sean wants extended loans
   to read `Due 14 May (extended)` so the clerk can tell at a glance
   that the loan has already been bumped once.

## Implementation

### 1. New component `DueDateLine`

Create `clms-app/src/components/molecules/DueDateLine.jsx`.

Props:

- `dueDate` (string, required) — ISO `YYYY-MM-DD` or whatever
  `formatShortDate` already accepts.
- `overdue` (bool, default `false`).
- `extended` (bool, default `false`).
- `className` (string, optional) — appended to the container so
  callers can tweak margins (e.g. `mt-3`).

Render:

```jsx
<div className={`flex items-center gap-1 text-[11px] leading-none ${
  overdue ? 'font-medium text-danger' : 'text-text-secondary'
} ${className}`}>
  <Icon name="solar:calendar-linear" size={12} className="shrink-0" />
  <span>
    {overdue ? 'Overdue' : 'Due'} {formatShortDate(dueDate)}
    {extended && (
      <span className="ml-1 text-text-muted">(extended)</span>
    )}
  </span>
</div>
```

Notes:

- `flex items-center` + `leading-none` are the alignment pair that
  fixes the icon/text drift. Do not change.
- Icon uses `shrink-0` so wrapping/truncation never squeezes it.
- The `(extended)` suffix is muted so it reads as metadata, not as a
  primary signal. It applies in both overdue and non-overdue states.
- Component must render nothing if `dueDate` is falsy
  (`if (!dueDate) return null;`). Callers can stop pre-checking.

### 2. Replace inline due-date markup with `DueDateLine`

**`clms-app/src/components/molecules/BookCard.jsx`** (around lines
130–134, the existing `{onLoan && book.dueDate && (...)}` block):

Replace the entire JSX block with:

```jsx
{onLoan && (
  <DueDateLine
    dueDate={book.dueDate}
    overdue={overdue}
    extended={extended}
    className="mt-3"
  />
)}
```

Add `extended` to the `BookCard` prop list (default `false`). Import
`DueDateLine`.

**`clms-app/src/components/molecules/LoanCard.jsx`** — the file uses
due-date text in three modes:

- Lines around 71 / 79 — inline text inside a sentence
  (`"... due {date}"`). Leave as is — these are sentence flow, not a
  standalone row.
- Line ~88 — bold red `formatShortDateOrFallback` rendering. Leave as
  is unless it's a freestanding row; if it sits inline in a sentence,
  leave.
- Lines around 137 / 220 — if either renders a freestanding
  icon + date row, swap that block for `<DueDateLine ... />`.
  Otherwise leave.

Codex should read each call site and decide; **do not force the
component into inline sentence positions** — only swap freestanding
row patterns.

**`clms-app/src/components/pages/app/BarristerLoansPage.jsx:298`** —
the overdue banner has `· due {formatShortDate(b.dueDate)}` as part
of a chip. Leave as is (sentence flow).

### 3. `extended` flag on loans + book sync

`clms-app/src/services/loansService.js`:

- In `renewLoan(id)`, after updating `loan.dueDate` and
  `loan.status`, set `loan.extended = true`. Also sync the book:
  `book.extended = true` inside the same `if (book) { ... }` block.
- In `returnLoan(id)` (the function that marks a loan returned and
  resets the book to available), reset the book's `extended` flag
  to `false` (or `delete book.extended`). Do **not** mutate the
  loan's `extended` — the historical loan record keeps the flag.
- In `createActiveLoan(...)`, set `extended: false` on the new loan
  (defaults are explicit, easier to read).
- `getLoanStatusForDueDate` does not change.

`clms-app/src/services/booksService.js` — only update if it
explicitly initializes books somewhere; otherwise the `book.extended`
field just lives on the mock objects.

### 4. Mock data — show one extended loan

`clms-app/src/mocks/books.js`:

Pick **one** of the on-loan books that is **not** overdue (e.g.
`b8` Fleming on Torts, due 2026-05-15 with borrower Alistair Keane)
and add `extended: true`. This way the demo shows a `(extended)`
suffix on a non-overdue card.

`clms-app/src/mocks/loans.js`: if a parallel `loansMock` entry
exists for the same book, add `extended: true` there too so the data
stays consistent.

### 5. Page wiring — pass `extended` to `BookCard`

**`clms-app/src/components/pages/app/ClerkLibraryPage.jsx`**: where
`<BookCard ... book={book} ... />` is rendered (book grid for All /
On Loan / Overdue), add the prop:

```jsx
<BookCard
  ...
  extended={book.extended === true || loanForBook(book)?.extended === true}
/>
```

If a `loanForBook` lookup is awkward, a simpler approach: look up
`loans.find((l) => l.bookId === book.id)?.extended` once per render
and pass it through. Codex picks the cleaner option that matches the
existing data flow on this page.

**`clms-app/src/components/pages/app/BarristerLoansPage.jsx`** —
same: pass `extended={book.extended === true || ...}` to each
`BookCard` instance.

## Acceptance criteria

1. A new file `clms-app/src/components/molecules/DueDateLine.jsx`
   exists and exports the component with the props listed above.
2. `BookCard` no longer contains an inline icon+text JSX block for
   the due-date row; it delegates to `DueDateLine`.
3. The icon and the text share a single baseline (no vertical drift)
   on every card visible across barrister and clerk surfaces.
4. After clicking `Extend by 7 days` on an overdue card, the card
   moves out of the Overdue tab (existing behaviour) and the
   resulting On Loan / regular card shows
   `Due {newdate} (extended)` with the `(extended)` portion in
   muted gray.
5. The mock library shows at least one card already in the
   `(extended)` state on first load (without the user having to
   click Extend), so the styling can be visually verified.
6. `npm run build` clean.

## Out of scope

- Replacing inline sentence-style "due {date}" text (LoanCard
  paragraphs, banner chips). Those remain inline.
- Tracking number of extensions (1×, 2×, 3×). The flag is binary.
- Surfacing `(extended)` in non-card contexts (alerts, toasts).

## Verification steps for Codex

1. `cd clms-app && npm run build`.
2. `npx eslint` on the touched files.
3. Read the resulting `DueDateLine.jsx` plus the updated
   `BookCard.jsx` to verify the markup matches the pattern in
   section 1, especially `flex items-center` + `leading-none`.
4. Confirm the mock book with `extended: true` actually renders the
   suffix.
