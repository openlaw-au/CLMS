# Tab Pattern Redesign + Consolidation Spec

**For**: Codex implementation
**Status**: Proposed
**Run order**: After `inline-button-cleanup-spec.md` lands.

---

## Sean's call

> loan에 탭컴포넌트 별로인데 바리스터에서 탭이 저런식이엇으면 내가 통과안시켯을텐데. 호버도 없고 액티브 상태도 별로고

Two problems:
1. **`SegmentedTabs` (used on Clerk Loans/Catalogue/Search/Chambers) lacks visual feedback.** Inactive items only change text color on hover (no background shift), and the active state is a low-contrast white-on-slate-100 with a faint shadow that doesn't read as "selected."
2. **The codebase has two tab patterns** — `SegmentedTabs` (4 surfaces) and `StatusPillBar` (Barrister Loans only). Same job, different look. Should be one.

This spec consolidates into one stronger component.

---

## Decision: keep `SegmentedTabs`, retire `StatusPillBar`

`SegmentedTabs` already supports the broader use cases (fullWidth toggle, count badges with tone, loading state, controlled value). `StatusPillBar`'s differentiating feature (icon + activeColor per pill) folds in cleanly via additional props. Migrating `StatusPillBar` (1 call site) into the unified component is cheaper than the reverse.

**`StatusPillBar.jsx` and its stories will be deleted** after migration.

---

## Visual redesign — `SegmentedTabs`

### Container
Unchanged: `rounded-xl bg-slate-100 p-1`.

### Inactive item (rest state)
- Today: `text-text-secondary` only — looks like static text, not a button.
- New: `bg-transparent text-text-secondary font-medium`.

### Inactive item (HOVER) — new requirement
The missing state. Must clearly read as "this is interactive" before click.
- New: `hover:bg-white/60 hover:text-text`.
- Transition: `transition-all duration-150 ease-out`.

### Active item — strengthened
The current `bg-white shadow-sm` is too soft against `bg-slate-100`.
- New: `bg-white text-text font-semibold shadow-sm ring-1 ring-black/5`.
- The bump from `font-medium` (inactive) to `font-semibold` (active) gives the active label real weight without changing color.
- The `ring-1 ring-black/5` makes the lift legible — subtle but clearly separated from the container.

### Optional icon (new prop)
For migration from `StatusPillBar`, accept `icon?: string` per item. Render at `size={14}` left of the label, `text-current` so it inherits the active/inactive color cleanly.

### Optional active accent color (new prop)
For status-driven tabs (e.g. overdue → red active state), accept `activeAccent?: 'brand' | 'red' | 'amber' | 'emerald'` per item. When set AND active:
- `brand`: `bg-brand text-white shadow-sm` (replaces the white-lift).
- `red`/`amber`/`emerald`: same pattern with the corresponding tone.
- The default (no `activeAccent`) keeps the white-lift active style above.

This preserves `StatusPillBar`'s color-coded active behavior without forking the component.

### Count badge — tighten contrast in active state
Current `getToneClasses(item.tone).badge` returns the same classes regardless of active state, so an active tab's count badge can lose contrast on white. New rule:
- When `isActive` AND `activeAccent` is unset (white-lift): badge stays tone-mapped (current behavior).
- When `isActive` AND `activeAccent` is set (colored fill): badge switches to `bg-white/25 text-white` so it reads on the colored background.

### Loading skeleton
Unchanged.

---

## API surface (target)

```ts
type SegmentedTabsItem = {
  key: string;
  label: string;
  count?: number;
  icon?: string;                        // NEW — optional Iconify name
  tone?: 'neutral' | 'amber' | 'red' | 'emerald' | 'brand' | 'info'; // for the count badge in white-lift mode
  activeAccent?: 'brand' | 'red' | 'amber' | 'emerald';              // NEW — when set, colored active fill
};

type SegmentedTabsProps = {
  items: SegmentedTabsItem[];
  value: string;
  onChange: (key: string) => void;
  fullWidth?: boolean;
  loading?: boolean;
};
```

Backward compatible — all existing call sites keep working. The new props are opt-in.

---

## Migrations

### `BarristerLoansPage.jsx` — replace `StatusPillBar` with `SegmentedTabs`

The current call (around line 260) passes items with `icon`, `count`, and `activeColor`. Map those:
- `activeColor: 'bg-brand'` → `activeAccent: 'brand'`.
- `activeColor: 'bg-red-600'` (or similar) → `activeAccent: 'red'`.
- `icon` and `count` carry over with the same names.

Drop the `<StatusPillBar>` import. Add `<SegmentedTabs>` import.

### Other 4 call sites
No code change required — they don't use the new props, so they pick up only the visual improvements (hover + stronger active).

### Cleanup
- Delete `clms-app/src/components/molecules/StatusPillBar.jsx`.
- Delete `clms-app/src/components/molecules/StatusPillBar.stories.jsx`.
- Search the repo for any stray `StatusPillBar` references — there should be none after the Barrister Loans migration.

---

## Implementation steps for Codex

1. Update `SegmentedTabs.jsx` per the visual + API spec.
2. Update `SegmentedTabs.stories.jsx` (if it exists; create if not) with three rows:
   - Default (white-lift) with hover demo.
   - With icons (using the new `icon` prop).
   - With `activeAccent="brand"` and `activeAccent="red"` to show colored active fill.
3. Migrate `BarristerLoansPage.jsx` to `SegmentedTabs`.
4. Delete `StatusPillBar.jsx` and its stories.
5. Verify no remaining `StatusPillBar` import or usage anywhere in `clms-app/src`.
6. `npm run build` — must pass.
7. Targeted lint on touched files — must pass.
8. Do NOT commit.

## Acceptance

- [ ] Hovering over an inactive tab shifts background visibly (`bg-white/60`), not just text color.
- [ ] Active tab has clearly stronger weight (`font-semibold` + `ring-1 ring-black/5`) than inactive.
- [ ] Barrister Loans tabs render with `activeAccent="brand"` (orange fill on selected) — visually equivalent to the prior `StatusPillBar`.
- [ ] No file in `clms-app/src/` imports `StatusPillBar`.
- [ ] All 5 existing surfaces (Clerk Loans, Catalogue, Search, Chambers, Barrister Loans) render their tabs without regression.
- [ ] Build + targeted lint pass.

## Hard constraints

- Do NOT add a third tab pattern.
- Do NOT touch services, mocks, onboarding, settings pages, or `index.html`.
- Do NOT install dependencies.
- Do NOT delete spec/decision docs.
- Do NOT commit.
