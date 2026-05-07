# Barrister Dashboard — Stacked Sections (Match Clerk Dashboard) Spec

## Context

Previous spec built the BarristerDashboard bottom area as a 2-column
50/50 layout (`md:grid-cols-2`). Sean rejected — it should match
**ClerkDashboardPage's structure**: stacked full-width sections, each
in its own white card wrapper, with a wide card grid inside.

`AuthorityListCard.jsx` extraction is **done** and stays. This spec
only restructures `BarristerDashboardPage.jsx`.

## Reference: ClerkDashboardPage layout

```
<Hero />
<MetricGrid />

<section className="mt-12 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
  {/* Header: title only */}
  {/* Body: BookCard grid using BOOK_GRID = 'grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4' */}
</section>

<section className="mt-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
  {/* Library Health */}
</section>
```

Each section is **full-width**, stacked vertically. No 2-column
layout. The card grid inside each section uses the same `BOOK_GRID`
pattern (4 cards per row at md+).

## Implementation

`clms-app/src/components/pages/app/BarristerDashboardPage.jsx`

### Layout change

Replace the current `<div className="mt-12 grid gap-4 md:grid-cols-2">`
wrapper with two sequential `<section>` blocks, each full-width:

```jsx
{/* Recent Authority Lists section */}
<section className="mt-12 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
  <ContentLoader ...>
    <div className="flex min-h-[36px] items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon name="solar:list-check-linear" size={22} className="text-brand" />
        <h2 className="font-serif text-section-title text-text">Recent Authority Lists</h2>
      </div>
      {/* View all / Create button — same as today */}
    </div>

    {lists.length > 0 ? (
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {sortedLists.slice(0, 4).map((list) => (
          <AuthorityListCard
            key={list.id}
            list={list}
            compact
            onClick={() => navigate(`/app/authorities?listId=${list.id}`)}
          />
        ))}
      </div>
    ) : (
      <p className="mt-3 text-xs text-text-muted">No lists yet. Create one to get started.</p>
    )}
  </ContentLoader>
</section>

{/* Alerts section */}
<section className="mt-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
  <ContentLoader ...>
    <div className="flex min-h-[36px] items-center gap-2">
      <Icon name="solar:danger-triangle-linear" size={22} className="text-red-600" />
      <h2 className="font-serif text-section-title text-text">
        Alerts{visibleAlerts.length > 0 ? ` (${visibleAlerts.length})` : ''}
      </h2>
    </div>

    {visibleAlerts.length > 0 ? (
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {visibleAlerts.map((alert) => (
          <button
            key={alert.id}
            type="button"
            onClick={() => navigate(alert.to)}
            className="flex flex-col items-start gap-2 rounded-2xl border border-red-200/70 bg-red-50/40 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-red-300 hover:shadow-sm"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100">
              <Icon name={alert.icon} size={16} className="text-red-600" />
            </span>
            <p className="text-sm font-medium text-text">{alert.message}</p>
          </button>
        ))}
      </div>
    ) : (
      <p className="mt-3 text-xs text-text-muted">No active alerts. You're all clear.</p>
    )}
  </ContentLoader>
</section>
```

### Notes

- Drop the absolute-positioned right column entirely.
- The `View all` / `Create` button on Recent Authority Lists header
  stays (right-aligned via `justify-between`).
- Skeletons inside each `ContentLoader` should be card-shaped
  placeholders that match the 4-col grid (4 skeleton cards), not
  thin rows. Use the same min-height as `AuthorityListCard` /
  alert card.
- Any 2-column grid (`md:grid-cols-2` / `sm:grid-cols-2`) inside
  these sections must be replaced with the 4-col pattern matching
  clerk: `grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4`.

### What stays

- Hero (`DashboardHero`) and `MetricGrid` block above — unchanged.
- `AuthorityListCard` molecule — unchanged.
- `lists`/`visibleAlerts` data and `dashboardMetrics` array — unchanged.

## Acceptance criteria

1. Barrister dashboard's Recent Authority Lists and Alerts sections
   are **full-width stacked**, each in its own white-card wrapper.
   No 2-column 50/50 layout.
2. Each section's body is a 4-column responsive card grid (matching
   clerk dashboard).
3. AuthorityListCard remains the rendering for list items.
4. Alert items render as small red-tinted action cards.
5. `npm run build` clean. `npx eslint` on the touched file clean.

## Out of scope

- New variants of `AuthorityListCard`.
- Re-introducing the alert dismiss X.
- Changing `MetricGrid` above.
