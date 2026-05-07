# Button Hierarchy Spec — Variant System + Usage Rules

**Date**: 2026-05-06
**Status**: Proposed
**For**: Codex implementation
**Scope**: Both clerk and barrister sides. Design system rule, applies globally.

## Why

Primary brand-orange buttons are overused. Every CTA looks equally important, so nothing stands out. We need a clear three-tier visual hierarchy with rules for which variant goes where.

Current variants in `src/components/atoms/Button.jsx`:
- `primary` — solid brand orange + white
- `secondary` — slate-100 (neutral gray, **not** brand-tinted)
- `ghost` — text-only
- `danger` — bg-red-50 + text-red-700
- `danger-solid` — bg-red-600 + white

Gap: there is no light-brand variant equivalent to `danger`. That makes "primary or nothing" the only way to keep brand identity, which is why primary leaks into supporting actions.

## Decision (locked)

1. **Add a new brand-tinted variant**, mirroring the `danger` pattern.
2. **Rename current slate `secondary` → `neutral`**. Migrate all call sites.
3. **Catalogue page header**: `Add Book` becomes `primary`. The other three intake methods (`Import CSV`, `Scan ISBN`, `Paste ISBNs`) become the new soft variant.

## Out of scope

- New design tokens (we already have brand color tokens — reuse).
- Renaming `danger` / `danger-solid`.
- Onboarding wizard CTAs (already correct: forward step = primary).
- Marketing landing page (`/Users/seanlee/Desktop/CLMS/index.html`) — clerk app only.

---

## Section 1 — Variant system update

### `src/components/atoms/Button.jsx`

Update `variantClasses`:

```js
const variantClasses = {
  primary: 'bg-brand text-white hover:bg-brand-hover shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]',
  secondary: 'bg-brand/10 text-brand hover:bg-brand/15',
  neutral: 'bg-slate-100 text-text hover:bg-slate-200',
  ghost: 'text-text-secondary hover:bg-slate-100',
  danger: 'bg-red-50 text-red-700 hover:bg-red-100',
  'danger-solid': 'bg-red-600 text-white hover:bg-red-700 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]',
};
```

Note:
- `secondary` is now the brand-tinted soft variant (was slate).
- `neutral` is the slate variant (was named `secondary`).
- Existing `bg-brand` and `bg-brand-hover` tokens stay untouched.

### Verify the brand opacity utilities work

`bg-brand/10`, `bg-brand/15`, `text-brand` must already render correctly. If `tailwind.config.js` does not expose `brand` as an opacity-compatible color, fix the config so `/10` and `/15` work. Do NOT add a new color token.

---

## Section 2 — Migrate every existing `variant="secondary"` call site

The current `secondary` is slate (neutral). After Section 1, `secondary` becomes brand-tinted. Every existing call site must be reviewed and decided: stay (now brand-tinted) or change to `neutral`.

**Default migration rule**: most existing `secondary` usages today are Cancel / Back / Skip / dismiss-style actions. Those should become `neutral`. Only call sites that are meaningful supporting actions (Import / Edit / Add to / Mark / Open) stay `secondary`.

### Audit + migration

Codex must:

1. Run `rg "variant=\"secondary\"" /Users/seanlee/Desktop/CLMS/clms-app/src` and list every match.
2. For each match, decide based on the rule below and rewrite the prop:
   - Verb is **Cancel / Back / Skip / Close / Dismiss / Later / Not now** → `variant="neutral"`.
   - Verb is **Import / Scan / Paste / Edit / Open / Add to / Mark / Extend / Recall / Approve (when not the only action) / Send Reminder / View / Filter / Apply Filter / Save Draft** → `variant="secondary"` (no change literally, but visual now becomes light brand).
   - Anything ambiguous → log it in the report; default to `neutral` and flag.

3. Apply the spec's region budget (Section 4) on top — if a region already has a `primary`, supporting actions become `secondary`; if not, the region's lead action gets promoted to `primary` per the page-by-page table in Section 5.

---

## Section 3 — Variant intent rules (canonical)

Lock this table into the spec. Every future PR uses it.

