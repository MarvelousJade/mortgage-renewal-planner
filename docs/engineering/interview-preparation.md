# Interview preparation: RenewalReady comparison freshness

These are project explanations grounded in repository evidence, not a statement
that the repository owner personally performed the implementation or investigation.
Read and run the linked code before using first-person claims. The intentional
fault was a local, controlled investigation, never a production incident.

## 30-second explanation

“RenewalReady compares Canadian fixed-rate mortgage offers without accounts. This
increment addresses a subtle correctness issue: a result could stay visible or
arrive after its inputs changed. The Angular client now invalidates results on
form edits and cancels superseded HTTP subscriptions. Browser-hosted regression
tests cover edits, delayed responses, failure and retry, and component cleanup;
a separate smoke script exercises the production frontend with the real local
Spring Boot API. It does not establish financial accuracy or customer savings.”

## Two-minute technical walkthrough

1. Inputs are owned by Angular reactive forms; loading, error and result signals
   drive presentation in `frontend/src/app/app.ts` and `app.html`.
2. Originally only add/remove cleared results. Ordinary edits did not invalidate
   them, and independent request subscriptions could still publish old responses.
3. A single valueChanges observer now invalidates every normally emitted edit,
   including structural edits. `clearResults()` cancels HTTP before clearing state.
4. Each HTTP subscription uses takeUntil for supersession, takeUntilDestroyed for
   component lifetime and finalize for loading. The order of cancellation before
   starting the next loading state avoids an old finalizer clearing new loading.
5. `afterNextRender` owns deferred scrolling, which is destroyed on invalidation.
   The client remains stateless; no new dependency, backend change or data store.
6. `comparison-freshness.spec.ts` uses HttpTestingController to deliver responses
   in controlled order. The same 20-case suite had 16 failures before repair and
   none after. A later isolated fault added one useful late-error regression;
   the delivered 21-case suite passes. Those totals are coverage, not user impact.
7. Run the independent browser harness against built assets and a private Java
   process. Explain the remaining dependency audit, accessibility and finance gaps.

## Demonstration and backup

Use the [five-minute demo and exact verification commands](comparison-freshness-verification.md).
Backup without servers/network: inspect `browser-results.png`, the source, and
`browser-smoke.json`; replay Chrome-hosted mocked HTTP tests after dependencies
are installed. Clearly call it recorded evidence or a mocked integration test,
not a live deployment demo. If Chrome is unavailable, show raw logs and trace the
minimal test case; do not claim a fresh passing browser run.

## Architecture and tradeoff questions

**Why not disable every input while loading?** That prevents correction. Explicit
invalidation permits editing and aborts observation of obsolete responses.

**Why not switchMap?** It is a good option for a unified request stream. This small
component already has an imperative submit handler; a cancellation notifier plus
lifecycle operator fits without migrating all state. If auto-comparison or multiple
request sources appear, a single switchMap pipeline may simplify ownership.

**Why not only ignore results with a request ID?** A guard can reject old responses,
but it leaves old subscriptions alive and requires guarding errors/finalizers too.
Unsubscription handles all observer callbacks. Server work may still finish.

**Why clear rather than retain old results?** The old display had no immutable input
snapshot or explicit “outdated” labeling. Removing it avoids implying it describes
the edited form. Snapshot retention could be a deliberate future comparison UX.

**What if a user changes a value then changes it back?** The result stays cleared;
we prioritize a simple invariant over caching or deep equality comparisons.

**What if an error arrives after a later success?** The local controlled-fault test
shows the obsolete error banner would appear without supersession. The canceled
subscription cannot invoke that error handler on the working implementation.

**Why no backend change?** The minimal reproductions use synthetic HTTP payloads;
state still becomes stale, isolating the bug to client ownership rather than math.
The stateless API and its existing contract remain unchanged.

**What remains risky?** Unresolved dependency advisories; duplicate-name tracking;
comparison across unequal terms; programmatic emitEvent:false; incomplete financial,
accessibility and mobile validation. Scope is state freshness, not overall readiness.

## Debugging stories

### Real source-discovered defects: BUG-FRESH-01 / BUG-FRESH-02

- **Found:** inspection of compareOffers and add/remove handling at `dfcd22c`.
- **Impact:** displayed figures or errors can describe obsolete input. No observed
  customer incident, monetary loss or adoption data exists.
