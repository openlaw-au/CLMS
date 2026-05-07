# Icon Flat Pattern Spec

**Date**: 2026-05-06
**Status**: Proposed
**For**: Codex implementation
**Why**: Sean wants the icon-without-colored-background pattern from the authority list cards (`BarristerListsPage.jsx:1571-1573`) applied to other content cards. Current cards wrap their icon in a colored squircle (`bg-brand/10`, `bg-amber-50`, etc.) which adds visual weight and inconsistency.

## Canonical pattern (target)

From `BarristerListsPage.jsx` authority list item (line 1571):

```jsx
<div className="flex items-center gap-2">
  <Icon name={typeIcon} size={15} className={`shrink-0 ${typeColor}`} />
  <p className="truncate text-sm font-medium text-text">{item.title}</p>
</div>
```

Icon = plain colored glyph (no wrapper background, no fixed h/w container). Title sits next to it with the established typography (font-serif if it's a book title — keep per card).

## Changes

### 1. `src/components/molecules/BookCard.jsx` (lines 19-23)

Current:
```jsx
<span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
  <Icon name="solar:book-2-linear" size={16} className={iconColor} />
</span>
<p className={`min-w-0 flex-1 font-serif text-sm font-medium leading-snug ${onLoan && !overdue ? 'text-text-secondary' : 'text-text'}`}>{book.title}</p>
```

Replace with:
```jsx
<Icon name="solar:book-2-linear" size={16} className={`shrink-0 ${iconColor}`} />
<p className={`min-w-0 flex-1 font-serif text-sm font-medium leading-snug ${onLoan && !overdue ? 'text-text-secondary' : 'text-text'}`}>{book.title}</p>
```

Drop the wrapper `<span>`. Keep `iconColor` so status semantics (overdue → red, borrowed → info, etc.) survive via icon color alone.

`iconBg` constant on line 10 is now unused — delete it.

### 2. `src/components/molecules/LoanCard.jsx` clerk view (lines 29-37)

Current:
```jsx
<span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
  loan.status === 'overdue' ? 'bg-red-50' : loan.status === 'pending' ? 'bg-amber-50' : 'bg-emerald-50'
}`}>
  <Icon
    name={loan.status === 'overdue' ? 'solar:clock-circle-linear' : loan.status === 'pending' ? 'solar:hand-shake-linear' : 'solar:book-bookmark-linear'}
    size={18}
    className={loan.status === 'overdue' ? 'text-red-500' : loan.status === 'pending' ? 'text-amber-500' : 'text-emerald-500'}
  />
</span>
```

Replace with:
```jsx
<Icon
  name={loan.status === 'overdue' ? 'solar:clock-circle-linear' : loan.status === 'pending' ? 'solar:hand-shake-linear' : 'solar:book-bookmark-linear'}
  size={18}
  className={`shrink-0 ${loan.status === 'overdue' ? 'text-red-500' : loan.status === 'pending' ? 'text-amber-500' : 'text-emerald-500'}`}
/>
```

Drop the colored squircle wrapper.

### 3. `src/components/molecules/SearchResultCard.jsx` compact variant (lines ~39-40)

Current:
```jsx
<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10">
  <Icon name="solar:book-2-linear" size={18} className="text-brand" />
</span>
```

Replace with:
```jsx
<Icon name="solar:book-2-linear" size={18} className="shrink-0 text-brand" />
```

Note: the full variant (line ~194) already uses the plain pattern — no change needed there.

If non-book result types (JADE / case / legislation) use a similar wrapper with different bg colors, apply the same flat treatment to all of them in this file.

### 4. `src/components/pages/app/ClerkLoansPage.jsx` Recalls inline (lines 182-183)

Current:
```jsx
<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50">
  <Icon name="solar:hand-shake-linear" size={18} className="text-amber-600" />
</span>
```

Replace with:
```jsx
<Icon name="solar:hand-shake-linear" size={18} className="shrink-0 text-amber-600" />
```

The parent container (`<div className="flex items-start gap-3">`) may need its `gap-3` reduced to `gap-2` to match the new inline icon proportion. Adjust if visual rhythm feels off; otherwise leave gap-3.

### 5. `src/components/molecules/MetricCard.jsx` — leave alone

MetricCard is a dashboard stat tile where the colored swatch is intentional (visual punch on the metric grid). Keep as-is.

### 6. Vertical alignment after squircle removal

Removing the `h-10 w-10` / `h-9 w-9` containers may shift baseline alignment between icon and title. After each change, verify that the icon and the FIRST line of the title align visually. If misaligned, switch container from `flex items-start` → `flex items-center` so the icon centers against the (potentially multi-line) title block. Apply this fix only where needed; don't blindly change all containers.

## Verification

1. `npm --prefix /Users/seanlee/Desktop/CLMS/clms-app run build` must pass.
2. Visually compare:
   - Library (Barrister) book cards now have plain icon + title — no colored squircle.
   - Loans (Clerk) rows have plain icon + title.
   - Search result compact cards: plain icon.
   - Recalls inline rows: plain icon.
3. Status semantics via color still readable (overdue red icon, pending amber icon, available brand/emerald icon).
4. `rg "h-10 w-10.*rounded-xl.*bg-" src/components` — should not return any of the cards listed above (only legitimate places like avatar wrappers, badge containers, etc.).

## Out of scope

- MetricCard / dashboard stat tiles.
- ChamberCard, FeatureCard (no icon-bg pattern there).
- Avatar wrappers, status badges, alert pills — these legitimately use colored backgrounds.
- LoanCard barrister view — already has no icon-bg pattern.

## Conventions

- Tailwind scale only.
- No new tokens.
- No copy changes.
- Status color encoding migrates from BG → ICON color (no information loss).
