# Library Scope Alignment Spec — APP-014 Follow-Through

## Context

[APP-014](decisions/app/APP-014-library-scope-single-chambers.md) locked the
product model: **one chambers = one library, multiple shelves & rooms within
that single library**. Cross-chambers borrowing is out of scope. Multi-
building tenants are out of scope.

The current codebase still leaks the rejected multi-building / cross-chambers
mental model into:

1. **Mock data** (`clms-app/src/mocks/books.js`) — book `location` values are
   building names like `Owen Dixon East`, and `floor` values are building-
   floor numbers like `5` or `3`.
2. **UI labels** that render `Floor X` / `Flr X` to the user, implying the
   library spans multiple physical floors.
3. **Onboarding wizard step 2** — title `"Add your library locations"` and
   `LocationRow` placeholder `"Floor / Room"` — both imply
   building/floor scope.
4. **Landing content** — `Cross-Chambers Collaboration` card promises
   "inter-chamber loans" (directly contradicts APP-014), and
   `Multi-Location Management` card mentions "walking across the building".
5. **Clerk Chambers Page** — `ClerkChambersPage.jsx` heuristically groups
   `location.name.includes('East')` into "buildings", which forces a
   two-level building → floor tree that does not exist in the APP-014 model.

This spec consolidates the alignment work so that the app stops implying
multi-building / cross-chambers scope. PRD copy review is **out of scope of
this spec** and will be tracked separately.

## Goal

After this spec lands:

- Mock data reads like one chambers library with multiple rooms / shelves.
- No user-visible UI string says "Floor X" in the building-floor sense.
- Onboarding wizard step 2 collects rooms / shelves, not buildings or floors.
- Landing-page feature cards do not promise cross-chambers borrowing or
  multi-building catalogues.
- `ClerkChambersPage` renders a flat list of rooms / shelves with no
  building-grouping heuristic.

## Non-goals

- **No data-shape changes.** The fields `location` and `floor` on `book`,
  and the `{ name, floor }` shape on chambers `locations[]`, stay as is.
  Only mock *values* and user-visible *labels* change. The field name
  `floor` is now a misnomer (it actually holds a shelf / bay code), but
  renaming the field would ripple into form state, services, and onboarding
  context and is **not** in scope for this pass. Track that as a future
  cleanup if it ever matters.
- **No PRD edits.** Do not touch `PRD-ux-audit.md` or
  `PRD-authority-list-enrichment.md`. PRD review is a separate follow-up.
- **No new components, no design-system token changes.**

## Implementation

All paths below are relative to repo root.

### 1. Mock data — `clms-app/src/mocks/books.js`

Replace every book entry's `location` and `floor` fields. Use **only** the
following four room labels (distribute evenly so the catalogue feels real):

- `Library Room` — main room with most stacks
- `Reading Room` — quiet side room
- `Reception` — books shelved at the clerk desk for quick access
- `Stacks` — overflow / archive shelves

Replace `floor` values with **shelf/bay codes**:

- `Bay A`, `Bay B`, `Bay C`, `Bay D` — for `Library Room` and `Stacks`
- `Shelf 1`, `Shelf 2`, `Shelf 3` — for `Reading Room`
- `Counter` — for `Reception`

Aim for ~50/30/10/10 split across `Library Room` / `Reading Room` /
`Reception` / `Stacks`. Re-distribute existing entries; do not add or remove
books.

### 2. Display labels — drop `Floor` / `Flr` prefix

For each call site, render `{book.location}, {book.floor}` (no prefix
keyword) so the output reads naturally as `Library Room, Bay A`.

Files / lines:

- `clms-app/src/components/molecules/SearchResultCard.jsx:215` —
  current: `{item.location}, Flr {item.floor}` →
  new: `{item.location}, {item.floor}`
- `clms-app/src/components/organisms/BookDetailPanel.jsx:237` —
  current: `{book.location}, Floor {book.floor}` →
  new: `{book.location}, {book.floor}`
- `clms-app/src/components/pages/app/ClerkCataloguePage.jsx:422` and
  `:520` — same change as `BookDetailPanel`.
- `clms-app/src/components/pages/app/SettingsPage.jsx:40-41` —
  current: ``return floor ? `${firstLocation.name.trim()}, Floor ${floor}` : firstLocation.name.trim();``
  new: ``return floor ? `${firstLocation.name.trim()}, ${floor}` : firstLocation.name.trim();``

### 3. Onboarding form labels

- `clms-app/src/components/molecules/LocationRow.jsx:16` —
  placeholder `"Floor / Room"` → `"Shelf / Bay"`.
  Also update the icon if `solar:hashtag-linear` no longer reads right —
  keep it as is unless the change feels jarring; do **not** swap icons in
  this pass without justification.
- `clms-app/src/components/organisms/AddBookFlow.jsx:106` — the form field
  label `['Floor', 'floor']` → `['Shelf / Bay', 'floor']` (the second
  element is the field key and must stay `floor`).
- `clms-app/src/components/pages/WizardPage.jsx:195` — wizard step 2 title
  `"Add your library locations"` → `"Add rooms and shelves in your library"`.
  Also update any subtitle / helper text on the same step that mentions
  "locations" generically; tighten it to "rooms or shelves where books
  live within your chambers library".

### 4. Default mock values for new entries

These currently default to `floor: '3'`, which under the new mental model
reads as a shelf called `'3'` — confusing. Update defaults to a shelf code:

