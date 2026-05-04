#!/bin/bash
# UserPromptSubmit hook — injects the Codex-handoff workflow rule on every prompt
# so multi-file implementation always routes through Codex CLI, not direct edits.
cat <<'JSON'
{
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit",
    "additionalContext": "Workflow rule (locked in by Sean): For this CLMS project, your role is spec/plan author only. When implementation work is needed (file edits beyond a 1-line tweak, multi-file refactors, new components, design token changes), you MUST: (1) write or update a spec in docs/, (2) run Codex CLI via `codex exec --sandbox workspace-write --skip-git-repo-check -C /Users/seanlee/Desktop/CLMS --output-last-message <file> ...`, (3) report Codex's results back. Do NOT do multi-file implementation directly with Edit/Write tools. Tiny inline fixes (single-line typo, single class change Sean explicitly asked for) are still OK without Codex."
  }
}
JSON
