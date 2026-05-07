# Spec: Barrister recall-requested state — unify label & combine cancel into button

## Context
On the barrister side, when a borrower requests a recall on a book they currently hold, the card today shows:
- Top status pill: "Return Requested" in `bg-info/10 text-info` (blue)
- Bottom row: a small "Return Requested" pill (with clock icon) + a separate "Cancel" text link + (where applicable) a "+ List" button

The clerk side already labels the same state as **Recall Requested** in `bg-warning/10 text-warning` (amber/orange). We want the barrister side to use the same label/colour, and we want the redundant pill+Cancel pair at the bottom to collapse into a single confirm-style button.

## Changes

### 1. Status pill label (top of card)
- `clms-app/src/components/molecules/BookCard.jsx` line ~108: change the status entry currently producing `{ text: 'Return Requested', cls: 'bg-info/10 text-info' }` to `{ text: 'Recall Requested', cls: 'bg-warning/10 text-warning' }` so the top pill matches the clerk-side label and color.

### 2. Bottom action — replace pill+Cancel with a single "Requested" toggle button
Two places render this combo today:

**a) `clms-app/src/components/molecules/BookCard.jsx` lines ~348–357**
Currently:
```jsx
<div className="flex animate-fade-in items-center gap-2">
  <span className="inline-flex items-center gap-1 rounded-md bg-info/10 px-2 py-0.5 text-xs font-medium text-info">
    <Icon name="solar:clock-circle-linear" size={12} />
    Return Requested
  </span>
  {onCancelReturn && (
    <button type="button" onClick={() => onCancelReturn(book.id)} className="text-xs text-text-muted hover:text-text">Cancel</button>
  )}
</div>
```
Replace with a single full-width pill-style button (matching the look of the SearchResultCard "Recall Requested" check button — `solar:check-circle-linear` icon + "Requested" text). When clicked, it should ask the user "Cancel recall request?" via `window.confirm`, and if confirmed, call `onCancelReturn(book.id)`. Visual treatment: a soft success / neutral state (e.g. `bg-success/10 text-success` or `bg-slate-100 text-text` — match existing "Recall Requested" check button styling in `SearchResultCard.jsx` around line 232–236 if a clear pattern exists; otherwise use `bg-success/10 text-success` with check icon to suggest "done"). Keep `w-full text-xs` sizing consistent with sibling buttons in this branch.

**b) `clms-app/src/components/pages/app/BarristerListsPage.jsx` lines ~1722–1735**
Same change — the existing pill+Cancel combo here:
```jsx
<div className="flex shrink-0 animate-fade-in items-center gap-2">
  <span className="inline-flex items-center gap-1 rounded-md bg-info/10 px-2 py-0.5 text-xs font-medium text-info">
    <Icon name="solar:clock-circle-linear" size={12} />
    Return Requested
  </span>
  <button
    type="button"
    onClick={(e) => { e.stopPropagation(); handleCancelReturn(book); }}
    className="text-xs text-text-muted hover:text-text"
  >
    Cancel
  </button>
</div>
```
Becomes a single pill button (small, `shrink-0 whitespace-nowrap px-3 py-1.5 text-xs`, with check icon + "Requested" text). Click handler: `e.stopPropagation()`, then `if (window.confirm('Cancel recall request?')) handleCancelReturn(book);`.

### 3. Confirm dialog — use project modal, NOT `window.confirm`
Replace the `window.confirm('Cancel recall request?')` call with the project's standard modal pattern (see `clms-app/src/components/organisms/LoanActionModal.jsx` for the canonical structure: black/30 overlay with `motion-fade`, white centered card with `animate-page-in`, header + body copy + Cancel/Confirm buttons, `MODAL_CLOSE_MS = 200`).

Add a small reusable `clms-app/src/components/molecules/ConfirmModal.jsx`:
- Props: `title`, `body`, `confirmLabel` (default "Confirm"), `cancelLabel` (default "Cancel"), `confirmVariant` (default `'danger'`), `onConfirm`, `onClose`
- Same overlay + card animation pattern as LoanActionModal
- Renders title (font-serif card-title), optional body paragraph, then Cancel + Confirm buttons aligned right

Wire it in:
- `BookCard.jsx`: add local `confirmingCancel` state. The new "Requested" button toggles it; render `<ConfirmModal>` (title `Cancel recall request?`, confirmLabel `Cancel recall`, cancelLabel `Keep`, confirmVariant `danger`, onConfirm calls `onCancelReturn(book.id)`) when active.
- `BarristerListsPage.jsx`: lift `cancelReturnTarget` state to the page level (the book whose cancel-confirm modal is open). The new pill button sets it on click; render `<ConfirmModal>` once at page level when `cancelReturnTarget` is set; onConfirm calls `handleCancelReturn(cancelReturnTarget)`.

### 4. Out of scope
- Do NOT change the `SearchResultCard.jsx` recall button — that one already uses the check + "Recall Requested" pattern.
- Do NOT change clerk-side recall UI.
- Do NOT change any data flow / service calls — the `onCancelReturn` / `handleCancelReturn` handlers already exist and continue to be used.

## Acceptance
- Barrister card top pill reads "Recall Requested" in amber.
- Barrister card bottom shows one button: check icon + "Requested" (no separate "Cancel" link, no extra status pill in the action row).
- Clicking that button shows a native confirm dialog "Cancel recall request?". OK → recall is cancelled (existing handler runs). Cancel → nothing happens.
- "+ List" button (where it appears) is unaffected.
- No regressions in non-recall states (Loan Requested, Borrowed, Available, Overdue, On Loan).
