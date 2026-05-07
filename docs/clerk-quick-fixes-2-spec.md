# Clerk Quick Fixes Round 2 Spec

**Date**: 2026-05-06
**Status**: Proposed
**For**: Codex implementation
**Scope**: Three small UX fixes.

## Fix 1 — Header `Add Book` quick action opens the modal

**Problem**: The header `Add Book` quick action in `AppShell.jsx` only navigates to `/app/catalogue` and does nothing further. Sean expects it to open the AddBookFlow modal.

### Changes

**`src/components/organisms/AppShell.jsx`** (around line 160):

Change:
```js
{ label: 'Add Book', to: '/app/catalogue', icon: 'solar:add-circle-linear' }
```
to:
```js
{ label: 'Add Book', to: '/app/catalogue?action=add', icon: 'solar:add-circle-linear' }
```

**`src/components/pages/app/ClerkCataloguePage.jsx`**:

Already has `useSearchParams` for the `?q=` seed (per the polish spec). Add a parallel effect:

```jsx
useEffect(() => {
  if (searchParams.get('action') === 'add') {
    setShowAddBook(true);
    // remove the param so re-renders / refreshes don't re-open
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('action');
      return next;
    }, { replace: true });
  }
}, [searchParams, setSearchParams]);
```

Place this near the existing `?q=` handling. Use `react-router-dom`'s `useSearchParams` setter form. Make sure the dependency array doesn't trigger an infinite loop (the param is deleted after one read).

### Acceptance

- Click header `Add Book` from any clerk page → lands on Catalogue with the AddBookFlow modal already open.
- Refresh / back navigation does not re-open the modal (param is consumed).

---

## Fix 2 — Catalogue header button order: `Add Book` last

**Problem**: Currently the four PageHeader actions render as `Add Book → Import CSV → Scan ISBN → Paste ISBNs` (Add Book first/leftmost). Sean wants `Add Book` rightmost.

### Changes

**`src/components/pages/app/ClerkCataloguePage.jsx`** (around lines 244-259):

Reorder the four buttons so the new sequence is:

1. `Import CSV` (secondary)
2. `Scan ISBN` (secondary)
3. `Paste ISBNs` (secondary)
4. `Add Book` (primary)

Keep all other props (variants, icons, onClick handlers) unchanged. Only swap the JSX sibling order.

### Acceptance

- Catalogue PageHeader shows: Import CSV / Scan ISBN / Paste ISBNs / Add Book left-to-right.
- Add Book retains the `primary` variant (the visual lead) but sits at the right edge.

---

## Fix 3 — Chambers tabs need icons

**Problem**: Members | Locations tabs in `ClerkChambersPage` have no icons. SegmentedTabs supports an `icon` prop per item (already used elsewhere). Add icons.

### Changes

**`src/components/pages/app/ClerkChambersPage.jsx`** (line 16-19):

Update the `chamberTabs` const:

```js
const chamberTabs = [
  { key: 'members', label: 'Members', icon: 'solar:users-group-rounded-linear' },
  { key: 'locations', label: 'Locations', icon: 'solar:map-point-linear' },
];
```

Verify both icon names are mapped in `src/components/atoms/Icon.jsx`. If either is unmapped, fall back to:
- Members: `solar:user-circle-linear` (known mapped)
- Locations: `solar:buildings-2-linear` (known mapped, already in use for Chambers sidebar)

### Acceptance

- Chambers page tabs show an icon to the left of each label.
- Icons render correctly (no fallback CircleAlert).

---

## Verification

1. `npm --prefix /Users/seanlee/Desktop/CLMS/clms-app run build` must pass.
2. From any clerk page, click header `Add Book` → modal opens on Catalogue.
3. Catalogue header buttons: Import CSV / Scan ISBN / Paste ISBNs / Add Book in that order.
4. Chambers tabs render with icons.

## Out of scope

- Other quick actions (the search bar is already correct).
- Other pages' tabs.
- Other PageHeader button orderings.
