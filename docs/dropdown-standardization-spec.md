# Dropdown Standardization Spec

**Date**: 2026-05-06
**Status**: Proposed
**For**: Codex implementation
**Why**: Dropdowns/menus/popovers across the app each style themselves differently — inconsistent padding, border tone, shadow offset, and rounding. Sean reports the side-padding feels off in several places. Standardize all dropdown panels to match the canonical `CategoryDropdown.jsx` pattern.

## Canonical pattern (the winner)

From `src/components/molecules/CategoryDropdown.jsx`:

**Panel container**:
```
absolute z-20 rounded-xl border border-border/60 bg-white py-1 shadow-lg
```

(Position direction — `right-0 top-full mt-1` etc — is per use site. The base look is the rest of that string.)

**Items inside the panel**:
```
flex w-full items-center gap-2 px-3 py-1.5 text-sm text-text hover:bg-slate-100
```

(`py-1.5` for compact items, `py-2` for taller ones — pick by content density. Use `px-3` always.)

## Out of scope

- Native `<select>` styling.
- Tooltip popovers (different pattern).
- Modal/panel surfaces (separate spec already done).
- Adding a new shared `DropdownPanel` component — string standardization only. (If a low-cost wrapper meaningfully reduces duplication, fine to add as a tiny utility — but don't refactor every call site through props.)

## Targets to fix

### 1. AppShell profile menu

**`src/components/organisms/AppShell.jsx`** (around line 450):

Currently:
```
absolute bottom-full left-2 right-2 z-20 mb-1 rounded-xl border border-border/80 bg-white p-1 shadow-[0_-12px_36px...]
```

Replace panel className with:
```
absolute bottom-full left-2 right-2 z-20 mb-1 rounded-xl border border-border/60 bg-white py-1 shadow-lg
```

Items inside (Edit profile, Log out): change to `px-3 py-1.5` (from current `px-2.5 py-1.5`). Keep the existing destructive treatment on `Log out` (`text-red-700 hover:bg-red-50`).

### 2. AppShell notifications dropdown

**`src/components/organisms/AppShell.jsx`** (around line 569):

Currently:
```
absolute right-0 top-full z-50 mt-2 w-80 animate-fade-in overflow-hidden rounded-2xl border border-border/60 bg-white shadow-xl ring-1 ring-black/5
```

Replace with:
```
absolute right-0 top-full z-20 mt-2 w-80 animate-fade-in overflow-hidden rounded-xl border border-border/60 bg-white py-1 shadow-lg
```

Notifications are richer rows than menu items, so keep their internal padding at `px-3 py-2.5` (slightly taller than canonical `py-1.5`). The container alignment is what matters.

### 3. Header search autosuggest

**`src/components/molecules/HeaderSearchBar.jsx`** (around line 227):

Currently:
```
absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 rounded-[24px] border border-slate-200 bg-white p-2 shadow-[0_22px_48px_rgba(15,23,42,0.14)] ring-1 ring-black/5
```

Replace with:
```
absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 rounded-xl border border-border/60 bg-white py-1 shadow-lg
```

Items inside the autosuggest: ensure they use `px-3 py-1.5`. (Some currently use `px-2.5 py-2` — adjust.)

The "Add to List" portaled modal at the bottom of this file is a modal, NOT a dropdown — leave its modal styling alone.

### 4. BarristerListsPage inline search panels

**`src/components/pages/app/BarristerListsPage.jsx`** (around line 2228 and 2314):

Two inline-search dropdowns. Currently:
```
absolute left-4 right-4 z-10 mt-1 overflow-hidden rounded-xl border border-border bg-white shadow-lg ring-1 ring-black/5
```
and
```
absolute left-5 right-5 z-10 mt-1 overflow-hidden rounded-xl border border-border bg-white shadow-lg ring-1 ring-black/5
```

Update both to use:
```
absolute left-0 right-0 z-20 mt-1 overflow-hidden rounded-xl border border-border/60 bg-white py-1 shadow-lg
```

(`left-0 right-0` so the dropdown matches the input width naturally rather than being inset by 4 or 5 units. `z-20` for consistency.)

Items inside: `px-3 py-1.5` for compact rows, `px-3 py-2` if the row content is denser.

### 5. BarristerListsPage list-card action menu

**`src/components/pages/app/BarristerListsPage.jsx`** (around line 2602):

Currently:
```
absolute right-0 top-9 z-20 w-40 overflow-hidden rounded-xl border border-border bg-white shadow-lg ring-1 ring-black/5 animate-fade-in
```

Replace with:
```
absolute right-0 top-9 z-20 w-44 overflow-hidden rounded-xl border border-border/60 bg-white py-1 shadow-lg animate-fade-in
```

(`w-44` (176px) gives a hair more breathing room than `w-40` (160px) — many menu items get truncated otherwise.) Items inside: `px-3 py-1.5`. Keep the destructive Remove item with `text-red-700 hover:bg-red-50`.

### 6. CategoryDropdown — leave alone

It's already canonical. No change.

### 7. FilterPill.jsx popover

**`src/components/molecules/FilterPill.jsx`** (around line 47):

Currently:
```
absolute left-0 top-full z-20 mt-1 min-w-[180px] rounded-xl border border-border bg-white py-1 shadow-lg
```

Already close. Just normalize border to `border-border/60` for visual consistency:

```
absolute left-0 top-full z-20 mt-1 min-w-[180px] rounded-xl border border-border/60 bg-white py-1 shadow-lg
```

Items already at `px-3 py-2` — keep (good for filter row density).

---

## Verification

1. `npm --prefix /Users/seanlee/Desktop/CLMS/clms-app run build` must pass.
2. Open every dropdown surface in the app and confirm visually:
   - Same rounded-xl corner.
   - Same `border-border/60` weight.
   - Same `shadow-lg` (no custom shadow strings remain in dropdown panels).
   - Same panel `py-1` breathing.
   - Items consistently `px-3 py-1.5` (or `py-2` / `py-2.5` for denser content but always `px-3`).
3. `rg "rounded-2xl.*shadow.*border" src/components` should not return matches for dropdown surfaces (modals/cards may still use rounded-2xl).
4. `rg "rounded-\[24px\]" src/components` should return zero matches in dropdown contexts.

## Conventions

- No new components (keep this string-standardization).
- No new design tokens.
- Tailwind scale only.
- Do not touch modal styling.
