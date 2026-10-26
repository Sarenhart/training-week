# Plan tests (2026-10-26)
Node scripts that run the DEV plan builder (onboarding + generator blocks from ../training-week-dev/index.html) without a browser.
- `node tools/qa/targets.js` – 30 hand-picked users (profiles.js) vs the app's own weekly-set targets (programme-rules.md B).
- `node tools/qa/compact.js S|B|C` – per-phase summary (minutes, weekly sets, balance/cardio minutes).
- `node tools/qa/rules.js 1000` – rule checks over random users (safety swaps, age rules, home kit, time, supersets…).
- `node tools/qa/cardiomin.js` – weekly cardio minutes (WHO counting) for the Cardio test users.
Report: claude/plan-test-report.md in the Workout App project.
