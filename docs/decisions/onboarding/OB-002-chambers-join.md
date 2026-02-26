# OB-002: Chambers Join

**Status**: Accepted
**Date**: 2026-02-26

## Problem

The process for users joining a Chambers needs to be decided. A balance between security and ease of use is required.

## Solution

**Phased approach:**

- **v1**: Auto-join. Users automatically join a Chambers via invite link or email domain matching.
- **v2**: Admin approval added as a toggle option. Chambers administrators can optionally enable a join approval workflow.

## Alternatives Considered

- **Mandatory approval from the start**: Increases onboarding friction. Could lower adoption rates in the early stage.
- **Fully open (anyone can join)**: Security concern. Verifying affiliation matters in the legal industry.

## Consequences

- v1 provides fast onboarding with simple auto-join logic
- v2 admin approval toggle requires admin dashboard features
- A Chambers administrator role concept must be included in the data model
