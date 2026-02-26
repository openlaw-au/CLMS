# OB-004: Clerk Flow

**Status**: Accepted
**Date**: 2026-02-26

## Problem

A dedicated onboarding flow for Clerks is needed. Clerks manage the Chambers library and support Barristers.

## Solution

**Follows the Miro S-06 to S-23 flow:**

**3-step wizard:**

1. **Chambers Setup**: Confirm or join their Chambers
2. **Library Import**: Import existing book data (CSV, manual entry, etc.)
3. **Invite Barristers**: Send invitations to Barristers

**Skip is allowed** on the Import step and the Invite step.

## UX Flow

```
[Sign Up] → [Step 1: Chambers Setup]
          → [Step 2: Library Import]     ← Skip allowed
          → [Step 3: Invite Barristers]  ← Skip allowed
          → [Dashboard]
```

- A progress indicator shows the current position
- Skipped steps are re-surfaced via empty state CTAs on the dashboard

## Consequences

- A 3-step wizard UI component is needed
- CSV import functionality is required (basic format support in v1)
- Barrister invitation email system (reuses the same pattern as OB-003 Clerk invite)
- Skipped steps are re-prompted via dashboard empty state CTAs (see OB-005)
