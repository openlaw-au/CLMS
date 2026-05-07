# BookCard Add Button Relocate Spec

**Date**: 2026-05-06
**Status**: Proposed
**For**: Codex implementation
**Why**: The "Add to Authority List" icon button currently sits next to the book title in `BookCard.jsx`, which clutters the title row. Move it to the action area so it sits to the right of the primary action button (Request Loan / Request Return) — same vertical row as the action.

## Changes (single file)

`src/components/molecules/BookCard.jsx`

### 1. Remove the title-row add button

Delete lines 25-36 entirely:

```jsx
{/* Add to Authority List */}
{onAddToList && (
  <button
    type="button"
    onClick={onAddToList}
    title="Add to authority list"
    aria-label="Add to authority list"
    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-brand/10 hover:text-brand"
  >
    <Icon name="solar:add-circle-linear" size={18} />
  </button>
)}
```

After removal, the title row should just be: icon span + book title.

### 2. Wrap the action row so the add button sits to the right

Around the existing action block (currently line 76 `{/* Action */}`), restructure so the primary action and the add button render side-by-side. The action button takes `flex-1`, the add button is a fixed-width icon button on the right.

Replace:

```jsx
<div className="mt-3">
  {onLoan ? (...) : pendingLoan ? (...) : alreadyBorrowed ? (...) : (
    <Button ... className="w-full text-xs">Request Loan</Button>
  )}
</div>
```

With:

```jsx
<div className="mt-3 flex items-center gap-2">
  <div className="flex-1 min-w-0">
    {onLoan ? (...) : pendingLoan ? (...) : alreadyBorrowed ? (...) : (
      <Button ... className="w-full text-xs">Request Loan</Button>
    )}
  </div>
  {onAddToList && (
    <button
      type="button"
      onClick={onAddToList}
      title="Add to authority list"
      aria-label="Add to authority list"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-brand/10 hover:text-brand"
    >
      <Icon name="solar:add-circle-linear" size={18} />
    </button>
  )}
</div>
```

Notes:
- The add button is `h-9 w-9` (36px) — slightly larger than before (was `h-8 w-8`) to match the height of the `size="sm"` Button next to it for vertical balance.
- Keep all existing branches inside the `<div className="flex-1">` (Request Loan, Request Return, On Loan badge, Borrowed badge, Loan Requested chip, Return Requested chip).
- The add button always renders on the right when `onAddToList` is provided, regardless of loan status. Authority-list addition is independent of loan state.

### 3. Visual sanity

- For status-only states (Borrowed / On Loan / Loan Requested), the badge sits in `flex-1` left side, add button on the right. Visually this remains balanced because badges are short.
- For the labeled action states (Request Loan / Request Return), the button takes `flex-1` (full available width minus the add button's 36px), the add button sits at the right edge.
- The `w-full` on the inner Button stays — it now means "fill the flex-1 wrapper", not the entire row.

## Verification

1. `npm --prefix /Users/seanlee/Desktop/CLMS/clms-app run build` must pass.
2. Visually:
   - Title row is just icon + title (no add button).
   - Action row has primary action button on left + circular add button on right.
   - Hovering the add button still highlights brand color.
3. Aria/title attributes on the add button preserved.

## Out of scope

- Other cards (LoanCard, etc.) — they don't have an `onAddToList` prop.
- Restructuring loan status badges.
- Changing icon names.

## Conventions

- No new tokens.
- Tailwind scale only.
- No copy changes.
