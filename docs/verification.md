# Verification evidence

## Root-path singleton correction and prepared migration

The old `demo.cafe` ID is a private path under Sanity's fixed anonymous-access rules, even in a public dataset. The active contract is now `demo-cafe` for the published singleton and `drafts.demo-cafe` for its optional draft. Studio/schema validation derive the ID from the shared constant; seed/type, public query, restore confirmation/help, tests and webhook instructions agree. No public token or legacy-ID fallback was added.

`scripts/migrate-demo-id.ts` is prepared, not executed against Sanity. Default/dry-run performs no network or writes. Future apply requires exact target consent, a process-only administrative token and an external private backup. It copies current content with `create` only, refuses existing targets, preserves original documents/history and draft status, and does not retry unknown outcomes. New document metadata is recreated. Operations documentation specifies separate execution authorization and copy-before-deploy cutover.

Observed test-first proof: the new root-ID regression failed against the old constant, and three migration behavior tests failed against the explicit implementation stub. The refusal-only test already passed against the stub and is not counted as RED proof. After implementation, the focused content/migration suite passed 9/9; after retaining the independent real-backup/state-hash probe, the migration suite passed 5/5 and full Node suite passed 28/28. Synthetic API fixtures cover current published/draft content, unknown fields, assets, collisions, read/backup failures and mutation uncertainty. No real migration or application of the administrative command was performed.

Functional verification in an external copy passed Astro checking (0 errors/warnings/hints), Studio TypeScript, the four-page static build, isolated Studio build with synthetic public IDs and no auto-updates/authentication, all 6 browser cases, and network-free migration dry-run. Direct installed CLI equivalents were used where pnpm would rewire borrowed dependency junctions. That verification exposed a local dependency-link incident: source hashes and lockfile were preserved, the owner reconstructed dependencies with offline/frozen/ignore-scripts install, and the parent confirmed zero links to verification scratch, local package resolution and 4/4 migration tests afterward. No dependency versions changed.

Independent high-risk verification found no S10 change-caused blockers: 5/5 fresh-copy probes passed, including complete real-file backups, rejected-command data hashes, create-only copying, optional drafts, token-free public loading and no mutation retries. Baseline/candidate restore CLI comparisons matched after the authorized ID substitution. The independent backup probe is retained as `tests/migration-backup-boundary.test.ts`. Live migration, hosted editor cutover, public new-ID reads and webhook propagation remain unexecuted; prior hosted authentication/restore gaps remain external, not local passes. Native review of this new correction is a separate pending outside view, not a claimed receipt.

## GitHub publication delta

Source upload is authorized for public `matiasrmb/demo-cafeteria-portfolio`, branch `feat/cafe-demo`, without changing remote `main`. Sanity/Cloudflare deployment remains unauthorized and inactive. GitHub upload is not a website deployment.

Publication observed: `git push -u origin feat/cafe-demo` succeeded for source correction commit `aee2f050bcc9308a3e33a0aa0347c966459b7884`; scoped `ls-remote` matched that SHA and confirmed `main` stayed at `064983fcc5bf62fc0b99311b7047556db470113c`. All three local commits were scanned before transfer: no strong credential/private-key pattern or excluded private/generated paths found. The latest full Node suite passed 22/22; the parent repeated the focused publication suite at 3/3 after the interruption.

The user granted native review of this publication delta. Both readability and reliability review completed, followed by exact acknowledgement (`gentle-ai.review-acknowledged/v1`, authority burned). Two non-blocking advisories note that the retained probes could assert more positive documentation requirements and exercise compilation directly. Separate actual type checking and isolated Studio build did pass; these advisories were not treated as new scope. This review does not claim coverage or completion of the original source candidate's earlier blocked native review.

The publication verifier independently passed Studio TypeScript and an isolated Studio build with synthetic public IDs, confirmed unchanged source hashes and no strong secret-pattern matches, and verified that the lint template is inactive. It reported two stale Git-publication statements in the operations guide; both were corrected together. The three publication probes are retained in `tests/publish-delta.test.ts`. No new production logic or dependencies were added. Native review of the original source candidate remains incomplete as recorded below; no receipt or approval is claimed.

This report distinguishes implementation from executed proof. External accounts have not been connected, deployed or mutated. Local functional verification passed on 2026-10-25; independent high-risk verification and native review routing are recorded separately below.

## Observed so far

