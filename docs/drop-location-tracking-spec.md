# Drop Location Tracking — Implementation Spec

Implements [APP-015](decisions/app/APP-015-drop-location-tracking.md): remove
shelf/room/floor data and UI from CLMS, leaving only loan status as the
location-related signal. Also adds two reinforcing changes to `BookCard`
that Sean asked for in the same conversation: a category tag under the
author, and a consistent due-date row whenever a book is on loan.

This spec replaces the work that
[`library-scope-alignment-spec.md`](library-scope-alignment-spec.md) just
shipped. That earlier alignment kept the data shape and only renamed
mock values; APP-015 supersedes it by removing the data altogether. Where
this spec contradicts the earlier one, this spec wins.

## Scope at a glance

1. **Data model** — drop `book.location`, `book.floor`,
   `chambers.locations[]`, and onboarding step 2.
2. **Forms** — `AddBookFlow`, `IsbnIntakeModal` stop collecting location.
3. **Display** — every book-card / search-result / detail surface stops
   rendering location; `BookCard` gains a category tag and a consistent
   due-date row.
4. **Pages** — `ClerkChambersPage` Locations tab removed.
   `SettingsPage` reminder copy detaches from location.
5. **Mock content** — landing card and hero/auth panel mock strings
   updated.

## Files to change

Paths are relative to repo root. Each file lists the change and the
specific lines / regions to edit. **Codex must read each file before
editing** — line numbers below are advisory and may have shifted.

### A. Data shape

#### `clms-app/src/mocks/books.js`
- For every book entry, **delete** the `location` and `floor` keys.
  Keep all other fields (`id`, `title`, `author`, `edition`,
  `publisher`, `isbn`, `status`, `practiceArea`, `jurisdiction`,
  `borrower`, `dueDate`, `jadeAvailable`, `enrichment`).

#### `clms-app/src/context/AppContext.jsx`
- The onboarding initial state currently includes
  `locations: [{ name: '', floor: '' }]`. Remove that key entirely.
  Anywhere the context exposes setters / updaters for `locations`,
  remove them too.

#### `clms-app/src/components/pages/SignUpPage.jsx`
- Around line 40, the onboarding seed includes
  `locations: [{ name: '', floor: '' }]`. Remove that key.

#### `clms-app/src/components/pages/WizardPage.jsx`
- The wizard currently renders 4 steps. **Remove step 2**
  (Locations). The wizard becomes a 3-step flow.
- Delete the handlers `addLocation`, `updateLocation`,
  `removeLocation`, the `validLocations` derivation, and
  `isStep2Valid`.
- Renumber subsequent steps (`step={3}` → `step={2}`,
  `step={4}` → `step={3}`); update the `total={4}` props on the
  surviving `<WizardStep>` instances to `total={3}`.
- Drop the `LocationRow` import.
- The setter that adds a new location to context (`updateOnboarding`
  call with `locations: [...]`) goes away.

#### `clms-app/src/components/molecules/LocationRow.jsx`
- **Delete the file.** Confirm no other component imports it.

### B. Forms / intake

#### `clms-app/src/components/organisms/AddBookFlow.jsx`
- Remove the `location` and `floor` fields from the local form state
  initial value (around lines 22 and 37 — both the `useState` seed and
  the post-submit reset).
- Remove the corresponding form rows from the JSX (the spec earlier
  pointed at `['Floor', 'floor']` and a sibling `['Location',
  'location']` pair around line 106). Drop the entire row(s) for
  location and floor.
- Remove any `prefill?.location`, `prefill?.floor` handling.
- The submit payload should no longer include those fields.

#### `clms-app/src/components/organisms/IsbnIntakeModal.jsx`
- Remove the `floor: '...'` (and any `location: '...'`) from the
  initial form state (around line 13). Remove the corresponding
  inputs from the JSX, if any.

### C. Display surfaces — drop location, keep status