| Variant | When to use | Examples |
|---|---|---|
| `primary` | The single most important commit / forward action of the visual region. | Save, Confirm, Submit, Check Out, Send, Approve (in confirmation modal), Create List, Continue |
| `secondary` | Supporting actions that still carry meaningful weight; brand-flavored. | Import CSV, Scan ISBN, Paste ISBNs, Edit, Open, Add to List, Mark Returned, Extend, Send Reminder, Recall, View Detail |
| `neutral` | True neutrals: dismiss / step back / skip. No commitment. | Cancel, Back, Skip, Close, Later, Not now |
| `ghost` | Tertiary, low-emphasis inline; menus; navigation hints. | View Details, Show More, dropdown menu items, breadcrumb links |
| `danger` | Reversible-context destructive (inline). | Delete, Remove, Discard, Reset Onboarding, Reject, Deny |
| `danger-solid` | Final-confirmation destructive (in confirmation modal). | Confirm Delete, Confirm Reject (modal CTA) |

---

## Section 4 — Region budget rules

Applies to BOTH clerk and barrister sides.

| Region | Allowed |
|---|---|
| Page header | Up to **1 primary** + N `secondary`. Never multiple primaries. |
| Modal / panel footer | **1 primary** (commit) + **1 neutral** (cancel/close). Never multiple primaries. |
| Card row inline actions | `secondary` or `ghost` only. **No `primary`.** |
| Empty-state CTA | **1 primary** (the obvious next thing). |
| Sidebar / nav | None of the variants — sidebar uses its own active-state styling. |

If a region has 4+ equivalent actions with no canonical lead (e.g. Catalogue intake), apply: **1 primary (lead) + rest secondary.** See Section 5 Catalogue rule.

---

## Section 5 — Page-by-page concrete migration

Each row below states the post-migration variant. Codex must apply these.

### Clerk side

| File | Button | Variant |
|---|---|---|
| `ClerkCataloguePage.jsx` PageHeader | `Add Book` | `primary` |
| `ClerkCataloguePage.jsx` PageHeader | `Import CSV` | `secondary` |
| `ClerkCataloguePage.jsx` PageHeader | `Scan ISBN` | `secondary` |
| `ClerkCataloguePage.jsx` PageHeader | `Paste ISBNs` | `secondary` |
| `ClerkCataloguePage.jsx` panel footer (edit mode) | `Save` | `primary` |
| `ClerkCataloguePage.jsx` panel footer (edit mode) | `Delete` | `danger` |
| `ClerkLoansPage.jsx` PageHeader | `+ New Loan` | `primary` |
| `LoanCard.jsx` (clerk role) | `Approve` | `primary` (only when alone in the row); else `secondary` |
| `LoanCard.jsx` (clerk role) | `Mark Returned` | `secondary` |
| `LoanCard.jsx` (clerk role) | `Extend` | `secondary` |
| `LoanCard.jsx` (clerk role) | `Send Reminder` | `secondary` |
| `LoanCard.jsx` (clerk role) | `Recall` | `secondary` |
| `LoanCard.jsx` (clerk role) | `Dismiss` | `neutral` |
| `LoanActionModal.jsx` | `Approve` (commit) | `primary` |
| `LoanActionModal.jsx` | `Deny` (commit destructive) | `danger-solid` |
| `LoanActionModal.jsx` | `Cancel` | `neutral` |
| `NewLoanModal.jsx` step 3 | `Check Out` | `primary` |
| `NewLoanModal.jsx` | `Back` | `neutral` |
| `NewLoanModal.jsx` | `Cancel` (if present after Section B of polish spec) | `neutral` |
| `IsbnIntakeModal.jsx` footer | `Add N books` | `primary` |
| `ImportModal.jsx` footer | `Import` | `primary` |
| `ImportModal.jsx` footer | `Cancel` | `neutral` |
| `AddBookFlow.jsx` final step | `Add Book` | `primary` |
| `ClerkChambersPage.jsx` Members tab | `Send Invite` | `primary` |
| `InviteRow.jsx` | `Resend` | `secondary` |
| `InviteRow.jsx` | `Delete` | `danger` (set in earlier polish spec) |
| `LocationRow.jsx` | `Delete` | `danger` (set in earlier polish spec) |
| `SettingsPage.jsx` save buttons | `Save Settings` | `primary` |
| `DevPanel.jsx` | `Reset Onboarding` | `danger` (set in earlier polish spec) |

### Barrister side

