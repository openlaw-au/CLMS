# Loan Card Icon Background Restore Spec

**Date**: 2026-05-06
**Status**: Proposed
**For**: Codex implementation
**Why**: Sean wants the loan-row icon to sit inside a soft colored rounded square that matches the icon's tone, sized tall enough to span 2 lines of text (title + subtitle), with the icon vertically centered. Restores visual weight that was removed in the earlier icon-flat pattern spec — but only for LoanCard rows, not for content cards like BookCard.

## Out of scope

- BookCard / Catalogue card — keep flat icon (per existing decision).
- SearchResultCard — keep flat (per existing decision).
- MetricCard — already has its own swatch pattern.

## Canonical pattern (target)

```jsx
<span className={`flex h-11 w-11 shrink-0 items-center justify-center self-center rounded-xl ${BG_TINT}`}>
  <Icon name={ICON_NAME} size={20} className={ICON_COLOR} />
</span>
```

- `h-11 w-11` = 44px square — tall enough to align cleanly against title (text-sm = ~20px) + subtitle (text-xs = ~16px) + small gap. Matches a 2-line text block height.
- `self-center` (or parent `items-center`) ensures vertical centering against the multi-line text on the right.
- `rounded-xl` for the soft squircle.
- `BG_TINT` is a tone-matched light tint (e.g. `bg-red-50`, `bg-amber-50`, `bg-emerald-50`).
- Icon `size={20}` slightly larger than before (was 18) to read well at 44px.

## Changes

### 1. `src/components/molecules/LoanCard.jsx` clerk view (lines 27-37)

Currently flat:
```jsx
<Icon
  name={loan.status === 'overdue' ? 'solar:clock-circle-linear' : loan.status === 'pending' ? 'solar:hand-shake-linear' : 'solar:book-bookmark-linear'}
  size={18}
  className={`shrink-0 ${loan.status === 'overdue' ? 'text-red-500' : loan.status === 'pending' ? 'text-amber-500' : 'text-emerald-500'}`}
/>
```

Replace with the tinted-square pattern:
```jsx
<span className={`flex h-11 w-11 shrink-0 items-center justify-center self-center rounded-xl ${
  loan.status === 'overdue' ? 'bg-red-50' :
  loan.status === 'pending' ? 'bg-amber-50' :
  'bg-emerald-50'
}`}>
  <Icon
    name={loan.status === 'overdue' ? 'solar:clock-circle-linear' : loan.status === 'pending' ? 'solar:hand-shake-linear' : 'solar:book-bookmark-linear'}
    size={20}
    className={
      loan.status === 'overdue' ? 'text-red-500' :
      loan.status === 'pending' ? 'text-amber-500' :
      'text-emerald-500'
    }
  />
</span>
```

Also: outer parent container of icon + title block (currently `flex items-center gap-3`) — verify it still uses `items-center` so the 44px box centers vertically against the 2-line text. If it uses `items-start`, change to `items-center`. Adjust the gap to `gap-3` if not already.

### 2. `src/components/pages/app/ClerkLoansPage.jsx` Recalls inline (around line 180-189)

Currently flat:
```jsx
<Icon name="solar:hand-shake-linear" size={18} className="shrink-0 text-amber-600" />
```

Replace with:
```jsx
<span className="flex h-11 w-11 shrink-0 items-center justify-center self-center rounded-xl bg-amber-50">
  <Icon name="solar:hand-shake-linear" size={20} className="text-amber-600" />
</span>
```

Also: the parent container is `<div className="flex items-start gap-3">`. Change to `<div className="flex items-center gap-3">` so the 44px square aligns vertically with the title + subtitle text block.

### 3. Active / Overdue / Pending color mapping consistency

LoanCard clerk view uses these tone tokens:
- pending → amber
- active → emerald  
- overdue → red

For History (returned/denied) the row currently doesn't reach LoanCard with a special icon — it inherits one of the above. Leave existing logic as-is. If needed, History-tab loans can show neutral icon with `bg-slate-100` + `text-text-muted`, but only if Codex finds the History tab uses LoanCard with a status that doesn't match the existing 3-way conditional. If returned loans inherit `text-emerald-500` / `bg-emerald-50` because their status is `'returned'` falling through to the default, that's acceptable for now.

If Codex sees that returned/denied loans look wrong (green tint for returned books), apply a 4-way conditional adding:
- returned → `bg-slate-100` + `text-text-muted` icon
- denied → `bg-slate-100` + `text-text-muted` icon

## Verification

1. `npm --prefix /Users/seanlee/Desktop/CLMS/clms-app run build` must pass.
2. Visual check on Loans page across all 5 tabs:
   - Each row's icon sits in a 44px squircle.
   - Square color matches the icon color (red-50/red-500, amber-50/amber-500/600, emerald-50/emerald-500).
   - Icon visually centered inside the square.
   - Square vertically centered against the title + subtitle text block.
3. Catalogue / Library / SearchResult cards remain flat (unchanged).

## Conventions

- Tailwind scale only.
- No new tokens.
- No copy changes.
