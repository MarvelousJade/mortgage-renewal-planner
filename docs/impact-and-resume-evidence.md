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

Claim status: **preliminary** deployment capability only; no quantitative resume claim.
Public deployment outcome will be recorded separately after verification.

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
