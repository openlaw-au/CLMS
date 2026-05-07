# Refactor Audit Report

## Scope

Pre-commit audit reviewed the requested in-scope areas with the hard constraints from `docs/pre-commit-refactor-audit-spec.md`: safe mechanical refactors only, no behavior changes, no data migrations, no cosmetic redesigns.

## Applied Changes

- `clms-app/src/components/molecules/SectionCard.jsx`: added a shared section wrapper for the repeated `rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5` dashboard shell; consolidated `bg-white` to token-backed `bg-surface`.
- `clms-app/src/components/molecules/EmptyStateMessage.jsx`: added a shared empty-state text helper for the repeated `py-8 text-center text-sm text-text-muted` pattern.
- `clms-app/src/components/molecules/SummaryCard.jsx`: swapped the repeated card shell to `SectionCard`.
- `clms-app/src/components/molecules/BookCard.jsx`: removed certain dead code (`Badge` import, unused `iconColor` local) and consolidated the root background from `bg-white` to token-backed `bg-surface`.
- `clms-app/src/components/pages/app/BarristerDashboardPage.jsx`: replaced both dashboard section wrappers with `SectionCard`.
- `clms-app/src/components/pages/app/ClerkDashboardPage.jsx`: replaced both dashboard section wrappers with `SectionCard`; replaced the triage empty-state paragraph with `EmptyStateMessage`.
- `clms-app/src/components/pages/app/BarristerLoansPage.jsx`: replaced the library empty-state paragraph with `EmptyStateMessage`.
- `clms-app/src/components/pages/app/ClerkLibraryPage.jsx`: replaced both empty-state paragraphs with `EmptyStateMessage`.

## Proposed But Not Applied

- `clms-app/src/components/molecules/HeaderSearchBar.jsx`: `bg-[#f8fafc]` can map 1:1 to `bg-surface-muted`, but the file currently has pre-existing `react-hooks/set-state-in-effect` errors. Touching it would require a state-flow refactor, which is outside a safe mechanical pass.
- `clms-app/src/components/molecules/BookCard.jsx`, `clms-app/src/components/molecules/AuthorityListCard.jsx`, `clms-app/src/components/pages/app/BarristerListsPage.jsx`: reviewed the inline status/count pill patterns. They are visually similar, but the tone, size, icon, casing, and spacing variants diverge enough that a shared pill abstraction would risk cosmetic changes in this pass.
- `clms-app/src/components/organisms/AuthValuePanel.jsx`: reviewed the hardcoded book swatch hexes. They are decorative mockup colors rather than semantic UI tokens, so there is no clean 1:1 token consolidation.
- `clms-app/src/components/pages/app/BarristerListsPage.jsx` (2766 lines): over the 800-line threshold. Suggested future split: extract the preview/export surface and list-item editing flows into dedicated child components/hooks.
- `clms-app/src/components/pages/app/ClerkLibraryPage.jsx` (840 lines): over the 800-line threshold. Suggested future split: extract tab-specific row builders/history table logic into focused helpers/components.
- `clms-app/src/services/`: reviewed for certain dead exports/helpers. No removals were applied because the remaining exports are still referenced within the app or would need broader caller validation than this pass allows.

## Lint Baseline Delta

- Touched existing files baseline before edits: `1` error.
- Baseline issue: `clms-app/src/components/molecules/BookCard.jsx` had an unused local (`iconColor`).
- Touched files after edits: `0` errors.
- Command used after edits:

```bash
cd clms-app && npx eslint \
  src/components/molecules/SectionCard.jsx \
  src/components/molecules/EmptyStateMessage.jsx \
  src/components/molecules/SummaryCard.jsx \
  src/components/molecules/BookCard.jsx \
  src/components/pages/app/BarristerDashboardPage.jsx \
  src/components/pages/app/ClerkDashboardPage.jsx \
  src/components/pages/app/BarristerLoansPage.jsx \
  src/components/pages/app/ClerkLibraryPage.jsx
```

## Verification

- `cd clms-app && npm run build`: passed.
- Build note: Vite emitted the existing chunk-size warning for the main bundle, but the production build completed successfully.
- `TODO(api)` count in the audited scope: `70`; this pass added none.
- Worktree note: the repository was already dirty before this audit, so this pass was kept to small wrapper/helper extractions and certain dead-code cleanup only.