#### `clms-app/src/components/molecules/SearchResultCard.jsx`
- Around line 215, the chip row renders
  `{item.location}, Flr {item.floor}`. Remove that entire chip span.
  Keep the existing `Book` and JADE category chips. The
  `enrichment.subject` / `practiceArea` chip already exists below it
  — keep it.

#### `clms-app/src/components/organisms/BookDetailPanel.jsx`
- Around line 237, the panel renders
  `{book.location}, Floor {book.floor}`. Remove the row that hosts
  this string (icon + span + container). If the surrounding label
  ("Location" or similar) is left orphaned, remove that too.

#### `clms-app/src/components/pages/app/ClerkCataloguePage.jsx`
- Lines 422 and 520 both render `{book.location}, Floor {book.floor}`.
  Remove those entire rows / cells. If a column header above (e.g.
  "Location") is left empty, drop the header and adjust column widths
  if the layout requires it.

#### `clms-app/src/components/pages/app/SettingsPage.jsx`
- Delete `getReminderLocation` (around lines 33–42) entirely.
- Find every caller of `getReminderLocation(...)` and replace the
  produced string with a generic phrase that does not mention rooms
  or shelves. Recommended replacement: `'the chambers library'`. So
  for example, `Send overdue reminder linking to ${getReminderLocation(onboarding)}`
  becomes
  `Send overdue reminder linking to the chambers library`.

### D. `BookCard` — drop location, add category tag, consistent due-date row

`clms-app/src/components/molecules/BookCard.jsx` is the most surgical
change. Reshape the meta block as follows:

1. **Drop the location row** (`<Icon name="solar:map-point-linear" ...>`
   and the trailing `<span>{book.location}</span>`, around lines 41–44).
2. **Drop the practiceArea row** (`<Icon name="solar:tag-linear" ...>`
   row, around lines 45–48). This row currently shows
   `book.practiceArea`. We are moving the category up into the
   tag row beside the publisher / edition pills.
3. **Add a category tag** to the publisher tag row (around lines
   28–37). The new tag should sit alongside the publisher and edition
   pills. Source the value as
   `book.enrichment?.subject || book.practiceArea`. Style it with
   `rounded-md bg-info/10 px-2 py-0.5 text-[11px] font-medium text-info`.
   Render only when the value is truthy.
4. **Keep the due-date row** (around lines 49–54). The current
   conditional already renders for any `onLoan && book.dueDate` and
   styles overdue red, non-overdue muted. **Verify this still
   functions** after the surrounding rows are removed and the row
   visually anchors the bottom of the meta block. The row should
   appear in **both** overdue and non-overdue loan states — Codex
   must confirm this with the existing state matrix in
   `BookCard.stories.jsx` (Overdue, OnLoan, etc.).
5. The meta block container that previously wrapped location +
   practiceArea + due-date can collapse to just the due-date row
   (or be removed entirely if due-date is the only child and the
   wrapper adds no styling value). Use judgment — keep the layout
   visually clean.

After this change `BookCard` shows: title row, author row, tag row
(publisher + edition + category), and (when on loan) a due-date row.
No location anywhere.

### E. `ClerkChambersPage` simplification

`clms-app/src/components/pages/app/ClerkChambersPage.jsx`:

- Drop the `chamberTabs` array's `'locations'` entry. With only
  `'members'` left, decide:
  - If only one tab remains, **remove the `<SegmentedTabs>`
    altogether** and render the Members section directly. Drop the
    related state (`tab`, `setTab`, `initialTab`, `routeTab`,
    `queryTab`, the `useEffect` that syncs tab from route, the route
    parsing).
  - The page subtitle currently reads "Manage people and your
    chambers library layout in one place." — change to
    "Manage people in your chambers."
- Remove `buildRoomGroups` (the function and its imports / usages).
- Remove `roomGroups`, `expandedRooms`, `toggleExpand`,
  `configuredLocations`.
- Remove the entire `tab === 'members' ? (...) : (...)` ternary;
  keep only the Members JSX as the page body.
