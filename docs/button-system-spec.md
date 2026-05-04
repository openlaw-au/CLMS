# Button System Refactor Spec

**For**: Codex implementation
**Status**: Proposed
**Target file**: `clms-app/src/components/atoms/Button.jsx` (+ all ~50 call sites)
**Run order**: Apply AFTER `component-consolidation-spec.md` lands.

---

## Direction (from Sean)

> 주황색버튼 외에 버튼은 뉴트럴 버튼 + 텍스트 칼라로 네거티브한 액션은 빨강으로 하이라이트 되게 하자.

Three rules:
1. **Primary action** stays orange (brand fill).
2. **All other buttons** = neutral surface + text color. No orange tinting on non-primary buttons.
3. **Negative/destructive actions** = red highlight (not filled red shouting; red text/accent on neutral surface, except for the rare final-confirm step).

---

## Current variants (audit)

`clms-app/src/components/atoms/Button.jsx` exposes 7 variants:

| Variant | Current style | Verdict |
|---|---|---|
| `primary` | `bg-brand text-white hover:bg-brand-hover` | **Keep** |
| `secondary` | `border border-slate-300 bg-white text-text hover:bg-slate-50` | **Keep**, simplify |
| `tertiary` | `bg-orange-50 text-brand hover:bg-brand hover:text-white` | **Remove** — orange-tinted, conflicts with rule 1 |
| `outline` | `border border-brand text-brand hover:bg-orange-50` | **Remove** — orange-tinted, conflicts with rule 1 |
| `ghost` | `text-text-secondary hover:bg-slate-100` | **Keep** |
| `danger` | `bg-red-600 text-white hover:bg-red-700` | **Restyle** — too loud per rule 3; demote to `bg-red-50 text-red-700 hover:bg-red-100` |
| `success` | `bg-emerald-600 text-white hover:bg-emerald-700` | **Remove** — unused except in `Button.stories.jsx`. If a "confirmation success" button is needed in the future, fold into `primary`. |

Counts of current usages (from grep at spec time):
- `tertiary`: 0 occurrences in pages/organisms/molecules (only in `Button.stories.jsx`).
- `outline`: 0 occurrences in pages/organisms/molecules (only in `Button.stories.jsx`).
- `success`: 0 occurrences in pages/organisms/molecules (only in `Button.stories.jsx`).
- `danger`: 4 — `LoanCard.jsx:57`, `BookDetailPanel.jsx:235`, `LoanActionModal.jsx:32`, plus a workaround `!text-danger !border-slate-300` in `BarristerListsPage.jsx:2471`.

So removing tertiary/outline/success has zero call-site impact. Restyling `danger` softens 4 call sites — verify each is OK with the new soft style or needs the strong variant.

---

## Target variant taxonomy

Five variants total (three is the spine; two are accents):

```js
const variantClasses = {
  primary:        'bg-brand text-white hover:bg-brand-hover shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]',
  secondary:      'bg-slate-100 text-text hover:bg-slate-200',
  ghost:          'text-text-secondary hover:bg-slate-100',
  danger:         'bg-red-50 text-red-700 hover:bg-red-100',
  'danger-solid': 'bg-red-600 text-white hover:bg-red-700 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]',
};
```

### Why these five

- **`primary`** — orange filled. The single visual focus on a screen. Reserved for the *one* highest-intent action per surface.
- **`secondary`** — neutral slate fill (no border). Sean's "뉴트럴 버튼 + 텍스트 칼라". Drop the white-with-border style: it competes visually with input fields and looks dated next to the primary pill.
- **`ghost`** — for tertiary/utility actions inside dense rows (Cancel in modals, "Skip", "Back", icon-only triggers).
- **`danger`** — soft red. The default for *all* destructive actions in the regular flow (Deny, Delete, Remove, Dismiss). Reads as warning, not aggression.
- **`danger-solid`** — strong red filled. Reserved for **final-confirmation step** in destructive flows: the actual "Yes, delete forever" inside a confirm modal where the user has already made the decision and we want to mark commitment. Use sparingly — at most one per modal.

### Why not "outline" / "tertiary" / "success"

- **No orange-tinted secondary** — rule 1. If a button isn't *the* primary action, it shouldn't borrow the brand color.
- **No emerald success** — confirmation success in this app is communicated via toast + state change, not via a button color. Removing keeps the palette focused.
- **No outline** — `secondary` already differentiates clearly without using orange.

### Sizing (unchanged)

`sm | md | lg`. No change to size scale.

---

## Migration map

Codex must update every existing call site. No `variant=` left undefined.

