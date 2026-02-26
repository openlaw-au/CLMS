# OB-003: Barrister Flow

**Status**: Accepted
**Date**: 2026-02-26

## Problem

A dedicated onboarding flow for Barristers is needed. Barristers must be able to find their Chambers and start collaborating with their Clerk.

## Solution

**Follows the Miro S-04 to S-05 flow:**

1. **Chambers Lookup**: Search for their Chambers
2. **Fork (branching point)**:
   - **Invite Clerk**: Send an invitation to their Clerk and begin collaboration
   - **Start Solo**: Begin using the system without a Clerk

**Core principle: No dead ends.** Every path must lead the user to a clear next step.

## UX Flow

```
[Sign Up] → [Chambers Lookup] → [Chambers Found?]
                                      ├── Yes → [Invite Clerk / Start Solo]
                                      └── No  → [Create New Chambers] → [Invite Clerk / Start Solo]
```

- Skipping the Clerk invitation is fine. Users can invite later from the dashboard.
- If a Chambers is not found, an option to create a new one is provided.

## Consequences

- Chambers search (lookup) functionality is required
- Chambers creation flow is required
- Clerk invitation email system is needed (simple email invite in v1)
- UI must ensure a "next step" exists at every branch