- **Reproduce:** flush a valid result, change principal; or hold a response, edit
  form, then flush it. See the parameterized eight-field cases and cancellation
  cases in `comparison-freshness.spec.ts`.
- **Initially suspected:** missing form invalidation and subscription cleanup.
- **Distinguishing evidence:** rendered input events left results in the DOM;
  request.cancelled was false. Mocked data reproduces it without mortgage math.
  Add/remove cleared existing results but did not cancel pending requests,
  rejecting “clear the screen only” as a complete fix.
- **Root cause/design:** separate mutation paths updated shared signals without
  defining the lifetime of a comparison relative to the input snapshot.
- **Fix:** central invalidation, request supersession, destruction cleanup and
  render-owned scrolling; values are not reset on network/service failure.
- **Why correct:** synchronous form events unsubscribe prior observers before they
  can publish; all terminal paths release loading, and the next request starts
  only after old cleanup. Browser runtime confirms delayed-response behavior.
- **Prevention:** tests assert DOM invalidation, transport cancellation and late
  response rejection, not just setter implementation details.
- **Principle:** stale output is a correctness defect even when its arithmetic is
  internally correct. State ownership spans success, failure and cleanup paths.

### Controlled investigation: BUG-CONTROL-01

- **Provenance:** intentionally introduced on local `e7f279a`, starting from working
  `85d66a9`; not an unexpected incident or a fault shipped to users.
- **Fault:** submission cleared display but omitted cancellation; edit cancellation
  still worked. This models a plausible partial refactor.
- **Reproduce:** A pending, submit B, deliver B success, then A error.
- **Hypotheses/tools:** missing supersession versus broken edit invalidation;
  HttpTestingController and the full suite showed only two repeated-submission
  cases failed while edit cases passed.
- **Root cause:** two observers shared the error/result signals; A could publish
  obsolete failure after B completed.
- **Repair:** restore the original cancellation helper. The implementation was
  unchanged relative to the working start, so delivery integrates only the useful
  new late-error regression, not a manufactured implementation fix.
- **Evidence:** 2 failed / 19 passed with fault; 21 passed after restoration.
  Patch, logs and revisions are in the [investigation record](comparison-freshness.md).
- **Principle:** cancellation must isolate errors and finalizers as well as data.

## Testing strategy

- Existing backend calculation/context tests remain passing, but are not an
  independent financial-validation oracle.
- Angular component + real HttpClient pipeline with mocked transport tests input
  binding, DOM output, cancellation and deterministic out-of-order delivery.
- Production build validates Angular/TypeScript compilation and bundle budgets.
- CDP smoke loads production assets and uses actual Java API responses. Delay and
  503 are explicitly injected at a local proxy, not claimed as natural incidents.
- One screenshot was inspected at desktop size. No human interaction study or
  assistive-technology audit was performed. Security audit remains unfavorable.

## Defending the measurements

**Baseline?** `dfcd22c` application code, same expanded 20-case fixture suite before
and after. Baseline original three tests alone would not detect these defects.

**Fair comparison?** Same machine, installed dependency lock, Chrome and cases;
only client behavior changed. See final manifest for full SHAs, hardware, versions
and hashes. The later 21-case suite is reported separately, not a boosted total.

**Runs/sample?** One run per recorded condition; raw logs include all failures.
No percentile, throughput, latency improvement or statistical reliability claim.

**Correctness equivalence?** The fixture preserves HTTP payload semantics. No
financial output algorithm changed. Browser smoke uses the real backend, but
independent lender/finance equivalence has not been established.

**What does it prove?** Reproduction and repair of the enumerated state failures,
under deterministic browser-hosted HTTP tests, plus the listed local runtime paths.
It does not prove universal correctness, user savings, adoption, security or uptime.

## Tasks to perform personally before an interview

1. Inspect `App.clearResults()` and trace an edit from form.valueChanges to
   takeUntil, finalize and signal updates.
2. Run `npm run test:ci`; identify the repeated-submission and late-error tests.
3. Follow the disposable-worktree reproduction; observe failures yourself before
   claiming you investigated them. Do not change main or a deployment.
4. Run the five-minute demo; explain the fixed-rate/rounding boundaries in README.
5. Review dependency-audit.json and propose a separately scoped remediation plan.
6. Record what you actually did and understood. Use “The project implements…” until
   personal contribution is established; don't imply personal execution from logs.
