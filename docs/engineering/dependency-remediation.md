# Frontend dependency remediation — 2026-10-26

## Scope, baseline and acceptance (before changing dependencies)

User requested repair and documentation of the 22 npm audit findings. Baseline:
`ce9922763410fb8d7b5801f4ad38ad39e795f659`, clean worktree. Preserve application
behavior, Java/API dependencies, deployment configuration and historical evidence.
Use supported Angular 20 patch releases rather than a major migration, forced
peer resolution, advisory suppression or broad dependency overrides.

Current baseline audit reproduces 22 affected package entries: 6 moderate, 13 high,
3 critical. Production-only audit reports 4 affected entries: 3 moderate, 1 high.
These are npm package/meta-vulnerability counts, not 22 independent CVEs or 22
verified exploitable paths. In particular @angular/build inherits critical status
from piscina. No exploit against this application or production incident is claimed.
Existing 21 browser-hosted frontend tests and production build pass at baseline;
passing application tests alone did not detect the vulnerable dependencies.

Planned engineering measurement: compare full and production-only npm audit
counts against the same registry on the same day, keeping all raw reports.
Acceptance: zero reported findings in both scopes after clean npm ci, npm ls
without peer errors, frontend tests and build pass, four backend tests remain
passing, and production-build browser smoke passes against the real local Java
API. Add an isolated HTTP-only XSRF origin regression reproducing the Angular
advisory without real network traffic. Preserve before/after results and source
fingerprints; no performance, adoption, savings or general security claim.

Add a full-dependency audit gate to frontend CI so newly known findings fail rather
than being hidden by --omit=dev or an elevated severity threshold. Registry outage
also fails visibly. No push or deployment is authorized by this change.

## References reviewed before dependency changes

