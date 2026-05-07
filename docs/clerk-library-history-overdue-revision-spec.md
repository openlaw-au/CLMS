# Clerk Library — History Table + Overdue 50/50 More Button (Revision)

**Status**: Revision following Sean's design feedback on the previous
implementation.

## Why this revision

Two pieces of the previous spec landed wrong in practice:

1. **History tab as `LoanCard` list** — padding broke, layout looked
   off, accumulating loan rows read better as a dense table.
2. **Overdue card using `Mark Returned + ⋮ kebab`** — the kebab felt
   misaligned and visually awkward next to the wide primary button.

This spec replaces both treatments with simpler patterns.

## Implementation

### 1. History tab → simple HTML table

`clms-app/src/components/pages/app/ClerkLibraryPage.jsx`

Replace the current `LoanCard` divided list on the History tab with a
plain semantic HTML table. No icons. The status indicator is a
color-coded inline text (no pill, no badge component) sitting in the
subtext under the title.

Columns:

| Column | Source | Notes |
|---|---|---|
| Title | `loan.bookTitle` | font-medium text-text. Below it, a small subtext line: `{borrower} · {status}` where `{status}` is `Returned` (text-success / emerald) or `Denied` (text-danger / red). No pill, no icon — just colored text. |
| Borrower | (already in subtext above) | merged into Title cell |
| Date | `loan.returnedAt` for returned, `loan.deniedAt` for denied; fall back to `loan.dateBorrowed` if neither is set | Format with existing `formatShortDate` |
| Type | optional — drop entirely if Title cell already conveys it via the colored status text |

So the practical table is **two columns**: Title (with subtext) +
Date. Keep it that compact.

Markup pattern:

```jsx
<div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
  <table className="w-full text-left text-sm">
    <thead>
      <tr className="border-b border-border/60 bg-surface-subtle/40 text-xs text-text-secondary">
        <th className="px-5 py-3 font-medium">Book</th>
        <th className="px-5 py-3 font-medium">Date</th>
      </tr>
    </thead>
    <tbody>
      {historyRows.map((row) => (
        <tr key={row.id} className="border-b border-border/30 last:border-0">
          <td className="px-5 py-3.5">
            <p className="font-medium text-text">{row.loan.bookTitle}</p>
            <p className="mt-0.5 text-xs">
              <span className="text-text-secondary">{row.loan.borrower}</span>
              <span className="mx-1.5 text-text-muted">·</span>
              <span className={row.type === 'returned' ? 'text-success font-medium' : 'text-danger font-medium'}>
                {row.type === 'returned' ? 'Returned' : 'Denied'}
              </span>
            </p>
          </td>
          <td className="px-5 py-3.5 text-text-secondary">
            {formatShortDate(row.loan.returnedAt || row.loan.deniedAt || row.loan.dateBorrowed)}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
  {historyRows.length === 0 && (
    <p className="py-8 text-center text-sm text-text-muted">No past loans.</p>
  )}
</div>
```

- No icons anywhere in the table.
- Status as **colored text only**, sitting in the subtext line under
  the title.
- Padding via `px-5 py-3.5` (matches existing table-style components in
  the project — see `ClerkChambersPage`'s members table for a known-
  good reference if needed).
- The toolbar above (search / category / sort) continues to apply —
  filters reduce `historyRows` before the map.

### 2. Overdue card → 50/50 with "More ▾" button

`clms-app/src/components/molecules/BookCard.jsx`

Replace the current `Mark Returned (flex-1) + ⋮ kebab (w-9)` pattern
with a balanced two-button split where the second button is the
dropdown trigger:

```
[ Mark Returned (primary, flex-1) ]  [ More ▾ (secondary, flex-1) ]
                                            ↓ on click
                                       ┌──────────────────────┐
                                       │ ⏰ Send Reminder       │
                                       │ ↻ Extend by 7 days    │
                                       └──────────────────────┘
```

Concrete details:

- Both buttons use `flex-1 basis-0 min-w-0` wrappers (same 50/50
  pattern as the rest of the card actions). Same height as the
  primary button, no kebab w-9 weirdness.
- Second button's children: text `More` + lucide `ChevronDown`-style
  icon. Use the project icon registry — `solar:alt-arrow-down-linear`
  if it exists, otherwise add a quick mapping. The icon sits to the
  right of the label with `gap-1`.
- The dropdown menu opens **directly below the More button**, right-
  aligned to the More button so it doesn't overflow the card to the
  right at narrow widths. ~180 px wide. Same click-outside and ESC
  close behaviour the kebab implementation already has — just retarget
  the trigger.
- Menu items unchanged: `Send Reminder` (rendered if `onRemind`),
  `Extend by 7 days` (rendered if `onExtend`). Each row is leading
  icon + label.
- If neither secondary handler is passed, the More button does not
  render (Mark Returned takes the full card width on its own).

Action priority chain stays the same as the previous spec; only the
**rendering** of the Overdue tab pattern changes:

- (priority 3) `onMarkReturned` together with `onRemind` and/or
  `onExtend` →
  - **2-button row**: Mark Returned (primary, flex-1) + More ▾
    (secondary, flex-1) opening the dropdown.
  - At least one secondary handler must be present for the More
    button to appear; if both are absent, fall through to priority 4
    (Mark Returned alone or with Recall).

All other priority branches (Approve+Deny, Recall+Dismiss,
MarkReturned+Recall, onRemind alone for dashboard triage,
onCatalogue alone, barrister fallback) **do not change**.

## Acceptance criteria

1. The History tab on `/app/library` (clerk role) renders a simple
   two-column table: **Book** (title + colored status in subtext) and
   **Date**. No icons. No pills. Padding visually matches other
   table surfaces in the app.
2. The Overdue tab `BookCard` shows two equal-width buttons:
   `Mark Returned` on the left and `More ▾` on the right. Clicking
   `More` opens a dropdown listing `Send Reminder` and
   `Extend by 7 days`. Clicking outside or pressing Escape closes
   the dropdown.
3. The On Loan tab's 2-button (`Recall` + `Mark Returned`) layout
   is unchanged.
4. The dashboard Triage Queue cards (which pass `onRemind` alone)
   still render a single full-width `Send Reminder` button — no
   regression.
5. `npm run build` clean. New lint errors only on touched files
   should be addressed; existing baseline lint debt is out of scope.

## Verification steps

1. `cd clms-app && npm run build`.
2. `cd clms-app && npx eslint src/components/molecules/BookCard.jsx src/components/pages/app/ClerkLibraryPage.jsx`
   should be clean.
3. Read the History tab JSX and confirm the table markup matches the
   pattern in section 1.
4. Read the Overdue card JSX and confirm both buttons share the same
   `flex-1 basis-0 min-w-0` wrapper width and that the dropdown
   trigger is the right-side button (no kebab).

## Out of scope

- Restyling the rest of the page header / toolbar (already in good
  shape from the previous spec).
- Adding pagination or date filters to History.
- Changing the LoanCard component itself — it just stops being used
  on this tab.
