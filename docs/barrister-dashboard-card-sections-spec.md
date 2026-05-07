# Barrister Dashboard — Card Sections Spec

## Context

`BarristerDashboardPage` currently has two bottom sections rendered as
thin row buttons:

1. **Recent Authority Lists** (left card)
2. **Alerts** (right card)

Sean's direction: make each item a card (like the clerk dashboard's
triage queue uses `BookCard`), and **reuse the actual list card
that already exists in `BarristerListsPage`** for the Recent
Authority Lists section.

## Goal

After this spec lands:

- Each Recent Authority Lists item renders as the **same card
  component** used on the Authority Lists page itself — extracted
  into a shared molecule (`AuthorityListCard.jsx`).
- Each Alerts item renders as a card with primary actionable info
  + a small action (matching the clerk triage queue's visual
  weight).
- Both sections use a card grid layout instead of stacked thin
  rows.

## Implementation

### 1. Extract `AuthorityListCard` molecule

Create `clms-app/src/components/molecules/AuthorityListCard.jsx`
by lifting the list-card markup currently inside
`BarristerListsPage.jsx` (around lines ~2580–2680 of that file —
the `lists.map((list) => { ... <article ...> ... }` block).

Component shape:

```jsx
export default function AuthorityListCard({
  list,
  onClick,
  selected = false,
  selectable = false,
  onMenuOpen,
  menuOpen = false,
  onDuplicate,
  onDelete,
  compact = false,
})
```

- `list`: the authority-list record.
- `onClick`: top-level card click (open the list).
- `selected`/`selectable`: keep the existing select-mode UX so the
  Authority Lists page can keep using it as is.
- `onMenuOpen`/`menuOpen`/`onDuplicate`/`onDelete`: keep the existing
  three-dot menu logic.
- `compact`: when true, render a smaller variant for the dashboard
  context — suggested differences: `p-4` instead of `p-5`, hide the
  three-dot menu, hide the court label and issues row, keep
  title + caseRef + the type-count tag row.

Update `BarristerListsPage.jsx` to import the new molecule and
replace the inline `<article>` block with `<AuthorityListCard ... />`.
Wire all the existing handlers through the new props. The visual
result on the Authority Lists page must be **identical** to today.

### 2. Replace Recent Authority Lists section in dashboard

`clms-app/src/components/pages/app/BarristerDashboardPage.jsx`

The `Recent Authority Lists` section currently renders a thin
`<button>` row per list (around lines ~178–214). Replace the loop
with a card grid:

```jsx
<div className="mt-3 grid gap-3 sm:grid-cols-2">
  {sortedLists.slice(0, 4).map((list) => (
    <AuthorityListCard
      key={list.id}
      list={list}
      compact
      onClick={() => navigate(`/app/authorities?listId=${list.id}`)}
    />
  ))}
</div>
```

Show 4 cards (2×2) at most. Keep the `View all` button at the
section header.

### 3. Replace Alerts section in dashboard

The `Alerts` section currently renders thin red row buttons. Replace
with a card grid where each alert is a small actionable card.

A new lightweight component is fine — reusing `BookCard` would force
mismatched data shape. Options:

**Option A (preferred)**: small inline card markup right inside
`BarristerDashboardPage.jsx` — no new molecule. Each alert card:

```jsx
<button
  type="button"
  onClick={() => navigate(alert.to)}
  className="flex flex-col items-start gap-2 rounded-2xl border border-red-200/70 bg-red-50/40 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-red-300 hover:shadow-sm"
>
  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100">
    <Icon name={alert.icon} size={16} className="text-red-600" />
  </span>
  <p className="text-sm font-medium text-text">{alert.message}</p>
  <p className="text-2xs uppercase tracking-[0.14em] text-red-600">
    {alert.kind || 'Action needed'}
  </p>
</button>
```

(Where `alert.kind` is a short type label like `Pinpoints` /
`Citations` / `On loan`. Codex picks sensible labels off the existing
alert objects' shape.)

Render in a `grid gap-3 sm:grid-cols-2` like the lists section. Keep
the dismiss-X button if Sean wants — for now drop it; the card is
clickable and opens the relevant list. (Track dismiss as follow-up
if Sean asks.)

**Option B**: introduce a generic `AlertCard` molecule. **Skip for
now** — no other surface needs it.

### 4. Layout rebalancing

The two sections were a `md:grid-cols-2` 2-column layout. Keep that.
The right (Alerts) card had absolute positioning to pin to the left
card's height — drop that absolute pinning since both sides now use
fluid card grids that grow naturally. Use a normal flow:

```jsx
<div className="mt-12 grid gap-4 md:grid-cols-2">
  <section>{/* Recent Authority Lists */}</section>
  <section>{/* Alerts */}</section>
</div>
```

If one section has more content than the other, that's fine — they
no longer need equal heights.

## Acceptance criteria

1. New file
   `clms-app/src/components/molecules/AuthorityListCard.jsx` exists
   and exports the lifted card component.
2. `BarristerListsPage`'s 3-column grid still looks identical (uses
   the new molecule).
3. `BarristerDashboardPage`'s Recent Authority Lists section is a
   `2×2` grid of compact `AuthorityListCard` cards (or fewer if
   fewer lists exist), no thin row buttons.
4. `BarristerDashboardPage`'s Alerts section is a `2-column` grid
   of small red-tinted action cards, no thin row buttons. Clicking
   a card navigates to the relevant list/page.
5. Empty states: `No lists yet. Create one to get started.` and
   `No active alerts. You're all clear.` still render when each
   array is empty.
6. `npm run build` clean. `npx eslint` on touched files clean.

## Out of scope

- New variants of `AuthorityListCard` beyond `compact`.
- Drag-to-reorder alerts.
- Pagination (4-card cap is enough for the dashboard).
- Re-introducing the dismiss button on alert cards.