- Remove the unused `<Icon name="solar:buildings-linear">` from the
  removed Locations panel and any imports that become unused
  (`useMemo` if no longer used, `useSearchParams` / `useParams` if
  the route parsing is gone).
- If the route file (`clms-app/src/routes/...`) registers
  `/chambers/locations`, remove that path. If it shares a single
  parameterised route, leave the route in place but the page will
  ignore the parameter.

### F. Mocks for marketing surfaces

#### `clms-app/src/mocks/landingContent.js`
- Remove the `id: 'locations'` entry (the "Library Layout Awareness"
  card introduced in the previous spec). The promise it makes is no
  longer real. Adjust the array length consumer if a fixed grid
  expects 4 cards — let the layout reflow naturally if possible.

#### `clms-app/src/components/molecules/HeroMockup.jsx`
- Find the mock search-result strings that include `Library Room, Bay A`
  or `Flr X`. Replace with a status-style chip such as `Available` or
  `On loan to Sarah Chen, due 28 Mar`. The aim is to demo loan-status
  awareness, not shelf awareness.

#### `clms-app/src/components/organisms/AuthValuePanel.jsx`
- Same treatment — replace the mock `Library Room, Bay A` string with
  a status / due-date string.

### G. Cross-file cleanups (catch any leftovers)

After the above edits, run these greps and remove or update any
remaining hits inside `clms-app/src/`:

- `git grep -nE "book\.location|book\.floor"` → expected zero in
  `clms-app/src/components/`.
- `git grep -n "onboarding.locations"` → expected zero.
- `git grep -n "configuredLocations"` → expected zero.
- `git grep -n "LocationRow"` → expected zero (file deleted).
- `git grep -nE "Library Room|Reading Room|Reception|Stacks"` →
  expected zero in user-rendered strings; mocks/stories may still
  legitimately reference these as test data, but UI components must
  not.

If any hit remains, decide between (a) deleting the dead reference
or (b) collapsing the surrounding logic. Do not leave commented-out
code.

## Acceptance criteria

1. The four greps in section G return zero hits in
   `clms-app/src/components/`.
2. `cd clms-app && npm run build` is clean.
3. `cd clms-app && npm run lint` introduces no new errors beyond the
   existing baseline. Do not fix unrelated lint debt.
4. The onboarding wizard runs end-to-end in 3 steps. After completing
   it the user lands on the dashboard without errors.
5. The Add Book flow submits without a location field; the new book
   appears in the catalogue with no location row.
6. `BookCard` renders title, author, tag row (publisher + edition +
   category), and a due-date row only when on loan. The Storybook
   stories `Available`, `OnLoan`, `Overdue`, `Borrowed`, `Pending`,
   `ReturnRequested` (whichever exist) all render correctly.
7. `ClerkChambersPage` shows the Members management surface with
   no Locations tab and no segmented-tabs control.
8. `SettingsPage` reminder copy no longer mentions room or shelf.
9. Landing page and hero / auth panel mocks no longer mention shelf
   labels.

## Verification steps for Codex to perform

1. Run `cd clms-app && npm run build` — must succeed.
2. Run `cd clms-app && npm run lint` — must not introduce new errors.
3. Run the four greps in section G — paste results in the report.
4. Read `BookCard.stories.jsx` and confirm each story still props in
   ways the new `BookCard` accepts. If any story passes a `location`
   field that is now unused, leave it (harmless prop) or clean it.
5. In the report, list each file touched, one line of summary per
   file. Flag any file where Codex made a judgment call that the
   spec did not pin down (e.g. how the marketing mocks were rephrased).

## Out of scope

- PRD copy updates (`PRD-ux-audit.md`, `PRD-authority-list-enrichment.md`).
- Re-styling the existing status badges.
- Replacing the deleted "Library Layout Awareness" landing card with a
  new feature card. If the grid looks short, that is fine — Sean will
  decide a replacement separately.
