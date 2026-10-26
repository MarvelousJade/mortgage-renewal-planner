# Verification and demonstration: comparison freshness

## Delivered scope

See [requirements, references and investigations](comparison-freshness.md).
Implementation: `85d66a9`; additional late-error regression: `69e891c`.
The delivered branch is isolated from main's ongoing Render deployment. No push,
merge to main, deployment or external publication was performed.

## Reproduce current checks

Requirements: Node 22, npm, JDK 21, Chrome/Chromium, Maven wrapper network access
on first use. Run from repository root (Git Bash examples):

```bash
export JAVA_HOME='/path/to/jdk-21'
export CHROME_BIN='/path/to/chrome'
(cd frontend && npm ci && npm run test:ci && npm run build)
(cd backend && ./mvnw verify)
node docs/evidence/comparison-freshness/browser-smoke.mjs
```

On this Windows machine JAVA_HOME was
`C:/Users/FanSh/AppData/Local/paymentops-tools/jdk-21.0.12.1+1` and CHROME_BIN was
`C:/Program Files/Google/Chrome/Application/chrome.exe`. These are local prerequisites,
not portable checked-in configuration. The browser script launches a private local
API on a free port, serves `frontend/dist/frontend/browser`, creates a temporary
headless Chrome profile and cleans up its child processes. It never uses Render
or the existing agent's local server. The temporary port reservation has a small
release/bind race; rerun on a port collision. It writes synthetic smoke artifacts
under `docs/evidence/comparison-freshness/`; copy historical artifacts first if
preserving another run. The harness uses Node's built-in WebSocket API (Node 22).

For final evidence, commands were run separately with stdout/stderr redirected to
`final-tests.txt`, `final-build.txt`, `final-backend.txt`. Then:

```bash
node docs/evidence/comparison-freshness/record-results.mjs
```

The recorder fingerprints source/evidence and captures versions/hardware. Its
result counts are explicit transcriptions of raw logs, not a log-parsing oracle.
Review logs when changing cases; don't blindly reuse those counts for another run.
Git checkout line-ending conversion may change working-file hashes on another OS;
source commits remain authoritative. Artifact hashes describe the local captured
bytes before commit line-ending normalization.

## Recorded results

All raw artifacts: [`../evidence/comparison-freshness/`](../evidence/comparison-freshness/).
Exact revisions/environment/source hashes: `final-manifest.json`.

| Condition | Result | Evidence |
| --- | --- | --- |
| Original client, original suite | 3 pass / 0 fail / 0 skip | `baseline-tests.txt` |
| Original client, same expanded suite | 4 pass / 16 fail / 0 skip | `regression-before.txt` |
| Repaired client, same expanded suite | 20 pass / 0 fail / 0 skip | `regression-after.txt` |
| Isolated intentional fault, strengthened suite | 19 pass / 2 fail / 0 skip | `intentional-fault-failing.txt` |
| Isolated repair, strengthened suite | 21 pass / 0 fail / 0 skip | `intentional-fault-repaired.txt` |
| Delivered client, strengthened suite | 21 pass / 0 fail / 0 skip | `final-tests.txt` |
| Backend JDK 21 verify | 4 pass / 0 fail / 0 error / 0 skip | `final-backend.txt` |
| Angular production build | Pass | `final-build.txt` |
| Built client + real local Java API | All 11 listed smoke checks pass | `browser-smoke.json`, `browser-run.txt` |
| First browser harness attempt | Failed: incorrect static-root path | `browser-smoke-first-failure.json` |
| Dependency audit | 22 vulnerabilities: 6 moderate, 13 high, 3 critical | `dependency-audit.json` |