| File | Button | Variant |
|---|---|---|
| `BarristerListsPage.jsx` PageHeader | `+ New List` | `primary` |
| `BarristerListsPage.jsx` PageHeader | `Import` (if present) | `secondary` |
| `BarristerListsPage.jsx` PageHeader | `Export` | `secondary` |
| `BarristerListsPage.jsx` list-item row | `Edit` / `Add Pinpoint` | `secondary` |
| `BarristerListsPage.jsx` bulk actions bar | `Delete` | `danger` |
| `BarristerListsPage.jsx` confirmation modal | `Delete N lists` | `danger-solid` |
| `BarristerListsPage.jsx` confirmation modal | `Cancel` | `neutral` |
| `BarristerLoansPage.jsx` PageHeader | `Request Return` (if header CTA) | `primary` |
| `BarristerLoansPage.jsx` LoanCard (barrister role) | `Renew` | `secondary` |
| `BarristerLoansPage.jsx` LoanCard (barrister role) | `Return Now` | `secondary` |
| `BarristerLoansPage.jsx` LoanCard (barrister role) | `Request Return` | `secondary` |
| `BarristerSearchPage.jsx` result row | `Add to List` | `secondary` |
| `BarristerSearchPage.jsx` modal `Create List` | `Create` | `primary` |
| `BarristerDashboardPage.jsx` empty-state CTA | `Create your first list` | `primary` |
| `AuthorityListDrawer.jsx` footer | `Save` | `primary` |
| `AuthorityListDrawer.jsx` footer | `Cancel` | `neutral` |

### Shared

| File | Button | Variant |
|---|---|---|
| `LoginForm.jsx` | `Sign in` | `primary` |
| `SignUpForm.jsx` | `Create account` | `primary` |
| Onboarding wizard `Continue` | | `primary` |
| Onboarding wizard `Back` | | `neutral` |
| Onboarding wizard `Skip` | | `neutral` |
| `ForkChoice.jsx` role cards (if buttons) | | `primary` (one per card; cards are equivalent — keep both primary because each is the lead within its own card region) |
| `HeaderSearchBar.jsx` `Search` submit button | | `primary` (header context, sole CTA in form) |
| `HeaderSearchBar.jsx` `Create & Add` modal | | `primary` |
| `HeaderSearchBar.jsx` modal `Cancel` | | `neutral` |

If a row above is missing because that button no longer exists post-polish-spec (e.g. removed Cancel buttons), skip it.

---

## Section 6 — Hardcoded class audit

After variant migration, run:

```sh
rg "bg-brand[^-]" /Users/seanlee/Desktop/CLMS/clms-app/src --glob '!**/Button.jsx'
```

Any non-Button component using `bg-brand` directly to style a button-like element should be evaluated:
- If it's a button → replace with `<Button variant="primary">`.
- If it's a non-button decorative element (badge, icon background, indicator) → leave it.

Same for `bg-slate-100` on button-like elements — should become `<Button variant="neutral">` if applicable.

Don't refactor every chip / pill / badge. Only ones that are functionally buttons.

---

## Section 7 — Storybook updates

`src/components/atoms/Button.stories.jsx` (if present): add a story for the new `secondary` (light brand) variant and rename the existing slate-secondary story to `Neutral`. If not present, skip.

---

## Section 8 — Build + verification

After all migrations:

1. `npm --prefix /Users/seanlee/Desktop/CLMS/clms-app run build` — must pass.
2. `rg "variant=\"secondary\"" /Users/seanlee/Desktop/CLMS/clms-app/src` — every remaining match must be a meaningful supporting action (per Section 3 table).
3. `rg "variant=\"neutral\"" /Users/seanlee/Desktop/CLMS/clms-app/src` — every match must be a Cancel / Back / Skip / Close / Dismiss verb.
4. `rg "variant=\"primary\"" /Users/seanlee/Desktop/CLMS/clms-app/src | wc -l` — should be **strictly fewer** than the pre-migration count.

## Conventions checklist

- [ ] No new design tokens.
- [ ] No arbitrary tailwind values.
- [ ] All call sites use `<Button variant="...">` — no inline `bg-brand` / `bg-slate-100` styling on button-like elements.
- [ ] No copy changes; only variant prop changes (and class string update inside Button.jsx).
- [ ] Build passes.
- [ ] Both clerk and barrister flows still render and click through without visual breakage.

## Execution order

1. **Section 1** — Button.jsx variant set.
2. **Section 2** — automated audit + migrate all `variant="secondary"` to either stay or become `neutral`.
3. **Section 5** — apply per-page concrete table (overrides Section 2 where they conflict).
4. **Section 6** — hardcoded class audit.
5. **Section 8** — verify counts.
