# Clerk Phase 1 Implementation Spec

**Date**: 2026-05-01
**Source**: https://clms-spec.vercel.app/ (Phase 1 → Clerk)
**Goal**: Close the gap between current clerk side and the Phase 1 spec, mirroring the patterns established by the barrister workspace (commit `9b66480`).

## Reference patterns from barrister side

Mirror these conventions when implementing clerk features:

- **Page shell**: `animate-page-in` wrapper, `PageHeader` for title/subtitle/actions, `ContentLoader` + `Skeleton` for initial fetch state, `min` delay (~400ms) before swap.
- **Status filtering**: `StatusPillBar` with counts and icons (see `BarristerLoansPage.jsx:175-180`).
- **Modal pattern**: `fixed inset-0 z-40 bg-black/30` overlay + centered card (see `AddBookFlow.jsx`, the "Add to Authority List" modal in `BarristerLoansPage.jsx:388-435`).
- **Service pattern**: async + `await delay()` + filter `*Mock` arrays + `// TODO(api):` JSDoc on every export (see `loansService.js`).
- **Toasts**: `useToast().addToast({ message, type })` after every mutation. English copy.
- **Card list interaction**: `LoanCard` is the canonical clerk loan row (see `LoanCard.jsx` `role === 'clerk'`).
- **Reuse onboarding components**: `IsbnLookupFlow`, `CsvImportFlow` are already extracted as organisms.

## Out of scope

- Real auth, real backend, real email sending (mock with toast + state changes).
- Mobile responsive polish beyond what existing pages already do.
- New design tokens or CSS additions.

---

## Task 1 — Loans page: "+ New Loan" check-out flow

**Spec quote**: "Clerk taps '+ New Loan' → Searches or scans the book → Selects borrower from member list → Sets due date (default: 2 weeks) → Completes in under 10 seconds."

### Changes

**Add to `ClerkLoansPage.jsx`**:
- Page header action button: `<Button variant="primary">+ New Loan</Button>` opens `<NewLoanModal>`.

**New file `src/components/organisms/NewLoanModal.jsx`**:
- Three steps inside one modal (no router): `book` → `borrower` → `confirm`.
- Step 1 (book): search input + scrollable list of `getBooks()` filtered to `status === 'available'`. Show title, author, location. Click selects.
- Step 2 (borrower): scrollable list of `getMembers()`. Show avatar/initials, name, role. Click selects.
- Step 3 (confirm): show selected book + borrower, due date input prefilled to today + 14 days (use loan rule from settings if available, else 14). Primary button "Check Out".
- Back/Forward buttons between steps. Close (X) cancels.
- On Check Out → call new service `createActiveLoan(bookId, borrowerName, dueDate)` → toast "Checked out to {borrower}" → close modal → refresh loans.

**New service in `loansService.js`**:
```js
// TODO(api): Replace with POST /api/loans/check-out — clerk creates an active loan directly
export async function createActiveLoan(bookId, borrowerName, dueDate) { ... }
```
Pushes a new loan with `status: 'active'`, sets the book's `status` to `on-loan` via mutation of `booksMock` (mirror what `approveLoan` would do — currently it doesn't touch books, fix that too if needed).

### Acceptance

- Click "+ New Loan" → modal opens → pick book → pick borrower → confirm date → list refreshes with new active loan.
- Cancelling at any step closes without side effects.
- Search inside Step 1 filters by title and author.

---

## Task 2 — `LoanCard` clerk actions: Mark Returned + Extend

**Spec quote**: "'Mark Returned' (one tap, availability updates instantly), 'Extend' (adds 7 days), 'Send Reminder' (system email to borrower)."

### Changes

**`src/components/molecules/LoanCard.jsx`** clerk branch (`role === 'clerk'`):
- For `loan.status === 'active'`: replace the current `<Badge>Active</Badge>` with two buttons — `Mark Returned` (variant secondary) and `Extend` (variant secondary). Keep the badge somewhere subtle if needed for status clarity.
- For `loan.status === 'overdue'`: add `Mark Returned` and `Extend` next to the existing `Send Reminder` button.
- Wire new props `onReturn`, `onExtend` (mirror barrister-side prop names already used in this file).

**`src/components/pages/app/ClerkLoansPage.jsx`**:
- Add handlers `handleReturn(id)` → `returnLoan(id)` → toast "Marked returned" → refresh.
- Add handlers `handleExtend(id)` → `renewLoan(id)` → toast "Extended by 7 days. New due {date}" → refresh.
- Pass `onReturn={handleReturn}`, `onExtend={handleExtend}` to `LoanCard`.

**`src/services/loansService.js`**:
- Update `returnLoan` to also flip the book's `status` to `'available'` in `booksMock`.

### Acceptance

- Active loan row shows Mark Returned + Extend.
- Mark Returned moves loan to History tab; book becomes Available in catalogue.
- Extend bumps due date by 7 days, toast confirms new date.

---

## Task 3 — Incoming Recall Requests tab

