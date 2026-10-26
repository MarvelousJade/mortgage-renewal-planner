# mortgage-renewal-planner: impact and resume evidence

Reviewed October 25, 2026. [Source-review fingerprints](evidence/resume-review-2026-10-25.json).

## Current claim readiness

**Status: unverified for impact; factual capability only.** RenewalReady compares one to three fixed-rate offers using five payment-frequency options, including lump sums and additional payments. These are product input limits/features, not measured performance, adoption or customer savings. See [README](../README.md) and [contract](api/openapi.yaml).

Problem/change: make fixed-rate offer scenarios comparable with explicit payment/interest/term-end balance calculations. No measured old/manual workflow baseline, benchmark, observed task-time study or real-world adoption artifact was found in the inspected sources. Baseline/improved measurement SHAs: not applicable. Current reviewed source SHA/hashes are in the manifest, not proof of runtime verification.

The [validation plan](product/validation-plan.md) lists targets (sessions, comparisons, returning visitors, testimonials and validation-failure rate). None is an achieved result. Do not claim reduced mortgage costs or user savings from hypothetical calculator outputs.

Personal contribution: not established by source inspection. Safe capability draft: “Provides an Angular/Spring Boot fixed-rate mortgage comparison workflow with payment schedules and server-side validation.” If confirmed personally implemented, “Built…” is suitable. No quantitative impact bullet is ready.

## Preplanned measurements

1. Engineering: define a synthetic matrix across supported frequencies, one-to-three offers, zero interest, rounding boundaries and early payoff. Save exact fixtures and expected invariants before running. Compare payment totals, principal conservation and final balances with an independently derived calculation; existing tests alone are not independent finance validation. Record disagreements, assumptions and rounding. Report case-level correctness on this labeled set, not general financial accuracy.
2. Performance: after correctness, run five repeated fixed-workload API trials on a clean local release build. Use one warm-up trial, then at least 100 serial identical requests per trial; record exact request JSON, output hash, environment and p50/p95/range. Report an absolute baseline first. A future optimization must rerun both SHAs under identical conditions and preserve complete response content.
3. Workflow: only with consenting participants, compare a reproducible fictional offer-comparison task against an explicitly defined manual spreadsheet workflow. Record steps, task success and duration; counterbalance order and preserve anonymized samples. No such study was performed here.

Existing correctness/build commands (not executed in this documentation increment):

```sh
cd backend
./mvnw verify
cd ../frontend
npm ci
npm run build
npm run test:ci
```

Acceptance before a quantitative resume claim: reproducible fixtures/commands, complete raw results, full measured SHA and runtime/tool/hardware identity, independent output checks, and limitations. Java 21/Node 22 are documented requirements; build timings would measure developer tooling rather than user/business impact. The strongest current resume content is the concrete comparison capability and transparent calculation design; outcome measurements are follow-up work.

## Render deployment increment (2026-10-26)

Scope: root Dockerfile embeds the production Angular build into the Spring Boot
static resources; free-plan blueprint and deployment instructions. No database,
calculation, account, or saving feature was added. Agent-authored deployment work
does not establish the repository owner's personal contribution.

Baseline revision: `1061cd23d3e4a80f2fc69122040c6ebac2c9afa8`, initially clean.
Delivered revision: the commit containing this section (resolve with Git).
Preplanned acceptance: [deployment plan](evidence/render-deployment-plan.md).
Raw procedure/results: [verification script](evidence/render-deployment/check.mjs),
[local HTTP results](evidence/render-deployment/local-smoke.json),
[baseline response](evidence/render-deployment/baseline-comparison.json), and build
logs in `docs/evidence/render-deployment/`. Baseline response was captured from
the pre-existing running release at 11:49:43Z, with the script's same synthetic fixture.
It is a prebuilt artifact, not a newly rebuilt baseline SHA; its precise build provenance
is unverified. Timestamp `generatedAt` is excluded from equality; all calculation
fields must match. This is one smoke fixture, not independent financial validation.

Environment: Windows, Node v22.23.3, JDK 21.0.12.1; CPU/RAM/OS and HTTP
bodies are retained in the smoke JSON. Angular production build passed. All four
backend tests passed initially, but packaging failed because the locally running
JAR was locked on Windows; that unfavorable log is retained. Repeating verification
in an isolated temporary staging directory with the built Angular assets included
passed. The native staged JAR served HTML, JS/CSS, health, and the comparison.
No Docker daemon was available locally, so Linux container correctness and
public availability remain unverified until Render builds and smoke checks pass.
No latency benchmark, adoption, workflow saving, or business outcome was measured.

