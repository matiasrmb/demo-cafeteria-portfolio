# Verification evidence

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
- Native risk assessment/review routing under the user-owned review switch: pending.

## External checks not executed

- Hosted Studio signed-out protection, sole-owner membership and actual publish permissions.
- Real project/dataset IDs, CORS, webhook delivery, Pages account/build/domain and CMS-to-site propagation.
- Actual authorized WhatsApp recipient ownership/registration and user-initiated delivery.
- Live administrative reset, private backup ACLs and rollback inspection on the owner's account.

Follow [operations](operations.md) for reproducible external setup and tests. No test result authorizes publishing, a push, PR creation or a merge.
