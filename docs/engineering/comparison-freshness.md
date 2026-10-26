# Comparison freshness release

## Purpose and acceptance (planned before behavior changes)

Starting revision: `dfcd22ce6fd4e9433c58a2ae6c89110ee5b535ed` on the isolated
`worktree/clear-meadow-4d2a` branch. The other checkout is deploying; no integration
into main, push, or Render changes are part of this release.

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

Further observations, measured outcomes and controlled-fault provenance will be
recorded as executed, not inferred as runtime evidence.
