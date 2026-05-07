# NewLoanModal — Single-Step Compact Layout Spec

## Context

The current `NewLoanModal` is a 3-step wizard: select book → select
borrower → confirm + set due date. With a prefilled book it skips
to step 2, but the page still shows `STEP 2 OF 3` chrome and a
borrower list of large card rows. Sean's screenshot showed
"Butterworths Australian Legal Dictionary" with a tall borrower
card list — over-engineered for what is just `book + borrower +
due date`.

## Goal

Collapse the modal into a **single-screen form** that shows:

- Book (compact strip — display only when prefilled, with a small
  Change link if no prefill so the clerk can reselect; otherwise a
  search input + compact list)
- Borrower picker (search input + compact row list)
- Due date (date input, defaulted to today + `defaultLoanDays`)
- Single submit button: `Check Out`

No multi-step wizard. No back button. No "Step X of 3" chrome.

## Implementation

`clms-app/src/components/organisms/NewLoanModal.jsx`

### Header

Replace the three-column header (Back / Step copy / Close) with a
simple title row:

```jsx
<div className="flex items-start justify-between gap-3 border-b border-border/70 px-6 py-4">
  <div>
    <h2 className="font-serif text-card-title text-text">New Loan</h2>
    <p className="mt-0.5 text-xs text-text-secondary">Check a book out to a member.</p>
  </div>
  <button
    type="button"
    onClick={requestClose}
    className="rounded-full p-1.5 text-text-muted transition-colors duration-150 hover:bg-slate-100 hover:text-text"
    aria-label="Close new loan modal"
  >
    <Icon name="solar:close-linear" size={20} />
  </button>
</div>
```

Drop `STEP_COPY`, `step` state, `handleBack`, `stepMeta`,
`stepKey`. Keep `closing`, `selectedBook`, `selectedBorrower`,
`dueDate`, `bookQuery`, `submitting`, `books`, `members`,
`loadingOptions`, `prefillBook`.

### Body — single screen

```jsx
<div className="px-6 py-5 space-y-4">
  {/* Book */}
  {selectedBook ? (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-brand/20 bg-brand/5 px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-2xs font-medium uppercase tracking-[0.12em] text-brand">Book</p>
        <p className="mt-0.5 truncate text-sm font-semibold text-text">{selectedBook.title}</p>
        <p className="truncate text-xs text-text-secondary">{selectedBook.author}</p>
      </div>
      {!prefillBook && (
        <button
          type="button"
          onClick={() => { setSelectedBook(null); setBookQuery(''); }}
          className="text-xs font-medium text-text-muted transition-colors hover:text-brand"
        >
          Change
        </button>
      )}
    </div>
  ) : (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-text-secondary">Book</label>
      <Input
        value={bookQuery}
        onChange={(e) => setBookQuery(e.target.value)}
        placeholder="Search by title or author"
      />
      {bookQuery.trim() && (
        <div className="mt-1.5 max-h-40 overflow-y-auto rounded-lg border border-border/70 bg-white">
          {filteredBooks.map((book) => (
            <button
              key={book.id}
              type="button"
              onClick={() => setSelectedBook(book)}
              className="flex w-full items-start gap-2 px-3 py-2 text-left transition-colors hover:bg-slate-50 border-b border-border/30 last:border-0"
            >
              <Icon name="solar:book-2-linear" size={14} className="mt-0.5 shrink-0 text-text-muted" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-text">{book.title}</p>
                <p className="truncate text-xs text-text-muted">{book.author}</p>
              </div>
            </button>
          ))}
          {filteredBooks.length === 0 && (
            <p className="px-3 py-3 text-center text-xs text-text-muted">No matches.</p>
          )}
        </div>
      )}
    </div>
  )}

  {/* Borrower */}
  <div>
    <label className="mb-1.5 block text-xs font-medium text-text-secondary">Borrower</label>
    <Input
      value={memberQuery}
      onChange={(e) => setMemberQuery(e.target.value)}
      placeholder="Search members"
    />
    <div className="mt-1.5 max-h-48 overflow-y-auto rounded-lg border border-border/70 bg-white">
      {filteredMembers.map((member) => {
        const avatar = member.avatarColor || DEFAULT_AVATAR;
        const isSelected = selectedBorrower?.id === member.id;
        return (
          <button
            key={member.id}
            type="button"
            onClick={() => setSelectedBorrower(member)}
            className={`flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors border-b border-border/30 last:border-0 ${
              isSelected ? 'bg-brand/5' : 'hover:bg-slate-50'
            }`}
          >
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-2xs font-semibold ring-1 ${avatar.bg} ${avatar.text} ${avatar.ring}`}>
              {member.initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-text">{member.name}</p>
              <p className="truncate text-2xs text-text-muted">{formatRole(member.role)}</p>
            </div>
            {isSelected && (
              <Icon name="solar:check-circle-bold" size={14} className="shrink-0 text-brand" />
            )}
          </button>
        );
      })}
      {filteredMembers.length === 0 && (
        <p className="px-3 py-3 text-center text-xs text-text-muted">No members found.</p>
      )}
    </div>
  </div>

  {/* Due date */}
  <div>
    <label className="mb-1.5 block text-xs font-medium text-text-secondary">Due date</label>
    <Input
      type="date"
      value={dueDate}
      onChange={(e) => setDueDate(e.target.value)}
    />
  </div>

  {/* Submit */}
  <div className="flex justify-end pt-2">
    <Button
      size="sm"
      variant="primary"
      loading={submitting}
      disabled={!selectedBook || !selectedBorrower || !dueDate}
      onClick={handleSubmit}
    >
      Check Out
    </Button>
  </div>
</div>
```

### State changes

- Add `memberQuery` state for the borrower search.
- Add `filteredMembers = useMemo(...)` that filters
  `members` by `memberQuery` (matches `name` or `role`,
  case-insensitive).
- Drop everything related to `step`, `handleBack`, `handleBookSelect`
  auto-advance, `handleBorrowerSelect` auto-advance, `LoadingState`'s
  step-specific layout, `SummaryRow`. Keep a simpler skeleton if
  desired (or just drop loading skeleton — the modal opens fast).
- `requestClose` no longer resets `step`. It still resets selection
  state.

### Filtering rules

- `filteredBooks`: only `book.status === 'available'`. If
  `bookQuery` is empty, return empty (don't show all books to keep
  the panel small). Show first ~30 matches.
- `filteredMembers`: case-insensitive match on `name` or `role`. If
  `memberQuery` is empty, return all members (the list is short
  enough — chambers are small).

### Responsive sizing

- Modal max-width unchanged (`max-w-lg`).
- The borrower list is `max-h-48` with `overflow-y-auto` so the modal
  doesn't blow out vertically.
- Mobile: same layout, just naturally narrower.

## Acceptance criteria

1. Opening `NewLoanModal` (with or without `prefillBook`) shows a
   single screen — no `STEP X OF 3` chrome.
2. With `prefillBook`, the book section shows a compact strip with
   the book and no Change link. The clerk goes straight to picking
   borrower + due date.
3. Without `prefillBook`, the book section is a search input that
   reveals a compact result list when typing.
4. Borrower section: search input + compact rows (h-7 avatar, small
   text). Selected row is highlighted.
5. Due date defaults to today + `defaultLoanDays`. Editable.
6. Single `Check Out` button at the bottom right. Disabled until
   book + borrower + date all set.
7. `npm run build` clean. `npx eslint` on the touched file clean.

## Out of scope

- Adding back a confirmation step.
- Inline date picker styling beyond the native `<Input type="date">`.
- New atoms / molecules.
- Bulk loan creation.
