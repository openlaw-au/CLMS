# OB-005: First Win Strategy

**Status**: Accepted
**Date**: 2026-02-26

## Problem

After onboarding, users land on an empty dashboard. This empty state risks user drop-off. The first experience must guide users toward their next action.

## Solution

**Empty-state CTAs + Placeholder hints.**

- Place contextual CTA buttons in each empty section
- Use placeholder hint text to explain the value of each feature
- A full product tour (guided tour) is not needed

## Alternatives Considered

- **Full product tour (step-by-step guided tour)**: Rejected. Tour skip rates are high, and it's excessive for the limited feature set at launch.

## UX Flow

```
[Dashboard - Empty State]
├── Library section:  "Add your first book" + [Add Book] CTA
├── Members section:  "Invite your team" + [Invite] CTA
└── Activity section: Placeholder hint ("Activity will appear here")
```

- CTAs for steps skipped during onboarding are shown with priority
- Completing one action transitions that section to display real data

## Consequences

- Every major section needs an empty state design
- CTAs must link to the steps skipped during onboarding
- Empty state component should be reusable (registered in Storybook per FE-002)
