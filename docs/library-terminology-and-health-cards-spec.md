# Terminology Sweep + Library Health Cards Spec

## Two changes bundled

1. **Terminology**: drop user-facing "Catalogue" / "catalogue" wording.
   The clerk no longer has a separate Catalogue page — everything is
   the **Library**. The word should follow.
2. **Library Health metric cards**: the three "Missing X" cards on the
   dashboard currently render as a tight little chip strip. Bump them
   up to feel like the main metric tiles (same layout idea, larger
   fonts, larger icon swatch), but **without** the gradient/backdrop
   styling.

## Implementation

### 1. Terminology sweep — user-facing strings only

Replace user-visible "Catalogue/catalogue" with "Library/library" in
the following files. Keep code identifiers, service names, function
names, CSS class names, route slugs, and comments untouched.

| File | Locations | Change |
|---|---|---|
| `clms-app/src/components/pages/app/ClerkDashboardPage.jsx` | `Books in Catalogue` (~107), `Catalogue Coverage` (~131), `Catalogue Health` section header (~281) | → `Books in Library`, `Library Coverage`, `Library Health` |
| `clms-app/src/components/organisms/AddBookFlow.jsx` | toast `... added to catalogue` (~215); body `... add this title to the catalogue.` (~224); button `Save to Catalogue` (~272 and ~316); subtitle `... starting point for this catalogue entry.` (~342) | → `... added to library`; `... add this title to the library.`; `Save to Library`; `... starting point for this library entry.` |
| `clms-app/src/components/organisms/IsbnIntakeModal.jsx` | toast `Added X books to catalogue` (~61); button `Add X books to catalogue` (~117) | → `... to library` |
| `clms-app/src/components/organisms/CsvImportFlow.jsx` | `You can manage them in the Catalogue later.` (~165) | → `You can manage them in the Library later.` |
| `clms-app/src/components/pages/SetupLoadingPage.jsx` | step label `Importing catalogue...` (~9) | → `Importing library...` |
| `clms-app/src/components/organisms/AuthValuePanel.jsx` | mock URL `clms.app/catalogue` (~81); mock tab label `'Catalogue'` (~88) | → `clms.app/library`; `'Library'` |
| `clms-app/src/components/organisms/FooterSection.jsx` | `Catalogue and track every book.` (~13) | → reword to `Track every book in your library.` (or similar — Codex picks an idiomatic rewrite without the verb "catalogue") |
| `clms-app/src/components/organisms/AppShell.jsx` | `Join chambers for shared catalogue and loans.` (~420) | → `Join chambers for a shared library and loans.` |
| `clms-app/src/mocks/authContent.js` | several lines: `Manage catalogue quality...`, `Catalogue control`, `catalogue health`, `build the catalogue faster` | rewrite using "Library" / "library" verbatim where it reads well; e.g. `Manage library quality...`, `Library control`, `library health`, `build the library faster` |

**Do not change:**

- `booksService.js` JSDoc comments mentioning "catalogue" — internal.
- `uncataloguedQueueService.js` and `uncataloguedQueueMock` — the
  queue's domain term ("uncatalogued queue") is still meaningful as an
  internal concept. The user-facing label for the queue can be
  reviewed separately if needed.
- `markAddedToCatalogue` function name, `catalogueTarget` state
  variable, `uncatalogued` boolean field on items, `catalogue-toast-in-out`
  CSS keyframe, `mockup-catalogue-toast` CSS class — internal.
- Route alias entries `catalogue: 'library'` in `AppPage.jsx` and
  `AppShell.jsx` — backward compat for old links.

### 2. Library Health cards — bump the layout

`clms-app/src/components/pages/app/ClerkDashboardPage.jsx`

Find the three-card grid block around lines ~302–321 (Missing subject /
Missing jurisdiction / Missing resource type). Replace the per-card
markup with a layout that follows the **MetricCard** pattern:

```jsx
<button
  key={gap.label}
  type="button"
  onClick={() => navigate('/app/library')}
  className="rounded-2xl border border-border/70 bg-white p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/20"
>
  <div className="flex items-center justify-between gap-3">
    <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${gap.count > 0 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
      <Icon name={gap.icon} size={18} />
    </span>
    <p className="text-2xl font-bold leading-none tracking-tight text-text">
      {gap.count}
    </p>
  </div>
  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
    {gap.label}
  </p>
</button>
```

Key differences from the current cards:

- `p-5` (instead of `px-3 py-2.5`) — bigger touch target / breathing
  room.
- Icon swatch becomes a tinted square `h-11 w-11 rounded-2xl` with the
  icon size bumped to 18 px (matches `MetricCard`).
- Count rendered as `text-2xl font-bold` on the right side, matching
  `MetricCard`'s right-aligned value.
- Label below the row, `text-xs font-semibold uppercase
  tracking-[0.16em]` — same treatment as `MetricCard` labels.
- Hover state lifts the card and adds a brand-tinted border, mirroring
  `MetricCard`'s interactive feel **without** the gradient/backdrop
  fanciness Sean explicitly excluded.
- Grid: keep `sm:grid-cols-3` but bump the gap to `gap-3` so the
  bigger cards breathe.

The progress-bar block above the three cards (the
`{enrichedCount} of {books.length} books enriched ...` block) stays as
is — Sean did not ask to change it.

### 3. Skeleton update

The skeleton placeholders for these three cards (around line ~272) use
`h-14`. Bump to `h-24` so the skeleton matches the new card height.

## Acceptance criteria

1. The clerk dashboard shows `Library Health` (not `Catalogue
   Health`), `Library Coverage`, and `Books in Library`. No other
   metric labels regress.
2. The three "Missing X" cards visually match the main MetricGrid
   tiles in scale and typography (icon swatch, big count, uppercase
   tracked label) but without the gradient / backdrop blur.
3. `git grep -nE "[Cc]atalogue" clms-app/src` returns hits only in:
   - JSDoc / TODO comments.
   - service / function / variable / CSS identifiers
     (`uncataloguedQueueService`, `markAddedToCatalogue`,
     `catalogueTarget`, `uncatalogued`, `catalogue-toast-in-out`,
     `mockup-catalogue-toast`).
   - the `catalogue: 'library'` alias entries in `AppPage.jsx` and
     `AppShell.jsx`.
4. `npm run build` clean. `npx eslint` on touched files clean.

## Out of scope

- Renaming the uncatalogued queue to something else. The user-facing
  surface for the queue is the dashboard triage, which already says
  `Catalogue` per item button — keep an eye on this in a follow-up
  spec if Sean wants to rename it.
- Restyling the progress-bar block above the three cards.
- Replacing internal identifiers (`markAddedToCatalogue`,
  `uncataloguedQueueService`, etc.).
