# Clerk Library Unification — Implementation Spec

Implements [APP-016](decisions/app/APP-016-clerk-library-unification.md):
collapse `ClerkCataloguePage` and `ClerkLoansPage` into a single
`ClerkLibraryPage` that mirrors the barrister-side `BarristerLoansPage`
IA. The new page reuses `BookCard` for every tab, with role-specific
clerk actions (Approve / Deny / Recall) appearing only on the
**Requests** tab.

## Goal

After this spec lands the clerk side has:

- One `Library` page (`/app/library`) with tabs:
  `All / On Loan / Overdue / Requests / History`.
- A single `Library` sidebar entry (Catalogue and Loans entries are
  removed).
- The same toolbar (search + category filter + sort) the barrister
  side has, applied to non-Requests tabs.
- Requests tab carries a number badge equal to
  `pendingLoans.length + pendingRecallRequests.length`.
- `BookCard` rendering with category tag visible in every tab; action
  buttons (Approve / Deny / Recall / Dismiss) appear **only** on
  Requests-tab cards.
- Header actions: `+ Add Book`, `+ New Loan`, `Export`.

## Scope

### Create

#### `clms-app/src/components/pages/app/ClerkLibraryPage.jsx`

The new unified page. Use `BarristerLoansPage.jsx` as the structural
reference (search input + `CategoryDropdown` + `Select` for sort,
followed by `SegmentedTabs` status pills, followed by `BookCard` grid).
Adapt the data model to clerk needs as specified below.

State + data:

- Fetch on mount: `getBooks()`, `getLoans()`, `getRecallRequests()`.
- `pendingLoans = loans.filter(l => l.status === 'pending')`.
- `pendingRecallRequests = recallRequests.filter(r => r.status === 'pending')`.
- `activeLoans = loans.filter(l => l.status === 'active')`.
- `overdueLoans = loans.filter(l => l.status === 'overdue')` (or derive from
  on-loan books with past dueDate, matching `BarristerLoansPage`'s
  `isOverdue` helper).
- `returnedLoans` and `deniedLoans` for History.
- `availableBooks` and `onLoanBooks` for tab filtering.
- Toolbar state: `query`, `sort`, `selectedAreas`, `tab`.

Tabs (use `SegmentedTabs`):

```jsx
const tabs = [
  { key: 'all', label: 'All', count: books.length, icon: 'solar:book-2-linear' },
  { key: 'on-loan', label: 'On Loan', count: onLoanBooks.length, icon: 'solar:clock-circle-linear' },
  { key: 'overdue', label: 'Overdue', count: overdueLoans.length, icon: 'solar:danger-triangle-linear', tone: 'red' },
  { key: 'requests', label: 'Requests', count: pendingLoans.length + pendingRecallRequests.length, icon: 'solar:inbox-linear', badge: (pendingLoans.length + pendingRecallRequests.length) > 0 },
  { key: 'history', label: 'History', count: returnedLoans.length + deniedLoans.length, icon: 'solar:history-linear' },
];
```

Pick the existing `SegmentedTabs` props that match
`BarristerLoansPage`'s usage. The number-badge prop name should be the
same one `ClerkLoansPage` already used for the overdue dot.

Tab-specific data sources:

| tab | rendered list |
|---|---|
| `all` | `books` (filtered by toolbar) |
| `on-loan` | books where `status === 'on-loan'` and not overdue (filtered by toolbar) |
| `overdue` | books where `isOverdue(book)` (filtered by toolbar) |
| `requests` | union of pending loan requests + pending recall requests, mapped to the underlying book |
| `history` | books referenced by returned + denied loans (filtered by toolbar) |

Toolbar visibility:

- Show search + category filter + sort on `all / on-loan / overdue /
  history`.
- Hide the toolbar entirely on the `requests` tab (those rows are
  request items, not catalogue browsing — sort by request date, not
  by title).

Card rendering:

For non-Requests tabs:

```jsx
<BookCard
  key={book.id}
  book={book}
  onLoan={book.status === 'on-loan'}
  overdue={isOverdue(book)}
/>
```

No action props passed. The `BookCard` component already renders
nothing in the action row when no `onRequest` / `onAddToList` is
provided — confirm this is true; if not, gate the action row on a
truthy prop. (See "BookCard prop tweak" below.)

