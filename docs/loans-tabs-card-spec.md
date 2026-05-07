# Loans Tabs Card Wrapper Spec

**Date**: 2026-05-06
**Status**: Proposed
**For**: Codex implementation
**Why**: Clerk Loans tabs visually look "background-less" because they sit directly on the page background. Catalogue's tabs are wrapped in a white card so the `bg-slate-100` SegmentedTabs container reads clearly. Apply the same pattern to Loans.

## Change

### `src/components/pages/app/ClerkLoansPage.jsx`

Currently around line 146:

```jsx
<div className="mt-5">
  <SegmentedTabs
    fullWidth
    items={tabs}
    loading={loading}
    onChange={setTab}
    value={tab}
  />
</div>
```

Replace with:

```jsx
<div className="mt-5 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5">
  <SegmentedTabs
    fullWidth
    items={tabs}
    loading={loading}
    onChange={setTab}
    value={tab}
  />
</div>
```

That's the only change.

### Apply to BarristerLoansPage if same issue

Open `BarristerLoansPage.jsx`, find the SegmentedTabs render. If the tabs are NOT already inside a white card wrapper, wrap them in `<div className="mt-5 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5">`. If they already are, no change.

### Apply to ClerkChambersPage if same issue

Same audit: if the Members | Locations SegmentedTabs is not inside a white card, wrap it. If already inside one, leave it alone.

## Out of scope

- Changing SegmentedTabs internal styling.
- Restructuring page layout otherwise.
- Touching Catalogue (already correct).

## Verification

1. `npm --prefix /Users/seanlee/Desktop/CLMS/clms-app run build` must pass.
2. Loans tabs now render inside a white card with the slate-100 SegmentedTabs tray clearly visible.
3. Catalogue and Loans tab visuals match.
