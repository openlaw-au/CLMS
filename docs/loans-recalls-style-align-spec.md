# Loans Recalls Tab Style Alignment Spec

**Date**: 2026-05-06
**Status**: Proposed
**For**: Codex implementation
**Why**: The Recalls tab in Clerk Loan Management uses inline JSX with different typography (larger title, larger subtitle, more padding) than the canonical LoanCard component used by every other tab. Align Recalls to match LoanCard.

## Canonical (LoanCard) typography

From `src/components/molecules/LoanCard.jsx`:
- Title: `text-sm font-medium text-text`
- Subtitle (borrower/requester/date): `text-xs text-text-secondary`
- Container: `py-3 gap-3`
- Icon size: 18px

## Changes

### `src/components/pages/app/ClerkLoansPage.jsx` Recalls tab inline JSX (around lines 176-202)

Currently the recalls list renders inline with these mismatched classes:
- Container: `gap-4 py-4`
- Title: `font-medium text-text` (no size class → defaults to base 16px)
- Subtitle: `text-sm text-text-secondary`

Update to match LoanCard:
- Container: `gap-3 py-3`
- Title: `text-sm font-medium text-text`
- Subtitle: `text-xs text-text-secondary`

Keep the existing icon (18px), action buttons, and click handlers untouched.

If the recall row also has a `sm:flex-row` responsive switch, keep that — only change the typography and spacing classes.

## Verification

1. `npm --prefix /Users/seanlee/Desktop/CLMS/clms-app run build` must pass.
2. Visually: switching between Recalls tab and any other tab in Loan Management produces rows of identical height, identical font sizes, identical gap.

## Out of scope

- Refactoring LoanCard to accept a recall variant (overkill for this).
- Touching action buttons inside recall rows.
- Other pages.
