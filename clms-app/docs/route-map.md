# CLMS Route Map (MVP)

## Landing and auth
- `/` landing page (role-aware)
- `/signup?role=barrister|clerk` sign-up gate (S-02)

## Barrister onboarding
- `/onboarding/barrister/lookup` chambers lookup (S-04)
- `/onboarding/barrister/fork` invite clerk or solo branch (S-05)
- `/app/search?role=barrister&mode=joined|solo` first win

## Clerk onboarding
- `/onboarding/clerk/step-1` chambers profile (S-06a)
- `/onboarding/clerk/step-2` locations (S-06b)
- `/onboarding/clerk/step-3` import/scan/skip (S-06c)
- `/onboarding/clerk/invite` member invites (S-23)
- `/app/dashboard?role=clerk` first win

## Core app
- `/app/:section` app shell sections (role-based nav)

## Compatibility aliases
- `/onboarding/lookup`, `/onboarding/fork`, `/onboarding/setup?step=`, `/onboarding/invite`
