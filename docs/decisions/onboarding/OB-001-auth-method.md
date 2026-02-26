# OB-001: Auth Method

**Status**: Accepted
**Date**: 2026-02-26

## Problem

The user authentication method must be decided. Legal professionals (Barristers, Clerks) need a secure and easy way to log in.

## Solution

**Phased approach:**

- **v1**: Email + Password authentication
- **v2**: Add social login (Microsoft first)

## Alternatives Considered

- **Magic link (email link authentication)**: Rejected. Having to check email every time creates UX friction that doesn't fit the fast-paced workflow of legal professionals.

## Consequences

- v1 requires email/password sign-up and login UI
- Password reset flow is needed
- v2 will require Microsoft OAuth integration
- Microsoft is prioritized for social login due to high Microsoft 365 adoption in the legal industry
