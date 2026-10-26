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
comparison-freshness artifacts are intentionally immutable; current status will
link to this repair instead of rewriting the old audit results.
