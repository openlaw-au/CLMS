# Global Add Book Modal + Multi-Method Entry Spec

## Context

Two related issues:

1. The clerk header's **Add Book** quick action navigates to
   `/app/library?action=add`. This forces a page jump even if the
   clerk wants to add a book from another surface (dashboard,
   settings, anywhere). Sean wants the action to open a **global
   modal in place** without navigation.
2. The current `AddBookFlow` modal only supports **ISBN lookup**. The
   onboarding flow already has a working barcode scanner
   (`ScanPage.jsx`, Html5Qrcode-based) and the clerk should be able
   to use Scan or Manual entry too — not just ISBN.

## Goal

After this spec lands:

- Clicking the header `+ Add Book` action opens the AddBookFlow
  modal directly on whatever page the user is on. No navigation.
- The modal lets the clerk pick **one of three methods** to add a
  book: **ISBN**, **Scan**, **Manual**.
- A book added through any of those methods lands in the catalogue
  and the Library page (if open) refreshes.

## Implementation

### 1. AppShell — global Add Book modal

`clms-app/src/components/organisms/AppShell.jsx`

- Add local state: `const [showAddBook, setShowAddBook] = useState(false);`.
- Replace the `Add Book` quick action's `to: '/app/library?action=add'`
  with an `onClick` handler that calls `setShowAddBook(true)`. The
  quick action item becomes a button (not a link). Keep the same
  icon and label so the visual is identical.
- At the bottom of `AppShell` (alongside other modals it might
  already host), render:

  ```jsx
  {showAddBook && (
    <AddBookFlow
      onClose={() => setShowAddBook(false)}
      onAdded={() => {
        setShowAddBook(false);
        window.dispatchEvent(new CustomEvent('books-changed'));
      }}
    />
  )}
  ```

- `'books-changed'` is a lightweight cross-page signal. The Library
  page can listen for it and refresh.

### 2. Library page — listen for `books-changed`

`clms-app/src/components/pages/app/ClerkLibraryPage.jsx`

Add an effect that subscribes to `books-changed` and triggers
`refreshBooks()`:

```js
useEffect(() => {
  const handler = () => { refreshBooks(); };
  window.addEventListener('books-changed', handler);
  return () => window.removeEventListener('books-changed', handler);
}, []);
```

Keep the existing `?action=add` handling intact — it's still used
when the dashboard triage links a queue entry to the library page.

`clms-app/src/components/pages/app/BarristerLoansPage.jsx`

Same listener pattern, calling its own `getBooks` refresh function.
Barristers shouldn't see Add Book in the header (it's a clerk
action), but if they ever do (or via dev panel), the catalogue
should still refresh consistently.

### 3. AddBookFlow — three entry methods

`clms-app/src/components/organisms/AddBookFlow.jsx`

Restructure into a method-selector + per-method body. Suggested
state:

```js
const [method, setMethod] = useState(prefill ? 'isbn' : null);
```

When `method === null`, render a method-picker step:

```jsx
<div className="grid grid-cols-3 gap-2">
  <MethodCard icon="solar:document-text-linear" label="ISBN" desc="Look up by ISBN" onClick={() => setMethod('isbn')} />
  <MethodCard icon="solar:qr-code-linear" label="Scan" desc="Use phone or webcam barcode scanner" onClick={() => setMethod('scan')} />
  <MethodCard icon="solar:pen-linear" label="Manual" desc="Type the details" onClick={() => setMethod('manual')} />
</div>
```

`MethodCard` is a local presentational component — a button with
icon + label + small subtext, slate hover, brand-tinted active.
Inline; do not create a new shared atom.

Once `method` is selected, render that method's body. A small
"Change method" link (top-right of the modal) lets the user go back
to the picker.

#### `method === 'isbn'`

The current ISBN lookup form. Unchanged behaviour.

#### `method === 'scan'`

Embed the existing scanner from `ScanPage.jsx`. ScanPage handles a
multi-book session, which is too heavy for a single-book add flow
— extract just the scanner core:

- Reuse `Html5Qrcode` initialization with the same supported formats
  list `ScanPage` uses.
- Render the camera preview region inside the modal (`READER_ID`
  unique to the modal, e.g. `addbook-barcode-reader`).
- On a successful decode (`onSuccess(decoded)` callback), put the
  decoded ISBN into the `isbn` state of the AddBookFlow and switch
  to the ISBN flow's lookup step automatically (i.e. call the
  existing `handleLookup`). The user reviews / edits / saves the
  resulting form.
- If the device does not have a camera (Html5Qrcode init fails),
  show a friendly fallback message: "Camera unavailable — use ISBN
  or Manual entry instead." with shortcut buttons that call
  `setMethod('isbn')` / `setMethod('manual')`.

Codex should keep this scanner block tight (≤80 lines) and add a
`// TODO(api):` for the real-world phone-pair flow if it diverges
from a direct webcam scan.

#### `method === 'manual'`

Skip the ISBN lookup step entirely. Render the same metadata form
the ISBN lookup currently shows post-lookup (`title`, `author`,
`edition`, `publisher`), plus an optional `isbn` input. Save calls
`addBook(...)` directly with the typed values.

#### Save behaviour (all methods)

The existing `handleSave` already calls `addBook` and triggers the
toast + `onAdded` callback. Keep it. The new `onAdded` set in
AppShell will dispatch `books-changed`.

### 4. Quick action layout

The clerk-side quick action is currently the only `Add Book` entry
point in the header. Sean did not ask to add Add Book elsewhere, so
no other surfaces change.

If `ClerkDashboardPage`'s triage queue still passes
`?action=add&queueId=...` (it does — it's how an uncatalogued queue
entry pre-fills the form), keep that path. The Library page's
existing `useEffect` that watches `searchParams.get('action') ===
'add'` continues to open `AddBookFlow` with the queue prefill. So
two entry points coexist:

- AppShell global modal (no prefill).
- Library page query-param modal (queue prefill).

Both call the same `AddBookFlow` component and dispatch the same
`books-changed` event on save.

## Acceptance criteria

1. Clicking the clerk header's `+ Add Book` opens the AddBookFlow
   modal **on the current page**. No navigation. The URL stays
   wherever the user was.
2. The modal opens on a method picker (ISBN / Scan / Manual) when
   no prefill is passed. With a prefill (queue entry) it skips the
   picker and goes straight to the ISBN flow with the prefilled
   data.
3. Selecting **ISBN** shows the existing ISBN lookup form. Selecting
   **Manual** shows the metadata form directly without ISBN
   lookup. Selecting **Scan** opens a live camera barcode reader
   that, on a successful decode, hands the ISBN to the lookup step.
4. Saving via any method calls `addBook(...)` and dispatches a
   `books-changed` window event.
5. `ClerkLibraryPage` (and `BarristerLoansPage`) listen for
   `books-changed` and refresh the book list without a manual
   reload.
6. The triage queue's `?action=add&queueId=...` deep link still
   opens AddBookFlow with the queue prefill (no regression).
7. `npm run build` clean. `npx eslint` on touched files clean.

## Out of scope

- Changing the catalogue model (no new columns, no JADE auto-link).
- Phone-pair scanning UX (multi-device sync). The Scan method uses
  the device's own camera. Cross-device pairing was a separate
  onboarding workflow and stays as is in `ScanPage`.
- Bulk add (CSV import is already a separate flow in
  `CsvImportFlow.jsx`).
- Adding Add Book to non-clerk roles. Barristers don't add books.

## Verification steps

1. `cd clms-app && npm run build`.
2. `npx eslint` on `AppShell.jsx`, `ClerkLibraryPage.jsx`,
   `BarristerLoansPage.jsx`, `AddBookFlow.jsx`.
3. Manually verify: header Add Book → method picker → each method
   reaches Save → toast appears → Library page (if visible) shows
   the new book.
