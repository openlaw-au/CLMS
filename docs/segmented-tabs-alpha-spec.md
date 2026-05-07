# SegmentedTabs Alpha Background Spec

**Date**: 2026-05-06
**Status**: Proposed
**For**: Codex implementation
**Why**: The white card wrapper added to make SegmentedTabs trays visible was a workaround. The right fix is to change the tab container's own background from opaque `bg-slate-100` to an alpha-based color that adapts to any surface (light or dark page background).

## Changes

### 1. `src/components/molecules/SegmentedTabs.jsx`

Container className currently:

```js
className="flex gap-1 rounded-xl bg-slate-100 p-1"
```

Change to:

```js
className="flex gap-1 rounded-xl bg-black/5 p-1"
```

Rationale: `bg-black/5` reads as a subtle gray on white surfaces and stays visible on darker surfaces by darkening them by 5%.

Also update the inactive-tab hover. Current inactive tab classes:

```js
'bg-transparent font-medium text-text-secondary hover:bg-white/60 hover:text-text'
```

Keep `bg-transparent`. Keep `hover:bg-white/60` (it already uses alpha and works on any surface). No change there.

The active pill stays `bg-white text-text font-semibold shadow-sm ring-1 ring-black/5` — white pill is fine on any surface and provides clear active distinction.

### 2. Revert white card wrappers

Three pages got a white card wrapper around SegmentedTabs in the previous spec. Revert them so the tabs render directly without the extra card.

**`src/components/pages/app/ClerkLoansPage.jsx`** (around line 146):
```jsx
<div className="mt-5 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5">
  <SegmentedTabs ... />
</div>
```
Replace with:
```jsx
<div className="mt-5">
  <SegmentedTabs ... />
</div>
```

**`src/components/pages/app/BarristerLoansPage.jsx`** (around line 272 — find the recently-added white card around SegmentedTabs):
Remove the wrapper div, keeping only the SegmentedTabs (or whatever minimal structural div was there before).

**`src/components/pages/app/ClerkChambersPage.jsx`** (around line 115):
Remove the `<div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5">` wrapper, leaving SegmentedTabs as a direct child of PageHeader.

### 3. Skeleton loading state

`SegmentedTabs.jsx` skeleton case currently uses `<Skeleton>` (which has its own slate background). No change needed — the loading state stays consistent.

## Verification

1. `npm --prefix /Users/seanlee/Desktop/CLMS/clms-app run build` must pass.
2. Open Loans / Catalogue / Chambers — SegmentedTabs trays render with subtle gray background that's clearly visible on the page bg.
3. Catalogue tabs (which were already correct in white card context) still look fine.
4. The active tab still reads as a white pill against the now-alpha tray.

## Out of scope

- Changing active pill styling.
- Changing `activeAccent` colored variants.
- Touching pages that didn't have a white card added.
