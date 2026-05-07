# Pre-Commit Refactor & Optimization Audit Spec

## Goal

Sean has done a long iteration session that touched many files. Before
committing, Codex should do a thorough review pass and apply safe
optimizations:

1. **Refactoring opportunities** — repeated patterns, deeply nested
   JSX, files that grew too long, helpers that should move out.
2. **Componentization** — inline JSX patterns that appear in 3+
   places and should become a shared molecule.
3. **Token consolidation** — hardcoded colors, spacing, font sizes
   that should reference existing tokens; ad-hoc utility class
   strings that duplicate token-backed alternatives.
4. **Dead code** — unused imports, unused state/props/variables,
   commented-out blocks, defunct service helpers.
5. **Lint debt cleanup** — clean up the existing baseline lint
   errors **only in files Codex touches** during this audit. Do not
   chase the entire baseline.

## Scope

### In scope (audit + apply safe changes)

- `clms-app/src/components/molecules/`
- `clms-app/src/components/organisms/`
- `clms-app/src/components/pages/app/`
- `clms-app/src/components/atoms/` (light review — atoms are mostly
  stable)
- `clms-app/src/services/`
- `clms-app/src/styles/tokens.css` and `clms-app/tailwind.config.js`
  (only if a meaningful consolidation surfaces)

### Out of scope

- Renaming public APIs that ripple beyond the touched file (would
  require coordinated changes Sean hasn't requested).
- Behavioral changes (no UX changes — this is a refactor pass, not a
  feature pass).
- Adding new tests or test infrastructure.
- Touching `clms-app/src/mocks/` data values — only if the mock
  shape itself should be cleaned up.
- Migrating to a new library/dependency.

## What to look for

### Repeated UI patterns to componentize

Common candidates from recent work:

- **Inline icon + text status pills** — patterns that look like
  `<span className="inline-flex items-center gap-1 rounded-md bg-X/Y px-2 py-0.5 text-[11px] font-medium text-Z">{label}</span>`
  appear in BookCard (status), AuthorityListCard (cases/legislation/
  books), various JADE chips, etc. Worth a small `Pill` molecule
  with `tone` / `variant` prop?
- **Borrowed by / Requested by lines** — currently inline `<p>` in
  BookCard. Could become a tiny meta-line helper if used elsewhere.
- **Section card wrappers** — `rounded-2xl bg-white p-5 shadow-sm
  ring-1 ring-black/5` appears across dashboard sections. A
  `<SectionCard>` molecule could DRY this up.
- **Empty state copy blocks** — `py-8 text-center text-sm
  text-text-muted` patterns.

Codex should propose at most **2–3** of these as new molecules and
implement only those where the gain is unambiguous (used in 3+
places, no behavior coupling). For everything else, leave as is and
mention in the report.

### Token consolidation

Look for:

- Hardcoded hex colors in JSX/className strings (should reference
  `text-brand` / `text-success` / etc.).
- Hardcoded spacing values that don't match the 4px scale (Tailwind
  scale).
- `text-[Npx]` arbitrary font sizes that match an existing
  `--font-size-*` token.
- Duplicate definitions of the same color across files (e.g. an
  emerald-700 used inline alongside `text-success`).

Where consolidation is straightforward (rename utility class to
token-backed equivalent), apply it. Where it would change visual
meaning (e.g. swapping a darker shade for a token), surface in the
report and skip.

### Dead code sweep

- Unused imports (especially after recent file edits).
- `useState` / `useMemo` / `useCallback` whose return value is never
  used.
- Props passed to components that never read them.
- `// TODO(api):` comments that have already been addressed (rare —
  most are still valid).
- Service exports that no caller imports.

Apply only if removal is *certain* (no string-based dynamic access
or external imports).

### Long-file decomposition

- Identify files over **800 lines** in the touched scope. List them
  in the report. Propose a 1-line summary of what could be
  extracted, but do **not** automatically split unless Sean
  approves — this is just a suggestion list.

## What to do

1. Walk through the in-scope folders and build a mental inventory.
2. Apply the **safe, mechanical refactors** directly:
   - Dead code removal where certain.
   - Class name swaps to existing tokens where 1:1.
   - Up to 3 new molecules where pattern is duplicated 3+ times AND
     the extraction is simple.
3. Compose a report file at `docs/refactor-audit-report.md` with:
   - Per-file summary of changes (one line each).
   - List of **proposed but not applied** refactors (long-file
     splits, semantic token renames, complex extractions) with
     rationale.
   - Lint baseline delta (before/after error count on touched files
     only).
4. Run `cd clms-app && npm run build` and report result.
5. Run `npx eslint` on every touched file — must be clean.

## Acceptance criteria

1. `npm run build` clean.
2. No new lint errors in touched files (existing baseline in
   untouched files is fine).
3. `docs/refactor-audit-report.md` exists with the format above.
4. No behavioral regressions — every page that worked before still
   works (Codex confirms by reading the JSX before/after).
5. Atomic, focused commits-worth of changes per file (so Sean can
   review in chunks if needed).

## Hard constraints

- **No cosmetic changes Sean didn't request.** Don't repaint colors,
  don't reword copy, don't swap icons, unless it's the result of a
  token consolidation.
- **No behavior changes.** No new features, no removed features.
- **No untested rewrites.** If a refactor needs verification beyond
  reading code, surface in the report and skip.
- **No data migrations.** Mock files are read-only here.

## Verification

- `cd clms-app && npm run build` — passes.
- `cd clms-app && npx eslint <list of touched files>` — clean.
- `git grep -n "TODO(api)"` count — should not increase.
- `git diff --stat` — sane shape (no surprise massive deletions).