| Source (reviewed 2026-10-26) | Inspected evidence and decision |
| --- | --- |
| [Angular release/support policy](https://angular.dev/reference/releases) | Angular 20 is LTS through 2026-11-28 on the reviewed schedule; patch updates are low-risk but security fixes can still break compatibility. Stay on 20 for this focused repair; plan a major upgrade before support ends. |
| [npm audit documentation](https://docs.npmjs.com/cli/v11/commands/npm-audit) | Audit reports known registry advisories and meta-vulnerabilities; fix without --force stays within declared ranges; dry-run is available. No forced majors or ignored reports. Documentation fetched is CLI 11; local CLI is 12.2.0 and actual commands verify behavior. |
| [Piscina maintainer advisory](https://github.com/piscinajs/piscina/security/advisories/GHSA-67c8-pqhq-4rmx) | Prototype-pollution option inheritance can enable worker code execution if Object.prototype can already be polluted. Build-time worker dependency, not a demonstrated remotely reachable app endpoint. Upgrade rather than claiming no risk. |
| [proxy-addr advisory](https://github.com/advisories/GHSA-jqcg-44mw-7w3h) | Trust-subnet misinterpretation permits IP spoofing; patched in 2.0.8. Indirect tooling dependency; app's Java API does not use Express trust proxy. |
| [Angular XSRF advisory](https://github.com/advisories/GHSA-jfgx-762w-99vr) | Angular 20 URL-regex/browser-parser discrepancy; 20.3.34 replaces it with URL origin comparison. App uses a constant same-origin comparison URL and no account session; this limits demonstrated exposure but does not replace the dependency patch. Add transport-only regression assertions for malformed cross-origin URLs. |
| npm registry metadata | `npm view @angular/{core,build,cli}@20 version --json` and selected version peer/engine metadata retained under evidence. Latest reviewed 20.x core is 20.3.34; build/CLI are 20.3.41. Node 22.23.3/TypeScript 5.9 must satisfy selected package requirements. |

No upstream code or exploit payload module is copied. Tests use independently
written inert URLs and a synthetic cookie with mocked transport; no real request,
credentials, prototype pollution or worker execution is needed. Original source
links provide attribution/context, not a claim about this app's exploitability.

## Design and procedure

1. Record current full/production audits, complete installed dependency tree,
   compatible-update dry-run, registry metadata, baseline tests and build.
2. Reproduce the XSRF invariant with a small test before patching.
3. Raise Angular framework/compiler minimums together to the patched 20.x version,
   and CLI/build minimums to their patched 20.x release. Refresh vulnerable
   transitive versions through the normal semver resolver, with no --force.
4. Clean install from the updated lock, rerun both audits and all compatibility
   checks, then add CI auditing. Record any residual findings and investigate
   them rather than disabling the gate or silently overriding dependencies.
5. Document exact changed package paths/versions/advisory links from raw reports,
   including build/test dependencies versus browser runtime. Commit coherent work
   and integrate into local main only after verification.

Primary evidence directory: `docs/evidence/dependency-remediation/`. Historical
comparison-freshness artifacts are intentionally immutable; current status links
to this repair instead of rewriting the old audit results.

## Implemented repair and package inventory

Implementation commit: `fb449699238d6385c07f5bbcc160356715aaa215`.
Planning/baseline commit: `7dbe38a`. The final documentation/evidence commit adds
no dependency or application behavior change. Completed work is integrated into
local main; neither commits nor intentionally outdated baseline fixtures are
published or deployed by this increment.

Framework/compiler packages are aligned at 20.3.34; CLI/build are 20.3.41. Raised
manifest lower bounds, not just the lockfile, so fresh resolution cannot select the
old vulnerable Angular versions. No root dependency major migration, peer bypass,
advisory exclusion or override was used. Both GitHub Actions and Jenkins run the
new `npm run audit:dependencies` gate after npm ci, auditing development dependencies
too. CI definitions are updated; hosted CI itself was not run locally.

All 22 baseline affected package entries are accounted for below. Full advisory
URLs, exact lockfile paths, inherited meta-vulnerabilities and baseline dependency
chains are in [package-remediation.json](../evidence/dependency-remediation/package-remediation.json).
The complete [lock-version-changes.json](../evidence/dependency-remediation/lock-version-changes.json)
records all 76 changed/added/removed package paths (not 76 vulnerabilities).

| Package | Baseline audit severity | Old installed versions | Patched installed versions |
| --- | --- | --- | --- |
| @angular/build | critical (inherited) | 20.3.34 | 20.3.41 |
| @angular/cli | high (inherited) | 20.3.34 | 20.3.41 |
| @angular/common | moderate | 20.3.28 | 20.3.34 |
| @angular/forms | moderate (inherited) | 20.3.28 | 20.3.34 |
| @angular/platform-browser | moderate (inherited) | 20.3.28 | 20.3.34 |
| @angular/router | high | 20.3.28 | 20.3.34 |
| @modelcontextprotocol/sdk | high | 1.30.0 | 1.32.1 |
| body-parser | high | 2.3.0, 1.20.6 | 2.4.0, 1.20.9 |
| brace-expansion | high | 5.0.9, 1.1.18 | 5.0.12, 1.1.21 |
| engine.io | high | 6.6.9 | 6.6.11 |
| fast-uri | high | 3.1.5 | 3.1.9 |
| follow-redirects | high | 1.16.0 | 1.16.2 |
| hono | moderate | 4.13.3 | 4.13.14 |
| http-cache-semantics | high | 4.2.0 | 4.3.0 |
| ip-address | moderate | 10.5.0 | 10.7.5 |
| piscina | critical | 5.2.0 | 5.3.2 |
| proxy-addr | critical | 2.0.7 | 2.0.8 |
| qs | moderate | 6.15.3 | 6.16.1 |
| source-map-js | high | 1.2.1 | 1.2.2 |
| undici | high | 6.28.0 | 6.29.1 |
| vite | high | 7.3.6 | 7.3.7 |
| zod | high | 4.1.13 | 4.6.6 |

### Runtime versus tooling exposure

Production-only npm audit implicated Angular common/forms/platform-browser/router.
Router findings include SSR DoS; this app currently serves a client-rendered SPA
and static assets, not Angular SSR. The XSRF finding requires attacker-controlled
outgoing URLs and a token-bearing session; this app has a constant comparison URL
and no account sessions. These facts limit demonstrated exposure, not the need to
patch. Do not claim an application exploit occurred or was prevented in production.

Critical entries come from tooling: build > piscina and CLI > MCP SDK > Express >
proxy-addr. Karma also brings body-parser and socket.io > engine.io. CLI schema,
package-fetching and MCP tooling bring fast-uri, undici, hono and zod, among others.
The deployed Java service does not run these Node servers; multi-stage Docker copies
compiled static assets, not frontend node_modules, to the Java runtime. Build and
developer-machine vulnerabilities still matter and are included in remediation.

## Investigation record

### DEP-01: vulnerable locked dependencies and missing audit enforcement

Origin: baseline `ce99227`; discovered by npm audit in the preceding release and
reproduced here. Symptom: full audit 22 affected entries, including 3 critical;
production-only audit 4. Existing application tests passed, so test success was not
evidence of patched dependencies. Initial hypothesis: existing semver ranges admit
patched versions but the lock retains old ones; confirmed by registry patch metadata
and old lock versions. Root cause: known-vulnerable locked versions plus no explicit
CI audit gate. Fix: updated minimums, refreshed lock, compatibility tests and audit
step. Remaining risk: future advisories, unsupported packages and unscanned ecosystems.

First `npm audit fix --package-lock-only` after manifest edits failed ERESOLVE because
old Angular 20.3.28 peer constraints remained in the resolution. `npm ci` then failed
against that still-old lock; npm ls reported invalid versions, and audits stayed at
22/4. Explicit `npm update` of all Angular packages also failed identically. Logs
and reports are retained, not counted as successful remediation.

Rather than --force/--legacy-peer-deps, copied the updated manifest to an empty
temporary directory, ran `npm install --package-lock-only --ignore-scripts`, and
copied only the resolved lock back. npm ci then succeeded with no invalid peers,
and both audits returned zero. Tradeoff: a clean semver resolution refreshed some
unrelated-but-compatible transitives as well as security targets; all version
changes are retained and broad compatibility checks passed. No malicious input or
intentionally faulty dependency was installed for this investigation.

### DEP-02: XSRF URL parsing regression and test-origin setup

Affected dependency at baseline: @angular/common 20.3.28. Added seven tests in
`frontend/src/app/http-xsrf.spec.ts`: one same-origin token positive control and
six cross-origin cases, using synthetic cookie values, example.invalid URLs and
HttpTestingController. All transport is mocked. The browser URL parser confirms
the cross-origin fixtures actually resolve to a different origin.

Four malformed URL cases (backslashes, leading space, embedded tab, mixed slashes)
attached a token before patching. Ordinary cross-origin forms and same-origin
control passed. This distinguishes the vulnerable URL classification from a cookie
setup failure and reproduces the upstream advisory locally without token leakage
to a real server. Root cause is the old regex disagreeing with browser URL parsing;
Angular's 20.3.34 patch uses parsed-origin comparison.

First patched run passed all cross-origin cases but failed the same-origin positive
control. Hypothesis: test location setup, not token extraction, since the old
same-origin control passed. Inspection of installed patched interceptor and
MockPlatformLocation showed the new origin comparison needs a real starting URL,
while TestBed's default mock has no usable origin. Configured the public
MOCK_PLATFORM_LOCATION_CONFIG with location.href. This is a test-fixture repair,
not an application workaround or disabled XSRF protection.

Repeated the **same corrected 28-case suite** in a disposable baseline worktree:
24 passed / 4 failed. Patched dependencies: 28 passed / 0 failed. Preserved the
initial fixture runs separately. No application source patch, authentication change
or financial calculation change was necessary. The disposable baseline worktree
was removed after verification; only fixture and logs remain in the delivered tree.

To reproduce the failure without changing main (requires registry access and
CHROME_BIN configured):

```bash
git worktree add --detach ../dependency-baseline ce99227
git show fb44969:frontend/src/app/http-xsrf.spec.ts > ../dependency-baseline/frontend/src/app/http-xsrf.spec.ts
(cd ../dependency-baseline/frontend && npm ci && npm run test:ci) # 24 pass, 4 fail
```

This uses the actual old locked versions in an isolated worktree. Do not deploy
that fixture or describe this advisory reproduction as a real attack.

## Verification and reproduction

Run from repository root, with Java 21, Node 22 and Chrome available:

```bash
(cd frontend && npm ci && npm run audit:dependencies && npm audit --omit=dev && npm ls --all)
(cd frontend && npm run test:ci && npm run build)
(cd backend && ./mvnw verify)
EVIDENCE_DIR=docs/evidence/dependency-remediation CHROME_BIN=/path/to/chrome JAVA_HOME=/path/to/jdk-21 node docs/evidence/comparison-freshness/browser-smoke.mjs
JAVA_HOME=/path/to/jdk-21 node docs/evidence/dependency-remediation/summarize.mjs
```

Create an alternate existing EVIDENCE_DIR for a new browser run if preserving the
captured artifacts. The summarizer validates retained raw audit/test results,
records full source revisions/hashes/environment and generates package inventories;
it does not itself execute tests. Raw result filenames:

| Check | Result | Artifact |
| --- | --- | --- |
| Old original frontend suite | 21 pass | baseline-tests.txt |
| Same corrected expanded suite, old dependencies | 24 pass, 4 fail | xsrf-before-with-origin.txt |
| Same corrected expanded suite, patched dependencies | 28 pass, 0 fail | tests-after.txt |
| Full audit | 22 -> 0 affected package entries | audit-before.json, audit-after.json |
| Production audit | 4 -> 0 affected package entries | audit-production-before.json, audit-production-after.json |
| Clean install / valid installed tree | Pass, npm ls exit 0 | clean-install.txt, tree-after.json |
| Production build | Pass | build-after.txt |
| Backend verification | 4 pass, 0 failure/error/skip | backend-verify.txt |
| Actual built client + local Java API | 11 smoke checks pass | browser-smoke.json, browser-run.txt |
| New audit script | Exit 0 | audit-gate.txt |
| Initial patched fixture without origin | 27 pass, 1 fail (fixture defect) | tests-after-missing-origin.txt |

All records: [evidence directory](../evidence/dependency-remediation/).
[Verification manifest](../evidence/dependency-remediation/verification.json) supplies
date, OS/CPU/RAM, Node/npm/Java/Chrome and exact source hashes. Measurements are
single before/after correctness/audit checks, not timing or statistical reliability.
No business or user-savings impact measured.

### Limits and follow-up

Zero npm findings means no known registry findings in the captured dependency tree
at that date, not that the application is universally secure. No Maven/container
vulnerability scan, penetration test, Linux container build or hosted CI execution
was performed here. Public Render is not redeployed by this work. npm ci still
warns about deprecated transitive inflight/rimraf/glob and local npm 12 blocked
four unapproved lifecycle scripts; builds/tests/smoke nevertheless passed. These
warnings are retained rather than called audit findings. Do not silently approve
scripts just to remove warnings. Review test-tool replacement and Angular major
migration separately; reviewed Angular 20 LTS ends 2026-11-28.

Personal contribution: the coding agent authored/executed this work. Repository
owner contribution is unconfirmed. See the impact document for qualified claim
drafts; don't turn advisory-count reduction into prevented breaches or customer savings.