For the Requests tab:

```jsx
<BookCard
  key={book.id}
  book={book}
  onLoan={book.status === 'on-loan'}
  overdue={isOverdue(book)}
  pendingLoan
  onApprove={() => handleApprove(loanId)}
  onDeny={() => setDenyTarget(loan)}
  // for recall requests:
  onRecall={() => handleRecall(requestId)}
  onDismissRecall={() => handleDismissRecall(requestId)}
/>
```

The Requests tab item shape needs to know which underlying book to
render and whether the row is a loan request or a recall request.
Mirror `ClerkLoansPage`'s `inboxItems` shape:
`{ id, type: 'loan-request' | 'recall-request', loan?, request?,
sortDate }` and use the per-row `type` to decide which action props
to pass.

Header actions:

```jsx
<PageHeader title="Library" subtitle="Manage the catalogue and incoming loan activity in one place.">
  <div className="flex items-center gap-2">
    <Button variant="secondary" size="sm" onClick={handleExport}>
      <Icon name="solar:download-linear" size={14} /> Export
    </Button>
    <Button variant="secondary" size="sm" onClick={() => setShowAddBook(true)}>
      <Icon name="solar:add-circle-linear" size={14} /> Add Book
    </Button>
    <Button variant="primary" size="sm" onClick={() => setShowNewLoan(true)}>
      <Icon name="solar:add-circle-linear" size={14} /> New Loan
    </Button>
  </div>
</PageHeader>
```

Export handler — implement a CSV download for the **current tab**'s
visible rows. Columns: `Title, Author, Publisher, Edition, Status,
Borrower, Due Date`. Use a basic in-browser blob/download approach;
mark with `// TODO(api): replace with GET /api/library/export` for
the real endpoint.

Modals to wire:

- `LoanActionModal` (deny reason) — open when `denyTarget` is set,
  same as `ClerkLoansPage`.
- `NewLoanModal` — open from the New Loan button.
- `AddBookFlow` (the existing flow) — open from the Add Book button.
  Mirror however `ClerkCataloguePage` currently triggers it.

### Modify

#### `clms-app/src/components/molecules/BookCard.jsx`

The card currently has barrister-side actions (Request / + List /
Borrowed pill, etc.). Add **clerk-side action variants** without
breaking the barrister side:

1. New optional props: `onApprove`, `onDeny`, `onRecall`,
   `onDismissRecall`.
2. The action row at the bottom of the card decides what to render
   based on which props were passed:
   - If `onApprove` is present → render `Approve` (primary) +
     `Deny` (danger) buttons.
   - Else if `onRecall` is present → render `Recall` (recall) +
     `Dismiss` (ghost / secondary) buttons.
   - Else fall through to the existing barrister action logic
     (Request / Borrowed pill / etc.).
3. The action row should still pin to the bottom (`mt-auto`) and the
   two buttons should split width 50/50 the same way the
   Request / + List buttons currently do.
4. If neither barrister nor clerk action props are passed, the action
   row collapses (no empty space). Verify this — if the current code
   always renders a bottom row, gate it behind `hasAnyAction`.

Keep all current card visuals (category tag, due-date row, white bg)
unchanged.

#### `clms-app/src/components/pages/AppPage.jsx`

Currently the clerk role mapping registers
`catalogue: ClerkCataloguePage`, `library: ClerkCataloguePage`,
`loans: ClerkLoansPage`. Update to:

- `library: ClerkLibraryPage` (the new page).
- `catalogue: ClerkLibraryPage` (alias — keep so old links work).
- `loans: ClerkLibraryPage` (alias — same reason).

Drop the imports of `ClerkCataloguePage` and `ClerkLoansPage` if no
other files import them; otherwise keep the imports until the files
are deleted (see Delete section).

#### `clms-app/src/components/organisms/AppShell.jsx`

The clerk nav (around lines 20–22 — verify) currently has:

```js
{ label: 'Catalogue', slug: 'catalogue', icon: 'solar:book-2-linear' },
{ label: 'Loans', slug: 'loans', icon: 'solar:inbox-linear' },
```

Replace with a single entry:

