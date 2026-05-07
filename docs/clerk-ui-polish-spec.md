# Clerk UI Polish Spec — Destructive Actions, Dismiss Pattern, Sidebar Icon, Tab Parity

**Date**: 2026-05-06
**Status**: Proposed
**For**: Codex implementation
**Goal**: Tighten visual consistency across the app — standardize destructive actions, normalize dismiss buttons + overlay-dismiss + slide-out animations, fix the broken Loans sidebar icon, ensure tab styling parity.

## Out of scope

- New design tokens.
- New components (reuse existing atoms/molecules — `Button`, `Icon`, `SegmentedTabs`, modal shells).
- Behavioral changes to barrister-only flows beyond what each task explicitly says.
- Keyboard/focus management redesign — keep current Esc-to-close where it exists.

## Reuse rules

- All destructive buttons must use `<Button variant="danger">` or `variant="danger-solid"` from `src/components/atoms/Button.jsx`. Do not introduce inline `text-red-*` / `bg-red-*` styling on action buttons.
- All dismiss / close buttons must use the new shared pattern (Section C). No bespoke close buttons.
- Slide-out keyframes must be added to the existing animation file (`src/index.css` or wherever `animate-slide-in-panel` is currently defined). No inline `style={{ animation: ... }}`.
- Tailwind scale only. 4px grid only. No arbitrary `px-[13px]` style values.
- English copy. No em dashes.

---

## Section A — Destructive action standardization

**Pattern**: light red bg + dark red text + slightly darker red on hover. The `Button` atom **already defines** this as `variant="danger"` (`bg-red-50 text-red-700 hover:bg-red-100`). Use it everywhere.

### Files to update

Replace inline-styled destructive buttons with `<Button variant="danger">`:

1. **`src/components/organisms/DevPanel.jsx:140`** — "Reset Onboarding" button. Currently `border-red-200 text-red-600 hover:bg-red-50`. Switch to `<Button variant="danger" size="sm">`.

2. **`src/components/organisms/AppShell.jsx:465`** — "Log out" button in profile menu dropdown. Currently `text-red-600 hover:bg-red-50`. This is a menu item, not a standalone button — do NOT use the Button atom (would break the menu layout). Instead, normalize the inline classes to: `text-red-700 hover:bg-red-50` (matches danger variant text token). Keep the existing menu-item structure.

3. **`src/components/pages/app/BarristerListsPage.jsx:2561`** — list-card menu "Remove" item. Currently `text-danger hover:bg-danger/5`. Same as #2 — it's a dropdown menu item. Normalize to `text-red-700 hover:bg-red-50`. Keep menu-item structure.

4. **`src/components/pages/app/BarristerListsPage.jsx:1530`** and **`:2086`** — small icon-only "remove" buttons (for list items / sections). Currently `text-text-muted hover:bg-danger/10 hover:text-danger`. These are icon buttons inside dense rows — keep them as icon buttons but normalize hover treatment to: `text-text-muted hover:bg-red-50 hover:text-red-700`. (No Button atom — small icon button context.)

5. **`src/components/molecules/SearchResultCard.jsx:131`** and **`:286`** — "Remove from List" button. Currently `text-danger hover:!text-danger`. If rendered as a button (not menu item): replace with `<Button variant="danger" size="sm">`. If rendered inside an action row alongside other Buttons: same.

6. **`src/components/organisms/AuthorityListDrawer.jsx:163`** — drawer item remove icon button. Currently `text-text-muted hover:bg-slate-200 hover:text-red-500`. Normalize to the icon-button hover pattern from #4: `text-text-muted hover:bg-red-50 hover:text-red-700`.

7. **`src/components/molecules/LocationRow.jsx:21`** — "Delete" button currently uses `variant="ghost"`. Change to `variant="danger"`.

8. **`src/components/molecules/InviteRow.jsx:23`** — "Delete" button currently uses `variant="ghost"`. Change to `variant="danger"`.

### Leave unchanged

- `Tag.jsx`, `FilterPill.jsx`, header notification dismiss, `HeaderSearchBar.jsx` input-clear `x` — these are reversible neutral dismissals, not destructive. Keep neutral styling.
- All existing `<Button variant="danger">` / `variant="danger-solid"` usages — already correct.

### Acceptance

