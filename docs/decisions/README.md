# Decision Records

A systematic record of agreed-upon decisions for the CLMS project.

## Rules

1. **Only record what has been discussed and agreed upon.** No speculation or unconfirmed content.
2. **Separate folders by feature area**: `frontend/`, `onboarding/`, future: `app/`, `infra/`, etc.
3. **Naming convention**: `<PREFIX>-<NNN>-<slug>.md` (e.g., `FE-001-framework-choice.md`)
4. **Status lifecycle**: `Proposed` → `Accepted` → `Deprecated`
5. **When a new decision supersedes an old one**: Mark the old document as `Deprecated` and reference it from the new one.

## Template

```markdown
# <PREFIX>-<NNN>: Title

**Status**: Accepted
**Date**: YYYY-MM-DD

## Problem

The problem being solved.

## Solution

The agreed-upon solution.

## Alternatives Considered

Only alternatives that were actually discussed.

## UX Flow (where applicable)

User flow description.

## Consequences

Impact and implications of this decision.
```

## Index

### Frontend (`frontend/`)
| ID | Title | Status |
|---|---|---|
| FE-001 | Framework Choice | Accepted |
| FE-002 | Design System | Accepted |

### Onboarding (`onboarding/`)
| ID | Title | Status |
|---|---|---|
| OB-001 | Auth Method | Accepted |
| OB-002 | Chambers Join | Accepted |
| OB-003 | Barrister Flow | Accepted |
| OB-004 | Clerk Flow | Accepted |
| OB-005 | First Win Strategy | Accepted |

### App (`app/`)
| ID | Title | Status |
|---|---|---|
| APP-001 | Cataloguing Approach | Accepted |
| APP-002 | Authority List Usage Types (To Be Read / Referred To) | Accepted |
| APP-003 | Search & List-Building Workflow | Accepted |
| APP-010 | Redesign Layout — Sidebar | Accepted |
| APP-011 | Three Search Paths | Accepted |
| APP-012 | Issue Cards Separation | Accepted |
| APP-013 | Implementation Priority | Accepted |
| APP-014 | Library Scope — Single Chambers, Single Library, Multiple Shelves | Accepted |
| APP-015 | Drop Location Tracking — Status-Only Visibility | Accepted |
| APP-016 | Clerk Library Unification — Catalogue + Loans → Library | Accepted |
