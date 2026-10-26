# Changelog

## Unreleased — comparison freshness (2026-10-26)

- Clear completed comparisons and obsolete errors when mortgage/offer inputs change.
- Cancel obsolete client HTTP subscriptions on edits, repeat submission and teardown.
- Preserve entered values on service/network failure and support explicit retry.
- Explain when changed inputs require another comparison with a live status message.
- Replace unowned delayed scrolling with render/lifecycle-managed scrolling.
- Add deterministic stale-result/late-error regression coverage and a production-build
  browser smoke harness using an isolated local Java API.
- Document requirements, references, investigations, verification and interview evidence.

Integrated into local main after combined-release verification. Not pushed or
redeployed; the public Render deployment remains the previously verified revision.
No calculation or API contract changes. Dependency advisories remain unresolved;
see the [verification record](docs/engineering/comparison-freshness-verification.md).
