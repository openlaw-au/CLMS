# CLMS Onboarding State Machine (Frontend Draft)

## Context
- `role`: `barrister | clerk`
- `mode`: `joined | solo`
- `wizardStep`: `1 | 2 | 3`

## Events
- `CREATE_ACCOUNT`
- `LOOKUP_FOUND`
- `LOOKUP_NOT_FOUND`
- `START_SOLO`
- `SEND_CLERK_INVITE`
- `WIZARD_NEXT`
- `WIZARD_BACK`
- `SKIP_IMPORT`
- `SEND_MEMBER_INVITES`
- `SKIP_MEMBER_INVITES`

## Transitions
- `signup --CREATE_ACCOUNT(role=barrister)--> /onboarding/barrister/lookup`
- `signup --CREATE_ACCOUNT(role=clerk)--> /onboarding/clerk/step-1`
- `lookup --LOOKUP_FOUND--> /app/search?role=barrister&mode=joined`
- `lookup --LOOKUP_NOT_FOUND--> /onboarding/barrister/fork`
- `fork --START_SOLO--> /app/search?role=barrister&mode=solo`
- `fork --SEND_CLERK_INVITE--> fork (stay, non-blocking)`
- `wizard(step-1) --WIZARD_NEXT(valid)--> /onboarding/clerk/step-2`
- `wizard(step-2) --WIZARD_NEXT(valid)--> /onboarding/clerk/step-3`
- `wizard(step-3) --SKIP_IMPORT or WIZARD_NEXT--> /onboarding/clerk/invite`
- `invite --SEND_MEMBER_INVITES or SKIP_MEMBER_INVITES--> /app/dashboard?role=clerk`
