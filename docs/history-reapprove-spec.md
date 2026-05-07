# History Tab — Re-approve Denied Requests Spec

## Context

Clerks may deny a loan request by mistake. With APP-016 the denied
loans land in the History tab as read-only rows. Sean wants a backup
path: show denied rows in History (already done) **and** let the
clerk click an inline action to re-approve them — turning the loan
back into an active loan.

## Implementation

### 1. `clms-app/src/components/pages/app/ClerkLibraryPage.jsx`

**Handler.** Add a new handler near the existing `handleApprove`:

```js
const handleReapprove = async (loanId) => {
  await approveLoan(loanId, chambersSettings?.defaultLoanDays ?? 14);
  addToast({ message: 'Re-approved · Loan reactivated', type: 'success' });
  await Promise.all([refreshBooks(), refreshLoans()]);
};
```

`approveLoan` already does what we need — it sets the loan to
`active`, computes a new `dueDate`, and flips the book to `on-loan`
via `setBookOnLoan`. No service changes required.

**History row UI.** The current History table is two columns:
**Book** + **Date**. Modify the rows so each `denied` row carries a
small right-aligned `Re-approve` text-button. `returned` rows stay
unchanged (no action shown).

Approach: keep two columns. Inside the **Date** cell, render a
`flex items-center justify-between` wrapper — the date on the left,
the action on the right (if applicable). The cell padding stays
`px-5 py-3.5`. Action button styling:

```jsx
{row.type === 'denied' && (
  <button
    type="button"
    onClick={() => handleReapprove(row.loan.id)}
    className="text-xs font-medium text-brand transition-colors hover:text-brand-hover"
  >
    Re-approve
  </button>
)}
```

No icon. Brand-colored text-link style so it reads as a recoverable
action without visual noise on returned rows.

`returned` rows omit the button entirely — the cell shows just the
date.

### 2. Acceptance criteria

1. The History tab still shows both returned and denied loans.
   Denied rows show `Denied` (red) in the subtext and a small
   right-aligned `Re-approve` text link in the Date cell. Returned
   rows have no action.
2. Clicking `Re-approve` on a denied row:
   - flips the loan back to `active` with a new due date
     (`today + defaultLoanDays`).
   - flips the underlying book back to `on-loan`.
   - removes the row from History (it's no longer denied/returned)
     and surfaces it in On Loan / Overdue depending on the new due
     date.
   - toasts `Re-approved · Loan reactivated`.
3. No other tab regresses.
4. `npm run build` clean.

### 3. Out of scope

- Re-approve for `returned` loans (different operation — would need
  to re-create a loan, not just flip status). Returned stays
  read-only.
- Confirmation modal before re-approve. The toast + the row's
  visible movement are sufficient feedback for now.
- Audit trail / history of approve/deny/re-approve sequence. The
  loan record only stores its current status.
