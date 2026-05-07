# Button Secondary Revert Spec

**Date**: 2026-05-06
**Status**: Proposed
**For**: Codex implementation
**Why**: The brand-tinted soft `secondary` introduced in `button-hierarchy-spec.md` visually conflicts with the soft `danger` variant (both are "tinted light bg + tinted dark text"). Collapse `secondary` and `neutral` into a single slate-based `secondary`.

## Decision

Final variant set (4 variants):
- `primary` — solid brand (commit / lead action) — unchanged
- `secondary` — slate gray (supporting + cancel + back + skip + close) — **redefined**
- `ghost` — text-only (tertiary) — unchanged
- `danger` — soft red (destructive inline) — unchanged
- `danger-solid` — solid red (destructive confirmation) — unchanged

Drop the `neutral` variant entirely. Collapse all `variant="neutral"` call sites into `variant="secondary"`.

## Changes

### `src/components/atoms/Button.jsx`

Update `variantClasses` to:

```js
const variantClasses = {
  primary: 'bg-brand text-white hover:bg-brand-hover shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]',
  secondary: 'bg-slate-100 text-text hover:bg-slate-200',
  ghost: 'text-text-secondary hover:bg-slate-100',
  danger: 'bg-red-50 text-red-700 hover:bg-red-100',
  'danger-solid': 'bg-red-600 text-white hover:bg-red-700 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]',
};
```

(Drop the `neutral` entry. Restore `secondary` to the slate definition.)

### Migrate call sites

Run `rg "variant=\"neutral\"" /Users/seanlee/Desktop/CLMS/clms-app/src` and replace every occurrence with `variant="secondary"`. Keep the call site otherwise identical.

### Storybook

`src/components/atoms/Button.stories.jsx`: remove the `Neutral` story. Update the `Secondary` story (if it currently demos brand-tinted soft) to show the slate definition with a representative supporting-action label.

## Hierarchy rule (updated)

`primary` is reserved for the single commit action of a region. Everything supporting (Edit, Import, Scan, Mark Returned, Extend, Send Reminder, Add to List, etc.) AND everything dismissive (Cancel, Back, Skip, Close, Dismiss) is `secondary`. The visual difference between "support" and "dismiss" lives in **placement and verb**, not color.

If finer hierarchy is needed later for low-emphasis dismissal, use `ghost` (text-only).

## Verification

After migration:

1. `npm --prefix /Users/seanlee/Desktop/CLMS/clms-app run build` must pass.
2. `rg "variant=\"neutral\"" /Users/seanlee/Desktop/CLMS/clms-app/src` returns **zero matches**.
3. `rg "neutral:" /Users/seanlee/Desktop/CLMS/clms-app/src/components/atoms/Button.jsx` returns zero (variant entry removed).
4. Catalogue header still shows: `Add Book` primary (solid brand) + `Import CSV` / `Scan ISBN` / `Paste ISBNs` secondary (slate). Visual hierarchy stays clear: 1 strong CTA + 3 supporting.

## Out of scope

- Re-evaluating which buttons should be primary vs secondary (the previous spec already did that and those decisions stand).
- Touching `danger` / `danger-solid` styling.
- Storybook stories for unrelated atoms.

## Conventions

- No new tokens.
- No copy changes; only `variant` prop edits and the Button.jsx variantClasses dict.
- Build must pass.