- `clms-app/src/components/organisms/IsbnIntakeModal.jsx:13` —
  `floor: '3'` → `floor: 'Bay A'`.
- `clms-app/src/components/organisms/AddBookFlow.jsx:22` —
  `floor: prefill?.floor || '3'` → `floor: prefill?.floor || 'Bay A'`.
- `clms-app/src/components/organisms/AddBookFlow.jsx:37` —
  `floor: '3'` → `floor: 'Bay A'`.

### 5. Landing-page feature cards — `clms-app/src/mocks/landingContent.js`

There is a feature-card array around lines ~80–125. Make these edits:

- **`id: 'locations'` (Multi-Location Management)** — keep the card but
  reframe the copy. Suggested update:
  - `title: 'Library Layout Awareness'`
  - `description: "One catalogue across every room and shelf. Know
    exactly where each book lives — no doubling back, no duplicate
    orders."`
  - `metricLabel: 'Shelves tracked'` (or keep as `Locations` — Codex's
    call as long as it does not say "across buildings").
  - Drop the phrase "walking across the building".
  - Keep the existing `solar:buildings-linear` icon (it stays evocative
    enough as a generic library icon).

- **`id: 'collaboration'` (Cross-Chambers Collaboration)** — **delete this
  entry entirely** from the array. APP-014 explicitly excludes
  cross-chambers / inter-chamber lending. Removing the card is preferable
  to rewording it — there is no analogous in-scope feature to repurpose
  the slot for. After deletion, confirm the consumer of `landingContent`
  still renders correctly with one fewer card; adjust grid columns or
  layout only if a visual gap appears, otherwise leave the layout to
  reflow naturally.

### 6. Clerk Chambers page refactor — `clms-app/src/components/pages/app/ClerkChambersPage.jsx`

Current behaviour: the page heuristically groups by building using
`location.name.includes('East')`, then renders a building → floor tree.
Under APP-014 there is only one library and the "building" axis does not
exist. Replace the grouping with a flat room list.

Required changes:

- Remove the `building` heuristic and the `groups` / `locationGroups`
  derivation that depends on it.
- Build a single grouping: room name (`location.name`) → list of shelves
  (each `{ floor, bookCount }`).
- Render as a flat list of room cards. Each room card shows the room name
  as the heading and lists its shelves below with book counts (e.g.
  `Bay A · 12 books`). Drop the "Floor X" prefix in shelf rows; the
  `floor` value already reads cleanly under the new mock data.
- Keep the expand/collapse interaction at the room level (replace the
  building expand/collapse with room expand/collapse, same UX).
- Keep the existing icon (`solar:buildings-linear`) — generic enough to
  still read as "library layout" — unless Codex finds a more
  semantically accurate icon already in use elsewhere in the project.
  Do **not** introduce new icons in this pass.
- Update the section heading copy if it currently says "Buildings" or
  similar; new heading should be `Rooms & shelves` or `Library layout`.
  Codex picks the closer fit by reading the surrounding copy.

After the refactor the page must still function: clicking a room expands
to show shelves; book counts are correct; empty-state renders when no
locations exist.

## Out-of-scope cleanups (track separately, do NOT do now)

- Renaming the `floor` field on `book` and on chambers `locations[]` to
  something accurate like `shelf`. Worth doing eventually but ripples into
  context, services, persistence, and form state.
- A second pass on landing copy beyond the two cards listed above (hero
  text, footer, etc.) — Sean to flag specific strings if they need
  rewording.
- PRD copy review (`PRD-ux-audit.md`, `PRD-authority-list-enrichment.md`)
  — separate spec.

## Acceptance criteria

1. `git grep -n "Owen Dixon"` returns no matches inside
   `clms-app/src/mocks/books.js`. (Other files like decisions or memory
   may legitimately reference Owen Dixon as real-world context — leave
   those alone.)
2. `git grep -n "Floor "` and `git grep -n "Flr "` return no user-visible
   string literals in JSX rendering output. (Code identifiers that contain
   the word `floor` may remain.)
3. Wizard step 2 title reads `Add rooms and shelves in your library` (or
   close variant) and the LocationRow placeholder reads `Shelf / Bay`.
4. The "Cross-Chambers Collaboration" card is gone from
   `landingContent.js`. The "Multi-Location Management" card no longer
   mentions buildings.
5. `ClerkChambersPage` renders without the `location.name.includes('East')`
   heuristic. Visiting the page in dev shows a flat list of rooms (Library
   Room / Reading Room / Reception / Stacks) with shelf rows underneath.
6. Adding a book through the AddBookFlow defaults the shelf field to
   `Bay A`, not `3`.
7. `npm run lint` (run from `clms-app/`) does not introduce new errors
   beyond the pre-existing baseline. Do not fix unrelated pre-existing
   lint errors in this pass.
8. The app still builds (`npm run build` in `clms-app/`) without new
   errors.

## Verification steps for Codex to perform after editing

1. `cd clms-app && npm run lint` — expect baseline-only failures.
2. `cd clms-app && npm run build` — expect a clean build.
3. `git grep -n "Owen Dixon" clms-app/src` — expect zero hits in mocks.
4. `git grep -nE "Floor |Flr " clms-app/src/components` — expect zero
   hits inside JSX-rendered text.

Report the final diff summary, any acceptance-criterion failures, and any
unexpected ripple effects (e.g., a component that broke because its prop
shape silently depended on the old mock values).