- Availability/request rules: five behavioral tests failed before implementation and then five passed.
- Published-content adapter: three tests failed against stubs (one failure-policy test already passed); all four passed after implementation.
- Administrative restore: all three tests failed against stubs, then all three passed with injected network/backup doubles. No live dataset restore was performed.
- Public browser baseline: after correcting the test server's argument forwarding, all five original browser tests failed because routes/controls were absent; all five passed after implementation.
- Screenshots inspected at 390px and 1280px: warm cream/coffee/green layout, clear demo labels, no horizontal overflow. The keyboard skip link is visibly focused in the captured screenshots.
- Initial audit: 12 findings (5 high, 7 moderate), all reported Studio-tooling paths. The lock now records the four targeted patched versions; final compatibility/audit results pending below.

## Final local checks observed

Latest parent repeat after retaining the independent regression probes: `pnpm run test` passed **19/19**, and `pnpm run check` again passed both Astro and Studio type checking. The 16-test result below records the earlier full verification run before those three probes were retained.

| Command/check                                           | Result                                                                                                                                                                                 |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm install --frozen-lockfile --reporter append-only` | Exit 0; frozen install succeeds.                                                                                                                                                       |
| `pnpm run test`                                         | Exit 0; 16/16 Node tests pass.                                                                                                                                                         |
| `pnpm run check`                                        | Exit 0; Astro reports 0 errors/warnings/hints and Studio TypeScript passes.                                                                                                            |
| `pnpm run build`                                        | Exit 0; all four HTML routes and sitemap generated.                                                                                                                                    |
| `pnpm run test:e2e`                                     | Exit 0; 6/6 Chromium tests pass.                                                                                                                                                       |
| `pnpm audit`                                            | Exit 0; no known vulnerabilities reported at this check.                                                                                                                               |
| `pnpm run demo:restore --help`                          | Exit 0; dry-run default and exact apply/backup requirements documented.                                                                                                                |
| Isolated `pnpm run studio:build`                        | Exit 0; compiles with synthetic public test identifiers, empty isolated user configuration and no stored authentication token. Does not prove any live account exists or is protected. |
| Generated site inspection                               | Four route files each have one main/h1, description and noindex; sitemap/robots/headers present; 11 local asset references and none missing.                                           |
| Client boundary inspection                              | No JSON-LD/LocalBusiness, reserved test recipient, write-token marker or Sanity CLI import found in website JS.                                                                        |

The configured-recipient browser test substitutes public fictional calendar settings, checks an exception and closure, and intercepts the WhatsApp navigation with an offline response. It proves URL construction and browser navigation without contacting WhatsApp or sending a message. Restore tests use injected network and backup doubles; they do not prove a real provider mutation or Windows ACL.

The initial 12 audit findings are no longer present in this observed audit. The four exact consumer-version/API probes now pass, including TypeID CommonJS/ESM and TOML's public properties. TOML returns a null-prototype object; no plain-object prototype guarantee is assumed. No original test was disabled and no advisory was suppressed. The precise cause of earlier skipped resolution was not established and is not claimed.

## Remaining local review

- Independent verification of high-risk items 1, 2 and 5 completed in a fresh external scratch copy against baseline `2eeb153d21961f3cd734ac0426340c92ec9710b7`: no candidate-caused blockers. The verifier ran 16 existing tests and three independent probes successfully, checked exact CLI rejection/error behavior and unchanged hashes, and confirmed the project-bound template permission. Its initial scratch runner setup required adjustment; no candidate source correction was necessary.
- The three independent probes are retained as `tests/high-risk-boundaries.test.ts` rather than depending on temporary files or Git history.
- Parent spot check after the verifier and the reported usage interruption: all 16 existing tests still passed; after retaining the probes, all 19 tests and both type checkers passed. No usage-limit status is inferred from tool availability.
- Native risk assessment/review routing: blocked before START. The committed candidate requires a provider-bound intended-untracked selection for the two generated `.atl` index/cache files, but the `gentle-ai.review-intended-untracked-selection/v1` JSON definition is not supplied by the returned input or available in the installed consumer documentation. The exact selection payload was not guessed. No review lineage, candidate consent, receipt or approval was created; review mode remains on. Local functional and independent verification results remain valid, but this additional native review is not claimed complete.

## External checks not executed

- Hosted Studio signed-out protection, sole-owner membership and actual publish permissions.
- Real project/dataset IDs, CORS, webhook delivery, Pages account/build/domain and CMS-to-site propagation.
- Actual authorized WhatsApp recipient ownership/registration and user-initiated delivery.
- Live administrative reset, private backup ACLs and rollback inspection on the owner's account.

Follow [operations](operations.md) for reproducible external setup and tests. No test result authorizes publishing, a push, PR creation or a merge.