```js
{ label: 'Library', slug: 'library', icon: 'solar:library-linear' },
```

Also update any clerk-side references that hardcode `/app/catalogue`
or `/app/loans` paths to `/app/library`. Notably the notifications
side-effect around line 86 (`to: '/app/loans'` for overdue / pending
notifications) — repoint to `/app/library?tab=requests` or
`/app/library?tab=overdue` accordingly. Likewise the
`'Add Book' /app/catalogue?action=add'` quick-action link should become
`/app/library?action=add` (or whatever the new page expects).

The `library` mapping already exists for barrister role — leave the
barrister side untouched.

### Delete

#### `clms-app/src/components/pages/app/ClerkCataloguePage.jsx`

Delete the file. Before deleting, **verify** no surviving imports
reference it. If any quick-add or modal logic from this page is not
yet covered by `ClerkLibraryPage`, port it before deleting.

#### `clms-app/src/components/pages/app/ClerkLoansPage.jsx`

Delete the file. Same verification — port any logic
(`handleApprove`, `handleDeny`, `handleRemind`, `handleReturn`,
`handleExtend`, `handleRecall`, `handleDismissRecall`) into the new
`ClerkLibraryPage`. The `LoanActionModal` and `NewLoanModal` imports
move to the new page.

### Routing

If routes are declared anywhere besides `AppPage.jsx`, update them.
The repo's grep earlier showed routes are not in `clms-app/src/routes`
— `AppPage.jsx` is the routing entry. So updating `AppPage.jsx` is
sufficient.

## Acceptance criteria

1. Visiting `/app/library` (clerk role) renders the new unified page.
2. `/app/catalogue` and `/app/loans` (clerk role) also render
   `ClerkLibraryPage` (alias paths).
3. The clerk sidebar shows `Library` only (no `Catalogue`, no
   `Loans` / `Loan Management`).
4. Tabs: `All / On Loan / Overdue / Requests / History`. The
   Requests tab shows a number badge when at least one pending loan
   or pending recall exists.
5. Approve / Deny on the Requests tab continue to work (loan
   request approve, recall request approve). The deny modal opens
   with the same `LoanActionModal` UX.
6. The toolbar (search + category filter + sort) is functional on
   non-Requests tabs and hidden on the Requests tab.
7. `+ Add Book`, `+ New Loan`, and `Export` are reachable from the
   page header. Export downloads a CSV of the current tab's visible
   rows with the columns listed in the spec.
8. The category tag continues to appear on every `BookCard` in
   every tab (no regression on the barrister side).
9. `npm run build` in `clms-app/` is clean.
10. `git grep -n "ClerkCataloguePage\\|ClerkLoansPage" clms-app/src`
    returns zero references after the files are deleted.

## Verification steps for Codex

1. `cd clms-app && npm run build` — must succeed.
2. `cd clms-app && npm run lint` — no new errors beyond the existing
   baseline (do not chase unrelated lint debt).
3. `git grep -n "ClerkCataloguePage\\|ClerkLoansPage" clms-app/src` —
   expect zero hits.
4. `git grep -n "/app/catalogue" clms-app/src` — expect zero hits
   (or only inside the alias mapping in `AppPage.jsx`, if Codex chose
   to keep the alias).
5. Read `BookCard.stories.jsx` and confirm existing stories
   (Available / OnLoan / Overdue / Borrowed / LoanRequested /
   ReturnRequested) still render correctly under the new prop logic.
   Add a new story (`ClerkRequest`) showing Approve + Deny buttons
   if it does not already exist.

Report a per-file summary, the build/lint result, and any judgment
calls Codex made (e.g. how the Export CSV is structured, whether the
`Add Book` flow opens the existing `AddBookFlow` component or a new
modal trigger).

## Out of scope

- Reminder send action on the Overdue tab cards. Overdue is
  information-only this pass. Reminder logic stays available in the
  service but is not surfaced from the new card layout yet.
- Deleting `ClerkCataloguePage`-specific cataloguing-quality views
  (Enriched / ISBN Only filters). Not migrated; gone with the file.
- Re-styling `LoanActionModal`, `NewLoanModal`, `AddBookFlow`. Use
  them as is.
- Barrister-side IA changes — barrister `Library` page stays as is.
