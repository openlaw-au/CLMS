# APP-001: Cataloguing Approach

**Status**: Accepted
**Date**: 2026-02-26

## Problem

ISBN auto-fill (copy cataloguing) provides generic publisher metadata: title, author, publisher, edition, page count, ISBN. This is sourced from WorldCat or publisher databases.

For a chambers library, this is insufficient. Barristers need to find books by:
- **Practice area** (Evidence Law, Criminal, Civil Procedure)
- **Jurisdiction** (Federal, NSW, VIC)
- **Subject headings** (hearsay, expert evidence, documentary evidence)
- **Custom tags** (internal chambers classification)

ISBN auto-fill does not provide this. The cataloguing workflow must support both fast entry and meaningful search quality.

## Solution

**Two-layer cataloguing: Copy cataloguing as starting point, RDA-based enrichment on top.**

### Layer 1: Copy Cataloguing (ISBN Auto-fill)
- Scan ISBN, auto-fill in ~30 seconds
- Populates: title, author, publisher, edition, page count, ISBN
- This is the "fast start" for clerks onboarding (S-06c, S-21)

### Layer 2: Original/Custom Cataloguing (RDA Enrichment)
- After import, the librarian/clerk can enrich each record with:
  - Practice area (multi-select)
  - Jurisdiction (multi-select)
  - Subject headings (free-text tags or controlled vocabulary)
  - Custom chambers tags
  - Location assignment (already implemented)
- Follows **RDA (Resource Description and Access)** principles: describe resources in ways that match how users search
- Enrichment is optional per-record but directly impacts search quality (S-11)

### Impact on Search (S-11)
- Enriched records enable: practice area filters, jurisdiction filters, subject browsing
- Un-enriched records are still searchable by title/author/ISBN
- Solo mode (JADE only) is unaffected

## Alternatives Considered

- **ISBN-only cataloguing**: Rejected. Search quality degrades without practice area and jurisdiction metadata. Barristers cannot browse by subject.
- **Mandatory enrichment on import**: Rejected. Slows onboarding. Copy cataloguing first, enrich later is the right trade-off.

## Consequences

- S-21 Catalogue needs an "Edit Book" view with enrichment fields (practice area, jurisdiction, subject headings, custom tags)
- S-11 Search needs filter UI for practice area and jurisdiction (when enriched records exist)
- Empty enrichment fields should show prompts encouraging the clerk to add metadata
- Bulk enrichment (select multiple books, assign same practice area) is a future consideration