Do not add totals across runs. The fair before/after comparison is the *same 20
cases*, not baseline three versus final 21. Seventeen added cases initially, then
one late-error case, describe coverage only. Each recorded condition was run once;
this is deterministic correctness evidence, not sampled reliability or a speed
benchmark. Build/test durations in logs are incidental and not impact metrics.
The browser smoke used the implementation hashes recorded in its JSON. Later
changes only added regression coverage/documentation, not application behavior;
compare hashes in `final-manifest.json`. Screenshot inspection was rendered visual
inspection by the coding assistant at one desktop viewport, not human interaction.

## Reproduce historical failure safely

Use disposable sibling worktrees, never main or a deployed environment. Commands
below intentionally run a failing test suite; use fictional fixture data only.

```bash
# Same twenty cases against the old client (expect 16 failures).
git worktree add --detach ../freshness-baseline dfcd22c
git show 85d66a9:frontend/src/app/comparison-freshness.spec.ts > ../freshness-baseline/frontend/src/app/comparison-freshness.spec.ts
(cd ../freshness-baseline/frontend && npm ci && npm run test:ci)

# Explicitly introduced missing-supersession fault (expect 2 failures).
git worktree add --detach ../freshness-fault e7f279a
git show 3c690af:frontend/src/app/comparison-freshness.spec.ts > ../freshness-fault/frontend/src/app/comparison-freshness.spec.ts
(cd ../freshness-fault/frontend && npm ci && npm run test:ci)
git -C ../freshness-fault restore --source=85d66a9 -- frontend/src/app/app.ts
(cd ../freshness-fault/frontend && npm run test:ci) # expect 21 passing
```

Fault/repair commits are local only, not published. The exact patch and logs are
also retained on the delivery branch, so the investigation remains understandable
without publishing a broken branch. Selectively integrated only the additional
test; implementation already matched the pre-fault working version.

## Five-minute walkthrough

1. Start the API and Angular per README. Open localhost:4200. Use the default
   fictional $425,000 balance, 22-year amortization and two offers; no personal data.
2. Click **Compare my renewal offers**. Expect two cards and an interest chart.
3. Change balance to **400000**. Results disappear and “Inputs changed” prompts
   re-comparison. No comparison is sent automatically on edits.
4. Compare again. The heading uses $400,000. Add a third offer: results disappear.
   Compare three offers, then remove one: results disappear again.
5. Use DevTools network throttling for a pending request, then edit the rate.
   Expect loading to release and the old result not to appear. Throttling is a
   manual demonstration suggestion, not a separately recorded human check.
6. Enter balance **0**, submit. Expect highlighted-field feedback and no results.
   Restore a valid balance. A service failure must retain all form values.
7. For reproducible failure/retry and delayed-response demonstrations without
   touching a real service, run `browser-smoke.mjs`: its proxy inserts a clearly
   labeled local 503 and delay, then retries against the real local API.

No save/export feature was added; inputs intentionally do not survive a reload.
Nothing in this workflow is a lender quote or financial advice. The smoke harness
makes no claim that its sample outputs were independently financially validated.

## Known limitations and next release

- Dependency audit is unresolved and high priority before broader distribution.
- Local branch only: deployment/default-branch integration requires coordination
  with the deploying agent. No public Render smoke was performed in this release.
- No independent finance oracle, lender validation, user study, timing benchmark,
  adoption, workflow-time reduction or business impact measurement.
- Mobile, keyboard-only and screen-reader review remain outstanding. `role=status`
  is present, but announcement behavior was not tested with assistive technology.
- Duplicate names are allowed while existing template loops track result.name;
  stable result identity deserves follow-up. No duplicate-name fix is claimed.
- Unequal terms still receive the existing lowest-term-interest badge; the warning
  remains, but normalization/ranking across terms is outside this release.
- Form changes made with `emitEvent:false` bypass invalidation. Future callers
  must use normal form events or explicitly invalidate results.
- Cancellation stops client observation, not guaranteed server computation.
- No source history was rewritten. The two intentionally faulty/repair commits
  remain on a local investigation branch only; useful regression coverage is on
  the delivered branch. No claim that main was updated.