Public deployment verified at 2026-10-26T12:04–12:05Z:
https://renewalready.onrender.com, service `srv-dbfk048m7kps739d44bg`,
live deploy `dep-dbfk2rei0phs73avlmp0`, source
`dfcd22ce6fd4e9433c58a2ae6c89110ee5b535ed`. Actual Linux container build
passed on Render. [Public smoke results](evidence/render-deployment/public-smoke.json)
verify HTML, referenced JS/CSS assets, health UP, and one synthetic comparison with
all calculation fields equal to the saved baseline. This does not exercise a browser
interaction or establish general financial accuracy. Actual public JVM build is in
[Render logs](evidence/render-deployment/render-logs.json); image tags are not pinned.
[Service configuration](evidence/render-deployment/render-service.json) confirms
`plan: free`; buildPlan is an independent Render build setting, not the service price.
The account's other free services share usage limits; no guarantee of zero future
account-level charges or uptime is made.

First deployment was canceled after an initial public request timed out. Git Bash
had converted the CLI health path into a Windows filesystem path during creation.
The health path was corrected using `MSYS_NO_PATHCONV=1`, and a fresh deploy was
started (the in-flight first deploy retained its original configuration).
[First public attempt](evidence/render-deployment/public-smoke-first-attempt.json)
and [deploy records](evidence/render-deployment/render-deploys.json) retain the
unfavorable attempt and subsequent success. This is not a measured recovery-time claim.

Claim status: **verified** public deployment capability on the stated revision/date;
no quantitative impact or personal-contribution resume claim is supported.

## Comparison freshness increment (2026-10-26)

**Status: verified local engineering behavior; unverified user/business impact.**
No actual resume was changed. Purpose: prevent mortgage results and errors from
representing inputs that have since changed. No financial algorithm, API contract,
Render setting, persistence or account feature changed.

### Planned measurement and provenance

Requirements/measurement plan were committed before behavior changes in `9125249`.
Baseline application revision: `dfcd22ce6fd4e9433c58a2ae6c89110ee5b535ed`.
Implementation revision: `85d66a9ab943238fcce4db029110537e37a22537`.
Additional regression revision: `69e891c` (full SHA in final manifest).
Final application source is unchanged from the implementation revision; its hashes
match the successful smoke record. The later commit adds a test only.
Initial delivery was isolated on `worktree/clear-meadow-4d2a`. After the deployment
agent finished, the user authorized completion: main's deployment evidence at
`f4b47c3` was merged as `35865feb9b3c9c3592bac4de5c50b9fd72ef30b3`, and the
completed release integrated into local main. Repeated verification passed 21
frontend tests, four backend tests, the production build and 11 local browser smoke
checks. [Integration evidence](evidence/comparison-freshness/integration/verification.json)
retains source hashes, environment and raw logs separately from earlier runs.
No push/redeployment was performed. Public deployment evidence above applies to
`dfcd22c`, not the new frontend; no new public-availability claim is made.

Exact environment, full revisions and hashes: [final manifest](evidence/comparison-freshness/final-manifest.json).
Raw inputs are the synthetic HTTP fixture and eight-field edit table in
`frontend/src/app/comparison-freshness.spec.ts`; generatedAt/amounts are fictional
transport data, not a finance oracle. Before/after used identical 20-case suites
on Windows, Node 22.23.3, locked Angular/RxJS dependencies and headless Chrome 156.
One recorded run per condition; no cache/timing comparison. No latency or workload
performance claim. Exact commands, limitations and historical reproductions:
[verification record](engineering/comparison-freshness-verification.md).

### Supported outcomes

| Category | Evidence-supported result | Limits |
| --- | --- | --- |
| Engineering correctness | Same expanded suite: 16 failing/4 passing before, 0 failing/20 passing after. Eight editable field categories invalidate completed results; edit/add/remove/repeated submit/destroy paths cancel pending observation. | Deterministic synthetic cases only; counts describe verification scope, not general defect detection or real-user reliability. No percentage impact claim. |
| Engineering hardening | One intentionally introduced missing-supersession fault yielded 2 failing/19 passing tests; restoring working code yielded 21 passing. Integrated one additional obsolete-error regression, no new implementation fix. | Local isolated branch; not a production incident. See explicit provenance in investigation. |
| Runtime verification | Production Angular build and four backend tests passed; all 11 listed CDP smoke checks passed with the real private local Java API. | Local smoke only; proxy delay/503 synthetic; first harness run failed due to wrong asset root and is retained. No Render verification. |
| Workflow | Editing remains possible during requests; failure/retry preserves values. | Capability observed, not a measured reduction in task time or steps. |
| Real-world impact | None measured. | No adoption, savings, revenue, production capacity or user-outcome evidence. |
| Security | npm audit reports 22 advisories: 6 moderate, 13 high, 3 critical. | Unresolved; dependency remediation requires a separate compatibility-reviewed change. |

