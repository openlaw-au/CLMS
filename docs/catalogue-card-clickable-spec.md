# Catalogue Card Clickable Spec

**Date**: 2026-05-06
**Status**: Proposed
**For**: Codex implementation
**Why**: The Catalogue card currently has a separate `Open` button. Sean wants the whole card clickable with hover affordance, matching the barrister-side canonical pattern.

## Canonical pattern (reuse target)

`BarristerListsPage.jsx:2581-2589` defines the clickable card pattern used elsewhere on the barrister side:

```jsx
<article
  onClick={() => syncSelectedList(list)}
  className="relative cursor-pointer rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition-all hover:shadow-md hover:ring-black/10"
>
```

Apply this pattern to the Catalogue card.

## Changes

### `src/components/pages/app/ClerkCataloguePage.jsx`

**Card container** (currently around line 383):

```jsx
<article key={book.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
```

Replace with:

```jsx
<article
  key={book.id}
  onClick={() => handleOpenBook(book)}
  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleOpenBook(book); } }}
  role="button"
  tabIndex={0}
  className="cursor-pointer rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition-all hover:shadow-md hover:ring-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
>
```

Notes:
- Keep the existing `rounded-2xl` and `p-4` (Catalogue's existing rhythm) instead of copying `rounded-xl p-5` from the barrister list — the visual rhythm of each list area can stay distinct, only the click/hover behavior is unified.
- Add `transition-all hover:shadow-md hover:ring-black/10` exactly per the canonical pattern.
- `role="button"` + `tabIndex={0}` + `onKeyDown` for keyboard accessibility (Enter / Space → open).
- `focus-visible:ring-2 focus-visible:ring-brand` for keyboard focus visibility.

### Remove the standalone `Open` button

Currently lines ~419-426:

```jsx
<Button
  size="sm"
  variant="secondary"
  onClick={() => handleOpenBook(book)}
>
  <Icon name="solar:eye-linear" size={14} />
  Open
</Button>
```

Delete this block entirely. The whole card is now the open affordance.

### Stop propagation on any inline actions inside the card

Audit the card body: if any other interactive elements remain (action menus, dismiss buttons, status chips that are buttons, etc.), wrap each with:

```jsx
onClick={(e) => { e.stopPropagation(); existingHandler(); }}
```

So the inner click does not bubble up to trigger the card-level open. Same for `onKeyDown` on inner buttons if they handle Enter/Space.

If no inner buttons remain (likely after removing the Open button — only static content like title/author/badges), no action needed.

### Optional: status chips become non-interactive

If any badges/chips on the card had `onClick` for filtering, leave them as buttons but add `e.stopPropagation()`. If they're purely decorative, no change.

## Verification

After change:

1. `npm --prefix /Users/seanlee/Desktop/CLMS/clms-app run build` must pass.
2. Clicking anywhere on a catalogue card opens the detail panel.
3. Hovering raises shadow + darkens ring slightly (matches barrister list cards).
4. Tab to a card → Enter or Space opens the detail panel.
5. The standalone `Open` button is gone.

## Out of scope

- Refactoring inline JSX into a shared `BookCard` component (existing `BookCard.jsx` molecule is barrister-lending UI, different shape — not appropriate to swap in).
- Changing the catalogue card's internal layout (RDA fields, badges, location info) — only the wrapper behavior changes.
- Touching the table view (it was already removed in the slim-down spec).
- Changing barrister cards.

## Conventions

- No new tokens.
- Tailwind scale only.
- No copy changes.