- `rg "text-red-[0-9]" src/components/` returns only matches inside `Button.jsx` and the AppShell logout / list-menu remove items (#2, #3 above) and the icon-button hover patterns (#4, #6).
- Visual: every action labeled Delete / Remove / Discard / Reset / Reject / Deny renders with the canonical light-red-bg + dark-red-text style on rest, slightly darker on hover.

---

## Section B — Catalogue panel: remove redundant Cancel button

**Problem**: The inline view/edit panel inside `ClerkCataloguePage.jsx` has a **Cancel button at line 449 and 620** AND a header X icon at line 457. Both close the panel. Sean wants only the header X.

### Changes

**`src/components/pages/app/ClerkCataloguePage.jsx`**:
- Remove the `Cancel` button at line 449 (whichever footer / action row it sits in).
- Remove the `Cancel` button at line 620.
- Keep the header X button (becomes the new dismiss pattern from Section C).
- Remaining footer buttons in the panel should be: `Save` (primary) + `Delete` (danger). No Cancel. If the panel currently has only a Cancel (no Save), audit the flow — the `Open` button leads to a view-first panel; in view mode there should be no footer at all, only the header X. In edit mode there should be Save + Delete.

### Audit other panels

While here, scan these for the same redundant Cancel + X pattern and remove the Cancel:
- `BookDetailPanel.jsx`
- `NewLoanModal.jsx`
- `IsbnIntakeModal.jsx`
- `LoanActionModal.jsx`
- `ImportModal.jsx`
- `AddBookFlow.jsx`
- `ExportPreviewModal.jsx`
- `BarristerLoansPage.jsx` modals (line 387 area)
- `BarristerListsPage.jsx` modals
- `BarristerSearchPage.jsx` modal
- `HeaderSearchBar.jsx` Add-to-List modal

**Rule**: If a modal/panel has BOTH a header X AND a "Cancel" button that does the same thing (close without saving), remove the Cancel. Keep destructive-confirmation modals' Cancel + Confirm pair (where Cancel and a primary destructive action are paired choice — those are decisions, not redundant dismissals).

### Acceptance

- Catalogue inline panel has no Cancel button.
- Modals across the app that previously had redundant `Cancel + X` keep only the X.
- Confirmation dialogs (e.g. "Delete list — Cancel / Delete") keep their Cancel since it's a real choice.

---

## Section C — Dismiss button: plain X + hover-fills-circle pattern

**Problem**: 26 places in the codebase use `solar:close-circle-linear` as the dismiss icon. The icon already includes a circle outline, so the visual is "circle + X" with no clean hover state.

**New canonical pattern**:
- Icon: `solar:close-linear` (plain X, no built-in circle).
- Wrapper button: `rounded-full p-1.5 text-text-muted transition-colors duration-150 hover:bg-slate-100 hover:text-text`.
- On hover, the `rounded-full` + `bg-slate-100` creates the circular background fill effect.
- Use `size={20}` for modal/panel headers, `size={14}` for inline tags / row removes.

### Verify icon mapping

The project maps Solar icons in `src/components/atoms/Icon.jsx`. Before using `solar:close-linear`, verify it is mapped. If not, add a mapping (use the lucide `X` icon as the replacement). If already mapped, just use it.

### Files to update (replace `solar:close-circle-linear` → `solar:close-linear` + new wrapper classes)

Apply to ALL of these dismiss/close buttons listed in the audit:

- `ClerkCataloguePage.jsx:334` (queue context dismiss) — small variant, `size={14}`
- `ClerkCataloguePage.jsx:457` (panel header close) — large variant, `size={20}`
- `AppShell.jsx:296` (sidebar close on mobile) — large variant
- `AppShell.jsx:603` (notification dismiss) — small variant, `size={14}`
- `AddBookFlow.jsx:55`
- `BookDetailPanel.jsx:109`
- `DevPanel.jsx:78`
- `ExportPreviewModal.jsx:66`
- `IsbnIntakeModal.jsx:108`
- `ImportModal.jsx:12`
- `NewLoanModal.jsx:324`
- `BarristerLoansPage.jsx:387` (modal header close)
- `BarristerListsPage.jsx:584`, `:2663` (modal header closes)
- `BarristerListsPage.jsx:1532` — leave the destructive-styled remove-item icon alone (Section A handles its hover); the icon itself can stay `solar:close-linear` for visual consistency.
- `HeaderSearchBar.jsx:297` (Add-to-List modal close)
- `BarristerDashboardPage.jsx:253` (dismissible alert remove) — small variant
- `AuthorityListDrawer.jsx:165` — destructive variant from Section A
- `BarristerSearchPage.jsx:442`

### Leave unchanged

- `HeaderSearchBar.jsx:187` (input-clear X inside search field) — small inline X is fine as-is.
- `BarristerLoansPage.jsx:233` (filter-input clear X) — same.
- `BarristerListsPage.jsx:2169`, `:2255` (search input clears) — same.
- `Toast.jsx:38` (toast dismiss) — different visual context; keep current.
- `Tag.jsx:15`, `FilterPill.jsx:39` — already small contextual clears.

### Acceptance

- `rg "solar:close-circle" src/` returns only matches inside the input-clear / tag-clear / toast contexts listed above.
- Hovering any modal/panel/notification dismiss shows a circular slate-100 fill behind the plain X.
- No layout shift on hover (the wrapper has consistent padding regardless of hover state).

---

## Section D — Overlay click dismisses

**Pattern**: Clicking anywhere on the modal/panel overlay (the dimmed backdrop) closes the modal/panel. Most already do this; a few don't.

### Audit + fix

For each modal/panel listed below, ensure the **outermost overlay div** has `onClick={onClose}` (or equivalent) and the inner card has `onClick={(e) => e.stopPropagation()}` so clicks inside the card don't bubble:

- `BookDetailPanel.jsx` — already has `onClick={onClose}` on backdrop (line 88). ✓
- `NewLoanModal.jsx` — verify and add if missing.
- `IsbnIntakeModal.jsx` — verify and add if missing.
- `LoanActionModal.jsx` — verify and add if missing.
- `ImportModal.jsx` — verify and add if missing.
- `AddBookFlow.jsx` — verify and add if missing.
- `ExportPreviewModal.jsx` — verify and add if missing.
- `HeaderSearchBar.jsx` Add-to-List modal — already has it (`createPortal` block, line 276). ✓
- `BarristerLoansPage.jsx` modal at line ~387.
- `BarristerListsPage.jsx` modals.
- `BarristerSearchPage.jsx` modal.

### Edge cases

- Multi-step modals (`NewLoanModal`, `AddBookFlow`, `IsbnIntakeModal`): overlay click fully closes (does NOT step backward). This matches existing X-button behavior.
- Confirmation dialogs ("Are you sure?"): overlay click acts as Cancel.

### Acceptance

- Click on dimmed backdrop in any modal/panel closes it.
- Click on the modal/panel content does not close it.
- All existing close paths (X button, Esc key if wired, Cancel button in confirmations) still work.

---

## Section E — Slide-out reverse animation on dismiss

**Problem**: Modals/panels have entrance animations (`animate-slide-in-panel`, `animate-page-in`, `motion-fade`) but no exit animations. They just disappear.

**Goal**: When dismissed, animate out in the reverse direction of entrance (e.g. a right-side panel that slid in from the right slides back out to the right).

### Add reverse keyframes

**`src/index.css`** — add three exit keyframes mirroring the existing entrances:

```css
@keyframes slide-out-right {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(100%); opacity: 0; }
}

.animate-slide-out-right {
  animation: slide-out-right 240ms ease-in forwards;
}

@keyframes page-exit {
  from { transform: translateY(0); opacity: 1; }
  to { transform: translateY(6px); opacity: 0; }
}

.animate-page-out {
  animation: page-exit 200ms ease-in forwards;
}

@keyframes motion-fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

.motion-fade-out {
  animation: motion-fade-out 200ms ease-in forwards;
}
```

### Wiring pattern

For each modal/panel, introduce a **two-phase close**:
1. User triggers dismiss (X button, overlay click, Cancel-when-applicable, Esc).
2. Component sets a `closing` state → applies the corresponding `animate-*-out` class instead of `animate-*-in`.
3. On `animationend` (or after a `setTimeout` matching the animation duration), call the parent's `onClose`.

A small custom hook makes this clean — but **per the no-new-components rule, do NOT add a hook file**. Instead, inline the pattern into each modal. Sample for a slide-in-panel:

```jsx
const [closing, setClosing] = useState(false);
const requestClose = () => {
  if (closing) return;
  setClosing(true);
  setTimeout(() => onClose(), 240);
};
// ...
<div
  className={`fixed right-0 top-0 z-50 h-screen w-[400px] overflow-y-auto bg-white shadow-xl ${closing ? 'animate-slide-out-right' : 'animate-slide-in-panel'}`}
>
  ...
</div>
<div className="fixed inset-0 z-40 bg-black/20" onClick={requestClose} />
```

Hook this up everywhere the entrance animation exists today. Match the exit class to the entrance:
- `animate-slide-in-panel` → `animate-slide-out-right` (panel slides off right edge).
- `animate-page-in` → `animate-page-out`.
- `motion-fade` → `motion-fade-out`.

### Backdrop fade

The dimmed backdrop should ALSO fade on close. Apply `motion-fade-out` to the backdrop in the same `closing` phase, or a `transition-opacity duration-200` with `opacity-0` toggled when `closing`.

### Acceptance

- Closing the BookDetailPanel slides it back out to the right (where it came from), backdrop fades.
- Closing any centered modal fades and slightly translates down (reverse of `page-in`).
- Animation is smooth on both entrance and exit; no flash, no jump.
- After exit completes, component is unmounted (parent state is updated).

---

## Section F — Loans sidebar icon fix

**Problem**: `AppShell.jsx:21` uses `solar:bookmark-square-linear` for the clerk Loans nav item, but this icon is **NOT mapped** in `src/components/atoms/Icon.jsx`. It falls back to the `CircleAlert` icon — which is why Sean sees a broken icon.

### Fix

**`src/components/organisms/AppShell.jsx`** line 21:
- Change `solar:bookmark-square-linear` → `solar:inbox-linear`.
- Rationale: `solar:inbox-linear` is mapped in `Icon.jsx`, visually distinct from `solar:book-2-linear` (Catalogue), and reads as "incoming/active items" — fitting for Loans.

### Alternative

If `solar:inbox-linear` is not available, fall back to `solar:book-bookmark-linear` (the original icon, mapped, still a "book" silhouette but with a ribbon to differentiate from Catalogue's `solar:book-2-linear`).

### Acceptance

- Loans sidebar item shows a recognizable, non-broken icon.
- The icon is clearly visually distinct from the Catalogue icon at a glance.

---

## Section G — Tab pattern parity check

**Status**: Both Catalogue and Loans use `<SegmentedTabs>` with the same container (`bg-slate-100 p-1`). Visually they should be identical.

If Sean is reporting that Loans tabs look different from Catalogue tabs:

### Investigate first

Open ClerkLoansPage in dev mode and compare to ClerkCataloguePage. Likely cause: the Loans tabs may pass `activeAccent` props (e.g. amber for Pending, red for Overdue) on each item, switching the active pill from the canonical white pill to a colored solid. Catalogue tabs pass no `activeAccent`.

### Decision

**Standardize all SegmentedTabs across the clerk side to NOT pass `activeAccent` on item entries.** The active pill must be the canonical `bg-white text-text font-semibold shadow-sm ring-1 ring-black/5` (white pill on slate-100). Tab tone communication (e.g. urgency for Overdue) lives in the **count badge color**, not the active pill background.

### Files to update

- **`ClerkLoansPage.jsx`** — `tabs` array. Remove any `activeAccent: '...'` from items. Keep `tone` for count badges if present.
- **`BarristerLoansPage.jsx`** — same. Remove `activeAccent`.
- **`ClerkChambersPage.jsx`** — verify items don't pass `activeAccent`.
- Any other page that uses `<SegmentedTabs>` — same rule.

Leave the `ACTIVE_ACCENT_CLASSES` map in `SegmentedTabs.jsx` itself alone (it's still a supported prop for other future uses); just stop passing the prop from clerk pages.

### Acceptance

- Active tab in Loans = active tab in Catalogue = white pill on slate-100 background.
- Count badges still show colored tones (red for overdue, amber for pending).
- All clerk pages with tabs have visually identical tab navigation.

---

## Execution order

1. **F** (sidebar icon) — 1-line fix, immediate visible win.
2. **G** (tab parity) — small prop removals.
3. **A** (destructive standardization) — Button variant swaps + a few inline normalizations.
4. **B** (remove redundant Cancel) — straightforward JSX removals.
5. **C** (dismiss icon + circle hover) — bulk find/replace + verify Icon.jsx mapping.
6. **D** (overlay click dismiss) — verify each modal, add missing handlers.
7. **E** (slide-out animations) — add keyframes + two-phase close on each modal/panel.

After all sections: run `npm --prefix /Users/seanlee/Desktop/CLMS/clms-app run build`. Resolve any errors. No new lint warnings vs baseline.

## Conventions checklist (per section)

- [ ] No new design tokens, no arbitrary tailwind values, 4px grid only.
- [ ] No hardcoded hex outside SVG fills.
- [ ] All new copy is English; no em dashes.
- [ ] `// TODO(api):` annotations preserved.
- [ ] Smooth transitions (`transition-colors duration-150` on dismiss buttons; the new `animate-*-out` classes for exit).
- [ ] Toast on every mutation that already had one (no regressions).
- [ ] Build passes; barrister flows untouched except where Section A/C explicitly lists barrister files.
