# BookCard Button Parity & Bottom Alignment Spec

## Context
`clms-app/src/components/molecules/BookCard.jsx` renders the action row at the
bottom of each book card with two buttons: a primary action (`Request` /
`Request Recall`) on the left, and a secondary `+ List` button on the right.
Sean reports two issues:

1. The two buttons render at visibly different widths even though both wrappers
   carry `flex-1`. The `+ List` button is rendered directly with `flex-1`, but
   the primary-action wrapper is a `<div className="flex-1 min-w-0">` whose
   inner button uses `w-full`. In states where the wrapper holds a small badge
   span (`On Loan`, `Borrowed`, `Loan Requested`, `Return Requested`) the inner
   span does not fill the wrapper, so the rendered widths look unequal.
   In the *Available* state both wrappers should give 50/50, but the actual
   rendered widths still drift — likely due to `min-w-0` shrinking effects when
   the secondary button has shorter content (`+ List` ≈ 6 chars) vs the
   primary (`Request` ≈ 7 chars) plus Button atom defaults.
2. The action row is part of the card body padding, but cards in a grid have
   varying meta heights (publisher / edition / due-date / overdue chip), so
   the action row floats at different vertical offsets between sibling cards.
   Sean wants the buttons pinned to the bottom of every card so the action row
   is aligned across the row.

## Goal
- Both action-row buttons must render at **identical widths** in every state
  (Available, On Loan, Borrowed, Loan Requested, Return Requested, Overdue).
- The action row must always sit at the **bottom of the card**, regardless of
  how tall the meta block above it is.

## Out of scope
- Visual changes to button colour, size, or typography.
- Changes to the chip/pill rendering inside the action row (the
  "Borrowed" / "On Loan" / "Loan Requested" pills can stay as is — they sit
  inside the same 50%-width wrapper and align to the start of that wrapper).
- Other cards (`ChamberCard`, `LoanCard`, etc.) — only `BookCard.jsx` is in
  scope for this spec.

## Implementation

### File
`clms-app/src/components/molecules/BookCard.jsx`

### Change 1 — pin action row to card bottom
The card body already uses `flex flex-1 flex-col`. The meta block (`mt-3`)
sits above the action row (`mt-3 flex items-center gap-2`). To pin the action
row to the bottom:

- Replace the action row's `mt-3` with `mt-auto pt-3`.
  - `mt-auto` pushes the row to the bottom of the flex column.
  - `pt-3` preserves the 12px gap from whatever sits above when the meta block
    is short enough that flex-grow would otherwise collapse the gap.

(Do **not** add `mt-auto` to the meta block — only the action row needs to be
pinned.)

### Change 2 — equal-width buttons
Replace the current asymmetric structure:

```jsx
<div className="mt-3 flex items-center gap-2">
  <div className="flex-1 min-w-0">
    {/* primary: Button w-full text-xs OR a badge span */}
  </div>
  {onAddToList && (
    <Button ... className="flex-1 min-w-0 text-xs">+ List</Button>
  )}
</div>
```

with a structure where **both sides are wrapper divs of identical width**, and
each wrapper's button stretches via `w-full`:

```jsx
<div className="mt-auto flex items-stretch gap-2 pt-3">
  <div className="flex-1 basis-0 min-w-0">
    {/* primary side — Button gets w-full text-xs, OR badge span gets a
        wrapper that visually centres / starts the pill in the column */}
  </div>
  {onAddToList && (
    <div className="flex-1 basis-0 min-w-0">
      <Button
        size="sm"
        variant="secondary"
        onClick={onAddToList}
        title="Add to authority list"
        aria-label="Add to authority list"
        className="w-full text-xs"
      >
        + List
      </Button>
    </div>
  )}
</div>
```

Key invariants:
- Both children of the action row are `flex-1 basis-0 min-w-0` wrapper divs.
  `basis-0` ensures growth comes purely from `flex-grow: 1`, not from intrinsic
  content width — this is what guarantees true 50/50 split.
- Inside each wrapper, the Button uses `w-full text-xs` so the rendered button
  fills its column.
- For non-button states (badge spans like `Borrowed`, `On Loan`,
  `Loan Requested`, `Return Requested`), keep the existing pill markup
  unchanged — the wrapper still occupies its 50% column, the pill just sits
  inside it left-aligned (which matches the existing visual). The
  *button-vs-button* parity is what Sean is asking for; pill states keep their
  current look.
- The action row uses `items-stretch` (instead of `items-center`) so that when
  both sides render Buttons, both buttons share the same height.

### Change 3 — `+ List` button must use `w-full`, not `flex-1`
After Change 2 the `+ List` Button is inside a `flex-1 basis-0 min-w-0`
wrapper, so the Button itself should be `w-full text-xs` (matching the primary
Request Button). Drop the `flex-1` and `min-w-0` from the Button's own
className — those classes belong on the wrapper, not the Button.

## Acceptance criteria
1. In the *Available* state (a fresh book in `BarristerDashboardPage` library
   tab), the `Request` and `+ List` buttons in a single card render at the
   exact same width — verify by measuring in DevTools or by visual inspection
   that left/right edges align perfectly with the card's inner padding.
2. In a 3-column grid where each card has different meta heights (e.g. one
   card has an overdue chip, another doesn't), the bottom edges of the
   action-row buttons across all sibling cards align on the same horizontal
   line.
3. Pill states (`Borrowed`, `On Loan`, `Loan Requested`, `Return Requested`)
   remain visually unchanged — the pill is still left-aligned inside its half
   of the action row.
4. No regression in the Storybook story for `BookCard` (if one exists), and
   no console warnings.

## Notes for Codex
- Only `clms-app/src/components/molecules/BookCard.jsx` should be touched.
- Do not modify the `Button` atom.
- Keep the existing JSX branches for each state (returnRequested,
  alreadyBorrowed, onRequestReturn, default; pendingLoan, alreadyBorrowed,
  default) — only the wrapper structure and class names change.
