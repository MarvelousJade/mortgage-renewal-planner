# Changelog

## Published — dependency remediation (2026-10-26)

- Patch Angular framework/compiler packages to 20.3.34 and CLI/build to 20.3.41.
- Refresh vulnerable transitive dependencies without forced peers or advisory exclusions.
- Resolve all 22 recorded npm affected-package entries, including three critical;
  full and production-only audits report zero known findings at verification time.
- Add seven XSRF origin-isolation tests; four malformed cross-origin cases reproduce
  the old dependency defect and pass with the patched dependency.
- Add full-dependency audit gates to GitHub Actions and Jenkins.
- Retain package/advisory inventory, failed update attempts, and compatibility evidence.

Published to GitHub main and deployed to Render as `e4711bb`. Hosted CI and live
browser smoke passed; see the [publication record](docs/engineering/release-publication.md).
No backend or calculation changes. The [dependency remediation record](docs/engineering/dependency-remediation.md)
retains package-level investigations and local verification.

## Published — comparison freshness (2026-10-26)

- Clear completed comparisons and obsolete errors when mortgage/offer inputs change.
- Cancel obsolete client HTTP subscriptions on edits, repeat submission and teardown.
- Preserve entered values on service/network failure and support explicit retry.
- Explain when changed inputs require another comparison with a live status message.
- Replace unowned delayed scrolling with render/lifecycle-managed scrolling.
- Add deterministic stale-result/late-error regression coverage and a production-build
  browser smoke harness using an isolated local Java API.
- Document requirements, references, investigations, verification and interview evidence.

Initially integrated locally after combined-release verification; subsequently
published and deployed in `e4711bb` together with the dependency remediation.
No calculation or API contract changes. The dependency findings recorded at that
stage were resolved in the dependency-remediation increment above; historical raw
audit evidence is preserved in the [verification record](docs/engineering/comparison-freshness-verification.md).
