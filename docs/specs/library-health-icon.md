# Spec: Library Health icon should read as "health"

## Problem
`ClerkDashboardPage.jsx:294` renders the "Library Health" section with `<Icon name="solar:pulse-2-linear" />`. The shared `Icon` atom (`clms-app/src/components/atoms/Icon.jsx`) uses an explicit allowlist (`iconMap`) that maps Solar names to `lucide-react` components. `solar:pulse-2-linear` is **not** in the map, so it falls back to `CircleAlert` — the icon shows up as an alert/error glyph instead of a pulse.

The previous icon (`solar:chart-2-linear`) mapped to `TrendingDown`, which read as "analytics/decline" rather than "health". Sean wants a recognizable health indicator (heartbeat / pulse line).

## Goal
Render a real heartbeat-style icon next to the "Library Health" heading on the clerk dashboard.

## Changes required

### 1. `clms-app/src/components/atoms/Icon.jsx`
- Add `Activity` to the `lucide-react` import block (alphabetical position: between `AlarmClock` line and the rest — exact placement should follow existing alphabetical convention; insert immediately after `AlarmClock,` if alpha order is loose, or after the existing import that sits alphabetically before `Activity`). `Activity` is the lucide ECG/heartbeat-line icon — perfect semantic match for "health".
- Add a new entry to `iconMap`:
  ```js
  'solar:pulse-2-linear': Activity,
  ```
  Insert it in alphabetical position relative to neighboring `solar:` keys (between `solar:printer-linear` and `solar:qr-code-linear`, since `pulse` sorts after `printer` and before `qr`).

### 2. `clms-app/src/components/pages/app/ClerkDashboardPage.jsx`
- No change required — the page already references `solar:pulse-2-linear` at line 294. Once the map entry above is added, the correct icon will render automatically.

## Acceptance
- Open `/app` (clerk dashboard) and the "Library Health" card shows a heartbeat-line icon (lucide `Activity`), not a circle-alert glyph.
- No console warnings about unknown icon names.
- No other icon usages regress (the only consumer of `solar:pulse-2-linear` is `ClerkDashboardPage.jsx:294`).

## Out of scope
- Renaming the section, changing the section copy, or reshuffling other dashboard icons.
- Refactoring the icon map structure.
