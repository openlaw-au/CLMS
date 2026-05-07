# Library + Catalogue Grid 4-cols Cap Spec

**Date**: 2026-05-06
**Status**: Proposed
**For**: Codex implementation
**Why**: Sean wants both barrister Library (BookCard grid) and clerk Catalogue (book card grid) to cap at 4 columns per row max. Currently Library goes up to 5 at very wide viewports, and Catalogue caps at 3.

## Changes

### 1. BarristerLoansPage — cap at 4 (was 5)

`src/components/pages/app/BarristerLoansPage.jsx` line 16:

Currently:
```js
const BOOK_GRID = 'grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 book-grid-wide';
```

Change to:
```js
const BOOK_GRID = 'grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4';
```

Drop the `book-grid-wide` class (it triggers the 5-column override at 1550px+).

### 2. `src/index.css` — clean up the unused override

Around line 252-256:

```css
@media (min-width: 1550px) {
  .book-grid-wide {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
  .toolbar-wide {
    ...
  }
}
```

Remove the `.book-grid-wide` rule. Leave the `.toolbar-wide` rule (different concern — only delete if it's also unused; quickly verify with `rg "toolbar-wide" src` and only delete if zero matches outside the CSS).

### 3. ClerkCataloguePage — cap at 4 (was 3)

`src/components/pages/app/ClerkCataloguePage.jsx`:

- Line 388 (book grid):
  ```js
  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
  ```
  Change to:
  ```js
  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
  ```

  (Bumps to 4 at the `2xl` breakpoint so wide monitors get the extra column without crowding mid-width screens.)

- Line 452 (empty-state spanning the row):
  ```jsx
  <div className="rounded-2xl border border-dashed border-border bg-white p-6 sm:col-span-2 xl:col-span-3">
  ```
  Change to:
  ```jsx
  <div className="rounded-2xl border border-dashed border-border bg-white p-6 sm:col-span-2 xl:col-span-3 2xl:col-span-4">
  ```

- Line 372 (similar grid? — verify; if it's the same book card row, apply the same change. If it's a different content set like queue items, leave alone).

## Verification

1. `npm --prefix /Users/seanlee/Desktop/CLMS/clms-app run build` must pass.
2. Resize Library and Catalogue pages from narrow → ultra-wide; max columns should never exceed 4.
3. Empty state on Catalogue still spans the full row at every breakpoint.

## Out of scope

- Other grids (Authority Lists, Triage Queue, Members table).
- BookCard internal layout.
- Adding/removing breakpoints.
