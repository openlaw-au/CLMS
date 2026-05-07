# Book Title Serif Spec

**Date**: 2026-05-06
**Status**: Proposed
**For**: Codex implementation
**Why**: CLMS is a chambers library for legal books. CLAUDE.md mandates Playfair Display (`font-serif`) for headings. Book titles ARE titles/headings of works and currently render in default sans across most surfaces. Apply `font-serif` consistently to every book title render so the legal/library tone reads correctly.

## Already correct (skip)

- `src/components/molecules/BookCard.jsx:23` — already has `font-serif`. ✓
- `src/components/organisms/BookDetailPanel.jsx:109` — already has `font-serif`. ✓

## Targets

Add `font-serif` to the className of each `<p>` / `<h*>` rendering a book title. Keep existing size/weight/color classes intact.

### 1. `src/components/molecules/LoanCard.jsx`

- Line 39 (clerk view): `<p className="text-sm font-medium text-text">{loan.bookTitle}</p>` → `<p className="font-serif text-sm font-medium text-text">{loan.bookTitle}</p>`
- Line 84 (barrister view): `<p className="text-sm font-semibold text-text">{loan.bookTitle}</p>` → `<p className="font-serif text-sm font-semibold text-text">{loan.bookTitle}</p>`

### 2. `src/components/pages/app/ClerkLoansPage.jsx`

- Line 186 (Recalls inline title): `<p className="text-sm font-medium text-text">{request.bookTitle}</p>` → `<p className="font-serif text-sm font-medium text-text">{request.bookTitle}</p>`

### 3. `src/components/pages/app/ClerkCataloguePage.jsx`

- Line 409 (card title): `<p className="line-clamp-2 text-sm font-semibold text-text">{book.title}</p>` → `<p className="line-clamp-2 font-serif text-sm font-semibold text-text">{book.title}</p>`

### 4. `src/components/organisms/IsbnLookupFlow.jsx`

- Line 358: `<p className="truncate text-sm font-medium text-text">{book.title}</p>` → `<p className="truncate font-serif text-sm font-medium text-text">{book.title}</p>`
- Line 609: same change.

### 5. `src/components/organisms/NewLoanModal.jsx`

- Line 202 (book picker row): `<p className="text-sm font-semibold text-text">{book.title}</p>` → `<p className="font-serif text-sm font-semibold text-text">{book.title}</p>`

## Skip (intentionally)

- `src/components/pages/ScanPage.jsx:363` — preview surface inside scan UI; if it's a dev/mockup-only screen, leave alone. If it's a production screen, also add `font-serif`. Confirm by reading file briefly; if production: apply same pattern.
- Notification messages in `AppShell.jsx:90, 93` — book title is embedded in a sentence with quotes (`"${loan.bookTitle}" is overdue`). Wrapping just the title with serif inside a sans sentence breaks reading flow. Leave as-is.
- Toast messages — same reasoning.
- Dashboard Triage Queue messages — same reasoning.

## Verification

1. `npm --prefix /Users/seanlee/Desktop/CLMS/clms-app run build` must pass.
2. Visually check Catalogue cards / Loans tabs / New Loan picker / ISBN lookup — every book title should render in Playfair Display serif.
3. Author / due date / location subtitles remain in default Inter sans.

## Out of scope

- JADE / case / legislation entries (those have their own typography conventions; defer).
- Authority list entry rendering (separate audit needed if Sean wants those serif too).
- Adding new font weights or families.
