# BookCard Add Button Equal Width Spec

**Date**: 2026-05-06
**Status**: Proposed
**For**: Codex implementation
**Why**: Make the "Add to List" button match the same labeled-button shape as "Request Loan" / "Request Return", and have them split the row 50/50 instead of one being a small circular icon.

## Changes

`src/components/molecules/BookCard.jsx`

### Action row restructure

Replace the current action row (the `mt-3 flex items-center gap-2` block introduced in the previous spec) with:

```jsx
<div className="mt-3 flex items-center gap-2">
  <div className="flex-1 min-w-0">
    {/* existing primary action / status branches:
       onLoan && returnRequested → Return Requested chip
       onLoan && alreadyBorrowed → Borrowed badge
       onLoan && onRequestReturn → Request Return Button (full width inside flex-1)
       onLoan fallback → On Loan badge
       pendingLoan → Loan Requested chip
       alreadyBorrowed → Borrowed badge
       default → Request Loan Button (full width inside flex-1)
    */}
  </div>
  {onAddToList && (
    <Button
      size="sm"
      variant="secondary"
      onClick={onAddToList}
      className="flex-1 min-w-0 text-xs"
    >
      <Icon name="solar:add-circle-linear" size={14} />
      Add to List
    </Button>
  )}
</div>
```

Key points:
- Both children are `flex-1 min-w-0` so they split the row 50/50.
- The Add button is now a `<Button variant="secondary" size="sm">` matching the visual weight of Request Loan / Request Return.
- Label is `Add to List` (matches existing copy used elsewhere — keep title attribute / aria-label aligned: `aria-label="Add to authority list"` if the previous accessibility text was important; otherwise the visible label suffices).
- Use icon `solar:add-circle-linear` size 14 inside the button to match the size of icons in other small buttons.
- The inner Button inside `flex-1` keeps `className="w-full text-xs"` so it fills its container.

### Edge case: status badges (Borrowed, On Loan, Loan Requested, Return Requested)

When the left side is a status badge (not a button), the badge will sit centered in the `flex-1` wrapper. To keep visual rhythm, add `flex items-center` to the wrapper around the badge OR wrap the badge with `<div className="flex w-full items-center">`. The Add to List button on the right keeps its 50% width.

If the badge group has its own inline Cancel link (e.g. `flex animate-fade-in items-center gap-2`), keep that markup intact inside the `flex-1 min-w-0` wrapper.

### Alternative: hide Add button when book status doesn't allow

For now, ALWAYS render the Add to List button when `onAddToList` is provided, regardless of loan status. (Authority list addition is independent of loan state — a book that's currently on loan can still be added to a list.)

## Verification

1. `npm --prefix /Users/seanlee/Desktop/CLMS/clms-app run build` must pass.
2. Visually:
   - Available book: `Request Loan | Add to List` 50/50.
   - On loan with onRequestReturn: `Request Return | Add to List` 50/50.
   - Borrowed / On Loan / Loan Requested badge states: badge on left half, `Add to List` button on right half.
3. Buttons have identical size (h-* matches), text-xs, secondary variant.
4. No row overflow on narrow widths — both buttons can wrap if needed via flex-wrap (not required for now; let it overflow horizontally on very narrow viewports).

## Out of scope

- LoanCard / other cards.
- Adding new icon variants.
- Changing the "Add to authority list" tooltip / aria semantics meaningfully.

## Conventions

- Tailwind scale only.
- No new tokens.
- English copy.