**Spec quote**: "Incoming Requests Tab — displays when barrister taps 'Request Return' on on-loan book. Shows: book title, requesting barrister, current borrower, due date. Clerk can 'Recall' (automated reminder) or 'Dismiss'."

### Changes

**Promote recall requests to first-class state**:

**`src/mocks/recallRequests.js`** (new):
```js
export const recallRequestsMock = [];
export function persistRecallRequests() { /* localStorage */ }
```

**`src/services/recallRequestsService.js`** (new):
- `getRecallRequests()` → array.
- `createRecallRequest({ bookId, requesterName })` → pushes `{ id, bookId, bookTitle, requesterName, currentBorrower, dueDate, status: 'pending', requestedAt }`.
- `recallRequest(id)` → `status: 'recalled'`, plus toast-able note (the actual reminder is simulated by calling `sendReminder` against the matching active loan).
- `dismissRecallRequest(id)`.
- All with `// TODO(api):` notes.

**Update `loansService.requestReturn`** to also call the new `createRecallRequest` (so barrister-side flow now feeds clerk-side queue).

**`ClerkLoansPage.jsx`**:
- Add a 5th tab `Recalls` between `Pending` and `Active`. Count badge shows pending recall count.
- Render a recall list with one card per recall: book title, "{requester} requested · current borrower {borrower} · due {date}". Two buttons: `Recall` (calls service + sends reminder + toast) and `Dismiss`.

### Acceptance

- Barrister "Request Return" on on-loan book → clerk sees new entry in Recalls tab.
- Clicking Recall fires reminder (toast) and removes entry; Dismiss removes entry without toast about reminder.

---

## Task 4 — Catalogue page: post-load Scan + Paste ISBN entry points

**Spec quote**: "Walk along shelf, scan each book's barcode, done. No typing required."

### Changes

**`ClerkCataloguePage.jsx`** PageHeader actions (currently has Add Book + Import CSV):
- Add `Scan ISBN` and `Paste ISBNs` buttons. Use `solar:scanner-linear` and `solar:clipboard-text-linear`.
- Each opens a new modal `<IsbnIntakeModal mode="scan" | "paste">`.

**New file `src/components/organisms/IsbnIntakeModal.jsx`**:
- Same shell as `ImportModal.jsx` (full-screen-ish modal with header + close + body).
- Body wraps the existing `IsbnLookupFlow` component (already used in onboarding step 3).
- Footer button: `Add {n} books to catalogue` → calls `addBook` for each row → toast "{n} books added" → close + refresh.

### Acceptance

- Catalogue page header now shows 4 actions: Add Book, Import CSV, Scan ISBN, Paste ISBNs.
- Scan/Paste flow lets clerk add multiple books in one session, then closes back to refreshed catalogue.

---

## Task 5 — Settings: Loan Rules + Reminders configuration

**Spec quote**: "Configurable Settings — default loan period (7/14/21 days), reminder timing, whether to include book location in return instructions."

### Changes

**`src/context/AppContext.jsx`** (or wherever onboarding state lives): add `chambersSettings` slice with defaults:
```js
chambersSettings: {
  defaultLoanDays: 14,
  reminderDaysBefore: 3,
  includeLocationInReminders: true,
}
```
Persist via existing context persistence.

**`SettingsPage.jsx`**:
- Replace the "Configuration coming soon" stub for `loan-rules` with: radio group for default loan period (7/14/21), helper text about how it affects the New Loan default.
- Replace the stub for `reminders` with: radio group for reminder lead time (1/3/7 days before due), checkbox for "Include shelf location in return instructions". Show a small preview of what the reminder email would say.
- Save changes via `updateOnboarding({ chambersSettings: ... })`. Toast "Settings saved".

**Wire into Task 1**: `NewLoanModal` step 3 reads `chambersSettings.defaultLoanDays` for the default due date.

### Acceptance

- Clerk → Settings → Loan Rules expands to working radio group.
- Changing default loan period to 21 days → opening + New Loan now defaults due date to today + 21.
- Reminders section saves preferences and shows preview text.

---

## Execution order

1. **Task 2** (LoanCard buttons + service tweak) — smallest, unblocks demo of active loan workflow.
2. **Task 1** (New Loan modal) — depends on members service already existing.
3. **Task 5** (Settings) — quick once context slice is in place; provides default for Task 1.
4. **Task 3** (Recall queue) — needs barrister `requestReturn` re-wired.
5. **Task 4** (Scan/Paste catalogue intake) — pure additive UI.

## Conventions checklist for every task

- [ ] All English copy; no em dashes (use commas/periods).
- [ ] `// TODO(api):` on every new service function.
- [ ] No new design tokens; reuse Tailwind scale only.
- [ ] No hardcoded chamber names in primary content.
- [ ] Smooth transitions on appearance/disappearance (`motion-fade`, `animate-fade-in`, `transition-all duration-300`).
- [ ] Skeleton + ContentLoader pattern for any new fetch.
- [ ] Toast on every mutation.