| Today | New | Notes |
|---|---|---|
| `variant="primary"` | `variant="primary"` | No change |
| `variant="secondary"` | `variant="secondary"` | Visual style changes (neutral fill, no border) — verify no surface relies on the white-bg-border look (e.g. on top of slate panels where a border helped contrast — unlikely but check) |
| `variant="tertiary"` | `variant="primary"` or `variant="secondary"` per intent | Stories-only today, so just delete from Button.stories.jsx |
| `variant="outline"` | `variant="secondary"` | Stories-only today |
| `variant="ghost"` | `variant="ghost"` | No change |
| `variant="danger"` | `variant="danger"` (now soft) | Verify call sites: `LoanCard.jsx:57` (Deny), `BookDetailPanel.jsx:235` (Delete book), `LoanActionModal.jsx:32` (Deny in confirm modal). The first two are inline destructive — soft `danger` is correct. **`LoanActionModal.jsx:32` is the final-confirm step → upgrade to `variant="danger-solid"`.** |
| `variant="success"` | `variant="primary"` | Stories-only today |
| `BarristerListsPage.jsx:2471` `className="!text-danger !border-slate-300"` workaround | `variant="danger"` | Remove the `!important` overrides — the new soft `danger` matches the intent |

### Special case: `ClerkChambersPage.jsx:112-116`

```jsx
<Button variant={tab === 'members' ? 'primary' : 'secondary'} ...>
```

This is a **tab toggle abused as Buttons**. Migrate this to the new `SegmentedTabs` molecule (from the consolidation spec) instead of toggling Button variant. If `SegmentedTabs` has not landed yet at the time this spec runs, leave as-is and flag with a `TODO(SegmentedTabs):` comment.

### Special case: `SearchResultCard.jsx:220, 234`

```jsx
variant={returnState === 'requested' ? 'secondary' : 'primary'}
variant={loanState === 'requested' ? 'secondary' : 'primary'}
```

These conditionally toggle primary↔secondary based on action state. Behavior unchanged — verify the new neutral `secondary` still reads as "less prominent" against `primary`. (It will; slate-100 on white is clearly secondary.)

---

## Implementation steps for Codex

1. **Update `Button.jsx`**: replace the `variantClasses` object with the five-variant version above. Remove `tertiary`, `outline`, `success` keys.
2. **Update `Button.stories.jsx`**: drop the rows for removed variants. Add a `danger-solid` example noting "use only for final-confirm step".
3. **Migrate the 4 `danger` call sites** per the table:
   - `LoanCard.jsx:57` → `danger` (no change to the prop value, but visual softens automatically).
   - `BookDetailPanel.jsx:235` → `danger`.
   - `LoanActionModal.jsx:32` → `danger-solid`.
   - `BarristerListsPage.jsx:2471` → `danger` and **remove** the `!text-danger !border-slate-300` className.
4. **Search the repo** for any remaining `variant="tertiary"`, `variant="outline"`, `variant="success"` and confirm zero hits outside the stories file. If any non-stories hit exists, migrate per the table.
5. **Search for inline button-like elements** that bypass `<Button>`. Specifically look for:
   - `<button className="... bg-orange ...">` / `bg-brand` outside the `Button` atom.
   - `<button className="... bg-red ...">` outside the Button atom.
   - Any custom `rounded-full ... px-4 py-2` clones of the button shape.
   List findings (file:line + code snippet) at the end of the run **without migrating them automatically** — Sean will decide which to absorb into the Button atom.
6. **Run lint + build** from `clms-app/`. Fix breakage. Do not commit.

---

## Acceptance

- [ ] `Button.jsx` exposes exactly 5 variants: `primary`, `secondary`, `ghost`, `danger`, `danger-solid`.
- [ ] No file in `clms-app/src/` references `variant="tertiary"`, `variant="outline"`, or `variant="success"`.
- [ ] `Deny` buttons on the Loan Management list (Pending tab) render in soft red (text-red-700 on bg-red-50), not solid red — visually subordinate to the orange `Approve` next to them.
- [ ] The Deny button **inside** the deny confirm modal (`LoanActionModal`) renders solid red — it's the final commit point.
- [ ] No `!important` overrides on Button elements anywhere in the repo.
- [ ] Lint + build pass.
- [ ] Codex's report includes the inline-button audit list (step 5) for Sean to triage.

---

## Out of scope

- Icon-only floating action buttons (FAB) on individual pages — separate spec if/when needed.
- Toggle buttons / pill groups — those become `SegmentedTabs` per the consolidation spec.
- Link styling (`<a>` tags) — different concern.
