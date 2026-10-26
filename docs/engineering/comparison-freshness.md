# Comparison freshness release

## Purpose and acceptance (planned before behavior changes)

Starting revision: `dfcd22ce6fd4e9433c58a2ae6c89110ee5b535ed` on the isolated
`worktree/clear-meadow-4d2a` branch. At planning time the other checkout was deploying, so initial delivery excluded
integration, pushes and Render changes. The integration addendum below records
local main integration authorized after that deployment work completed.

Homeowners edit offers repeatedly. A result must describe the current form, not
an earlier request. Today ordinary edits leave completed results visible, while
an in-flight response can repopulate results even after adding/removing an offer.
The existing Angular reactive form and stateless API are appropriate; no redesign
or new dependency is needed.

Required:
- Every form edit (including adding/removing offers) immediately clears results
  and obsolete errors, cancels the pending HTTP subscription, and releases loading.
- A new comparison supersedes any pending request, even via repeated submission.
- Only the current response is shown; invalid inputs send no request.
- Service/network errors preserve all entered values and allow retry.
- Component destruction releases subscriptions and pending UI work.
- A short live status explains that changed inputs require another comparison.

Verification: existing baseline suite/build, deterministic Angular HTTP regression
cases before and after repair, production build, and browser interaction where
available. Measure the number of violated freshness/lifecycle invariants on the
same synthetic cases, not timing or financial correctness. Retain all failing
and passing logs; tests use mocked HTTP, not a real lender/API. Test counts are
verification scope, not adoption or business impact.

Follow-ups: financial edge-case validation, unequal-term ranking, locally saved
scenarios, and export. Out of scope: backend calculation changes, persistence,
analytics, deployment, and lender-specific recommendations.

## References reviewed 2026-10-26