### Candidate claims and contribution scope

1. **Verified project capability:** “Hardened an Angular mortgage comparison workflow
   with input-driven invalidation, HTTP supersession and lifecycle cleanup; verified
   edit, retry and delayed-response behavior with browser-hosted regression tests
   and a local Spring Boot smoke test.” Support: `85d66a9`, `69e891c`, regression
   logs, browser smoke JSON. No measured user impact. First-person/action wording
   is suitable only after the owner confirms implementation contribution; otherwise
   say “The project implements…”.
2. **Verified testing capability:** “Added deterministic HTTP regression coverage
   for stale mortgage comparisons, including late successes, obsolete service
   errors and component teardown.” Support: the spec and controlled investigation
   logs. This does not establish who personally authored or ran the tests.
3. **Preliminary quantitative engineering draft:** “Resolved 16 failing cases in a
   fixed 20-case local browser regression suite by invalidating stale inputs and
   canceling obsolete HTTP subscriptions.” Same-case raw logs support the numbers;
   this is correctness/verification scope, not business impact. Prefer the first
   two capability claims unless the narrowly synthetic qualification fits.

The coding agent executed and authored this increment. The repository owner's
personal implementation/debugging experience is **not established** by these logs.
The interview guide includes tasks to inspect/run personally before making such
claims. No customer-savings, productivity or performance-improvement bullet is ready.

## Measurement policy for future changes

Choose one or two useful metrics during planning and record acceptance criteria before implementation. Measure the old version first; for new functionality use an initial implementation or a defined manual workflow. Compare equivalent inputs, environments and required outputs. Without a defensible comparator, report an absolute result. Test totals, lines of code and commits are verification/scope evidence, not user impact.

For every experiment record metric/value, rationale, baseline and delivered source commits (or explicitly unknown/not applicable), date, OS, CPU/RAM, tool versions, dataset origin/hash/size and whether synthetic/demo/real, exact commands, repetitions, warm-up and cache state, all raw results, summary statistics and correctness checks. Record limitations, confounders and unfavorable runs. Repeat timings enough to distinguish variation; normally start with at least five paired trials and increase if variation warrants it. Keep cold and warm cache comparisons labeled and separate from code improvements.

Reduction = (baseline - improved) / baseline * 100. Speedup = baseline time / improved time. Use percentage points for differences between rates. Do not average incompatible workloads, mix source revisions, select only favorable samples or turn a reciprocal of latency into sustained throughput.

Separate engineering results (performance/correctness/recovery), workflow results (observed task time/manual steps) and real-world impact (observed adoption/user/business outcomes). Synthetic experiments support engineering claims only. Do not invent hours saved, customers, revenue or production capacity.

Each candidate claim must record problem/baseline, change, measured result, supporting commits/artifacts, conditions/limitations, verified personal contribution, proposed bullet and status **verified**, **preliminary** or **unverified**. Project results do not establish who personally implemented or executed the work. Use first-person implementation verbs only when contribution is independently known; otherwise use the capability wording below. Record confirmed personal work separately.

Before handoff trace every number to evidence, check applicability to the delivered tree, identify the strongest two or three results and mark remaining validation. Prepare draft bullets here; change an actual resume only when requested under the current resume instructions.

### Record template

| Field | Required record |
| --- | --- |
| Problem / value / category | Why this metric matters; engineering, workflow or real-world |
| Baseline / improved revision | Full SHAs; dirty state and source hashes; use N/A if no comparator |
| Environment / date | OS, CPU/RAM, runtime/compiler/dependency versions |
| Dataset | Origin, hash, size, characteristics; synthetic/demo/real |
| Procedure | Exact commands/steps; repetitions; warm-up/cache; condition order |
| Raw evidence / summary | Every sample/artifact; median/range/p95 as appropriate |
| Arithmetic / correctness | Explicit calculation; equivalent required outputs |
| Limitations | Noise, missing metadata, uncontrolled factors, negative results |
| Contribution / bullet / status | Actual personal work, supported wording, validation still needed |
