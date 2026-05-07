# Loans Typography Fixes Spec

**Date**: 2026-05-06
**Status**: Proposed
**For**: Codex implementation
**Why**: After aligning Recalls font sizes, two more inconsistencies remain: (1) title-to-subtitle gap differs across LoanCard variants and the Recalls inline row; (2) Overdue items with critical severity render the subtitle in `font-bold`, making them visually heavier than rows in other tabs.

## Changes

### 1. Title-subtitle gap — unify to `mt-0.5`

**`src/components/molecules/LoanCard.jsx`**:

- Clerk view (around line 40): subtitle currently has no `mt-*`. Add `mt-0.5`:
  ```jsx
  <p className={`mt-0.5 text-xs ${loan.status === 'overdue' ? severityStyles[severity] : 'text-text-muted'}`}>
  ```
- Barrister view (around line 88): already `mt-0.5` — leave it.

**`src/components/pages/app/ClerkLoansPage.jsx`** Recalls inline (around line 188):

- Currently subtitle has `mt-1`. Change to `mt-0.5`:
  ```jsx
  <p className="mt-0.5 text-xs text-text-secondary">
  ```

### 2. Remove `font-bold` from critical severity

**`src/components/molecules/LoanCard.jsx`** line 11:

Currently:
```js
const severityStyles = {
  none: 'text-text-secondary',
  warning: 'text-amber-600',
  danger: 'text-red-600',
  critical: 'text-red-600 font-bold',
};
```

Change `critical` to drop `font-bold` — keep the red color for emphasis but remove the weight bump:

```js
critical: 'text-red-600',
```

Now `danger` and `critical` look identical for the subtitle.

### 3. Remove the "Escalated" pill

**`src/components/molecules/LoanCard.jsx`** lines 74-76:

Currently:
```jsx
{severity === 'critical' && loan.status === 'overdue' && (
  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">Escalated</span>
)}
```

Delete this entire conditional block. The pill looks button-like (rounded-full with red bg) and the red subtitle text on critical overdue rows already conveys urgency. The "Send Reminder" button is the actionable next step. Removing the redundant label.

If the `severity` constant is no longer used elsewhere in LoanCard after this removal, leave the `getOverdueSeverity` import alone (still used for the subtitle color via `severityStyles[severity]`).

## Verification

1. `npm --prefix /Users/seanlee/Desktop/CLMS/clms-app run build` must pass.
2. Visually: every loan row across Pending / Recalls / Active / Overdue / History has identical title-subtitle spacing.
3. Overdue rows no longer have a bold subtitle. The "Escalated" pill remains on critical overdue items as the only visual escalation.

## Out of scope

- Other tabs.
- Severity color changes.
- Touching the Escalated pill.