| Reference / direct URL | Observations and current relevance | Adopt / differences / limitations |
| --- | --- | --- |
| [FCAC Mortgage Calculator](https://itools-ioutils.fcac-acfc.gc.ca/MC-CH/MCCalc-CHCalc-eng.aspx) | Live Canadian government tool for borrowers; retrieved payment/prepayment inputs, term versus amortization explanations, summaries and professional-advice caveat. Current reachable tool, not a verified release date. | Keep explicit inputs, educational caveats and term context. This release improves state reliability, not calculator parity. No interactive inspection of FCAC edit behavior or internal architecture. |
| [Angular takeUntilDestroyed](https://angular.dev/ecosystem/rxjs-interop/take-until-destroyed) | Current official guidance describes component-bound subscription cleanup and explicit DestroyRef outside injection contexts. | Apply to form and HTTP subscriptions. Lifecycle cleanup alone cannot invalidate requests on edits. |
| [Angular HTTP testing](https://angular.dev/guide/http/testing) | Current official guide describes capture/flush, verification, backend and network failures. | Use HttpTestingController to assert cancellation and state. Mock integration is deterministic but cannot establish real transport/server cancellation. |
| [RxJS takeUntil](https://rxjs.dev/api/operators/takeUntil) | Fetch attempted; JavaScript-rendered body unavailable. | Not relied on as inspected evidence; operator behavior will be exercised by installed-version tests. |

No reference code/assets were copied. Links and independently authored tests/design
require no source-code redistribution attribution. FCAC content was not reused;
Angular example code was not pasted. Installed Angular 20 compatibility will be
verified locally; current online docs may describe newer versions.

### Capability comparison (observed, not parity)

FCAC has a detailed single-plan payment schedule, printable summary and prepayment
controls documented on its live page. RenewalReady has one-to-three offer cards,
five frequencies and API validation in source; it lacks a printable schedule.
Angular's references provide lifecycle/testing techniques, not a competing product.
Neither comparable financial accuracy nor equivalent maturity has been established.
Only this project's freshness behavior is under test; FCAC's freshness/reliability
was not assessed.

## Design decision

Keep signals as UI state and reactive forms as input owner. Subscribe once to
form.valueChanges using takeUntilDestroyed. Emit a cancellation notification before
clearing state on edits or new submissions; use takeUntil for each request and
finalize for loading cleanup. Destruction also unsubscribes the request. Prefer
explicit edit invalidation over disabling all inputs (which blocks correction),
automatic API calls on every keystroke (unnecessary work), or a broad state-store
migration. Cancellation stops client observation; server computation may still
finish. No retry is automatic. Preserve input values on failure.

Avoid unowned delayed scrolling: schedule scrolling after rendering with a
component-scoped Angular render callback, guarded by current comparison state.

## Journal and investigations

- Inspected README, architecture/ADR, API models, calculation implementation,
  frontend form/template/tests, dependencies, Git history/remotes and ignore rules.
  Clean baseline; no dependency directory in this new worktree.
- Installed locked frontend dependencies with npm ci. Existing three browser
  tests and production build passed; raw output in `../evidence/comparison-freshness/`.
  Java is not on PATH; backend is unchanged. Further runtime alternatives will
  be checked before handoff.
- BUG-FRESH-01 (source-discovered, affected baseline above): ordinary form edits
  never call clearResults. Suspected root cause is missing input invalidation,
  not a calculation error. Minimal reproduction: compare successfully, change
  balance; old result remains. Expected: no result until re-comparison.
- BUG-FRESH-02 (source-discovered, same baseline): subscriptions have no supersession
  or destruction cleanup. Reproduction: submit, edit or remove an offer while
  waiting, then deliver the response. Expected: canceled request/no stale result;
  suspected cause is independent subscriptions updating shared signals. HTTP
  regression tests will distinguish invalidation from merely clearing the display.

### Repair observations

Added `frontend/src/app/comparison-freshness.spec.ts` before changing behavior.
Against the baseline implementation, the expanded suite produced **16 failures,
4 passes, 0 skipped**. After repair it produced **20 passes, 0 failures, 0 skipped**.
This is one deterministic before/after run of the same synthetic assertions, not
a statistical defect-detection rate. The existing three tests remained unchanged.

BUG-FRESH-01 confirmed: HTTP flush plus rendered input event leaves the old
`#results` present before repair. All eight editable field categories reproduce
this. No backend calculation is involved, rejecting a financial-math cause.
Fix: one form.valueChanges observer owns invalidation, also covering array changes.

BUG-FRESH-02 confirmed: HttpTestingController reports request.cancelled=false
before repair on edit, add, remove, repeat submission and component destruction.
Late flush restores obsolete results. Clearing the display alone is insufficient;
tests explicitly distinguish it from cancellation. Fix: takeUntil on supersession,
takeUntilDestroyed for lifecycle, finalize for loading release. Cancel before setting
new loading=true so an old finalizer cannot release the new request's loading state.
Component-scoped afterNextRender replaces unowned setTimeout scrolling, and pending
scroll work is destroyed on edits. No API or calculation changes were necessary.
Remaining risk: client cancellation does not promise server computation cancellation.
Future programmatic edits must emit reactive form events (default behavior).

Backend verification passed on the locally discovered JDK 21.0.12.1+1, despite
Java not initially being on PATH: four tests, no failures/errors/skips. Frontend
production build passed. Browser smoke launches an isolated Java process, serves
production Angular assets, and drives installed headless Chrome via CDP without
new dependencies. Its first attempt failed at Angular bootstrap because the harness
used the package name instead of Angular's configured output directory; preserved
`browser-*-first*` artifacts show this unfavorable result. Corrected the harness to
`frontend/dist/frontend/browser`; the subsequent run passed all listed checks.

Browser checks cover launch, navigation, two/three offers, ordinary input events,
a locally delayed real API response, re-comparison, add/remove, a local injected
503 and successful retry, invalid input without a request, and no uncaught runtime
exceptions. This is programmatic interaction, not human usability testing. The
recorded 1440x1000 screenshot was visually inspected: two result cards and interest
bars are rendered without obvious clipping at that viewport. Mobile layout and
screen-reader behavior were not verified.

`npm ci` reported 22 dependency vulnerabilities (6 moderate, 13 high, 3 critical);
full npm audit JSON is retained. No automatic upgrade was applied: dependency
remediation is a separate high-priority release requiring compatibility review.
Successful builds/tests do not establish dependency security.

Fix revision: `85d66a9ab943238fcce4db029110537e37a22537`
(`fix: invalidate comparisons and cancel obsolete requests`).
### BUG-CONTROL-01: obsolete service errors overwrite current status

This fault was **intentionally introduced locally**, not discovered in production.
Invariant: an obsolete request must be unable to change results, errors or loading.
Start: verified working `85d66a9ab943238fcce4db029110537e37a22537`.
Isolated branch/worktree: `investigation/comparison-supersession` in a sibling
directory, never published or merged into the delivery branch.

Fault commit: `e7f279a` (resolve full SHA with Git); preserved patch:
`../evidence/comparison-freshness/intentional-fault.patch`. Replaced submission's
clearResults() with display/error clearing alone, leaving edit invalidation intact.
This models an incomplete refactor of the submission path.

Initial hypothesis: missing supersession lets both subscriptions remain active.
Alternative: edit invalidation broke. The full suite distinguished them: edit
cases continued to pass, while repeated submission and the strengthened obsolete
error case failed. Reproduction: submit A, submit B, flush B successfully, then
flush A with 503. Actual faulty state: current result remains, but obsolete failure
appears in the error banner. Expected: A is canceled; no obsolete error appears.
HttpTestingController showed A.cancelled=false and the obsolete error text.
The original repeat-response case also detected old results overwriting new ones.

Added a dedicated late-error regression in the isolated worktree. The run produced
**2 failures, 19 passes, 0 skipped** (raw `intentional-fault-failing.txt`). Restored
submission cancellation exactly from the verified commit; all **21 tests passed**
(`intentional-fault-repaired.txt`). Repair/test commit: `3c690af`. This repair
returns implementation to its pre-fault state. Only the additional regression
coverage and investigation evidence are integrated into the delivery branch;
there is no new implementation fix or production incident to claim here.

Prevention: test both late success and late failure, not just result clearing.
Cancellation is a state-ownership guarantee. Keep all submission invalidation in
one helper, and preserve cancellation-before-new-loading ordering. Runtime smoke
on the working implementation covers delayed real API success after edits; the
intentional repeated-submission fault was exercised in browser-hosted Angular
HTTP tests, not injected into a deployed service. Remaining limitation: the UI's
disabled submit button normally prevents repeated mouse submission; the method
still needs deterministic supersession for programmatic/reentrant callers.

### Release completion

Integrated the useful extra regression as `69e891c`. Final verification at that
revision: 21 frontend tests passed, four backend tests passed, production build
passed. The implementation source hashes match the successful CDP smoke; no
behavior changes followed that run. See [verification/demo](comparison-freshness-verification.md),
[interview preparation](interview-preparation.md) and the final evidence manifest.
The initial documentation-only commit completed isolated delivery. Main advanced
independently during that work and was not modified at that stage.
The clean investigation worktree was disposable; local commits/branch and patch
retain provenance. No broken branch was published.

### Integration addendum (2026-10-26)

After the user confirmed the deployment agent was done and requested completion,
inspected both clean worktrees and main's `f4b47c3` deployment evidence. No application
or deployment configuration had changed upstream. Merged it into the completed
branch as `35865feb9b3c9c3592bac4de5c50b9fd72ef30b3`, preserving both evidence
sections without conflicts. Repeated full frontend/backend verification and the
production-build browser smoke: 21 frontend tests, four backend tests and all 11
smoke checks passed; production build passed. Added an optional EVIDENCE_DIR override
to the smoke harness so this run does not overwrite historical artifacts.

Raw results and environment/source fingerprints are retained under
`../evidence/comparison-freshness/integration/`. Application hashes match the earlier
verified version. Integrated the completed branch into the clean main checkout
using a fast-forward; no faulty intermediate commits were included. No push,
Render setting change or new deployment was performed. The already-public deployment
is verified at the previous `dfcd22c` revision, not at this integrated release.
