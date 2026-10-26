# Published release verification — 2026-10-26

## Authorization, scope and identity

The user explicitly authorized pushing main, allowing Render to redeploy and
checking the live application. Both local worktrees were clean. Remote main was
`f4b47c34a7dbb239a9066766a94de0e62add85e7` before push; a normal, non-force push
published the completed release:

- Repository: https://github.com/MarvelousJade/mortgage-renewal-planner
- Visibility: public; default branch: main (confirmed with GitHub CLI)
- Release source: `e4711bbf2d8bf117c6a9f5b4d292923aac561ab4`
- Live site: https://renewalready.onrender.com
- Render service: `srv-dbfk048m7kps739d44bg`
- Render deploy: `dep-dbfnf43bc2fs7397geg0`, status live
- Render finishedAt: `2026-10-26T15:55:55.74797Z`
- CI run: https://github.com/MarvelousJade/mortgage-renewal-planner/actions/runs/40353826275

No force push, faulty-branch publication, service plan/configuration change, manual
restart, account/billing change or credential export was performed. Existing
on-commit auto-deployment handled the release. Service configuration still reports
`plan: free`; buildPlan is a separate setting, not the runtime service price.
Shared free limits/cold starts still apply; no uptime or zero-account-cost guarantee.

## Acceptance and procedure

Before exercising the live site, the public smoke script defined assertions for
HTML/assets, API health, one synthetic response against the saved baseline, invalid
API input, patched Angular version, and browser interactions. No real user data.
One smoke run was performed. The private browser's offline failure simulation
changes only that browser, not the shared service. No fault injection, traffic load
test, prototype pollution, credential-bearing request or real token leakage.

Commands (run from repository root):

```bash
git push origin main
git ls-remote origin refs/heads/main
render deploys list srv-dbfk048m7kps739d44bg --output json --confirm
gh run view 40353826275 --json status,conclusion,headSha,jobs,url
gh run view 40353826275 --log
CHROME_BIN=/path/to/chrome node docs/evidence/release-publication/check-public.mjs
```

Render logs were queried read-only for this service, starting at
`2026-10-26T15:53:50Z`, filtering `found 0 vulnerabilities` and `BUILD SUCCESS`.
Only the target service configuration was saved; other workspace services were
not added to project evidence. No authentication tokens are retained.

## Results

| Layer | Result | Evidence |
| --- | --- | --- |
| GitHub source | Release SHA present on remote main | repo.json, verification.json |
| GitHub Actions, Ubuntu | Both jobs successful; 28 frontend tests, 4 backend tests, full audit zero, production build passed | ci-current.json, ci-log.txt |
| Render Linux Docker build | npm install reported zero findings; Maven BUILD SUCCESS; deploy live on release SHA | deploy-current.json, render-audit-log.txt, render-build-log.txt |
| Service configuration | Runtime plan still free; health path /actuator/health | service.json |
| Public HTTP + real browser | All 12 grouped checks passed | public-smoke.json, public-run.txt |

The 12 grouped smoke checks cover:
1. Public HTML and all referenced JS/CSS return 200 (hashes/sizes recorded).
2. Health status is UP.
3. One fictional API comparison equals the saved baseline in every calculation
   field; generatedAt alone is excluded.
4. Invalid API principal returns 400.
5. Angular bootstraps as patched version **20.3.34**.
6. Methodology anchor navigation.
7. Default two-offer comparison renders against the real public API.
8. Editing principal removes results; re-comparison reflects $400,000.
9. Add a third offer, compare, remove one: results invalidate correctly.
10. Invalid UI balance gives feedback without a comparison request.
11. Browser-local offline failure preserves $390,000 input; retry succeeds online.
12. No uncaught JavaScript runtime exceptions.

This is programmatic desktop Chrome interaction, not a human usability study,
mobile/accessibility audit, penetration test, independent finance validation or
performance benchmark. The baseline fixture's original prebuilt provenance remains
as qualified in the earlier deployment evidence. Do not add the grouped smoke
checks to unit-test totals or convert them into a general reliability percentage.

## Evidence-only follow-up

The commit containing this record changes documentation and a standalone verification
script only. It uses `[skip render]` to avoid redeploying identical application code.
Render's official documentation was reviewed on 2026-10-26:
https://render.com/docs/deploys#skipping-an-auto-deploy. It explicitly supports this
marker for documentation-only updates. No skip-CI marker is used; normal GitHub
Actions still runs. The deployed source SHA is therefore deliberately the release
SHA above, while remote main additionally contains its publication evidence.

Historical records saying “not pushed/redeployed” describe the earlier local stages
and are superseded by this publication record; their raw evidence remains intact.
No new adoption, real-user savings, business impact or personal contribution claim
is established by publishing. The coding agent executed this release verification.
