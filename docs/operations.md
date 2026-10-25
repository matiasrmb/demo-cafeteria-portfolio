# Run, edit and publish the fictional café demo

The website is a static Astro build. Sanity Studio is a separate, provider-authenticated editor. There is no reservation backend, visitor database, custom authentication or public reset endpoint. External accounts have not been configured or accessed by this implementation.

## Local website

Use Node 24.15.0 and pnpm 11.1.3:

```sh
pnpm install --frozen-lockfile
pnpm run check
pnpm run test
pnpm exec playwright install chromium
pnpm run test:e2e
pnpm run build
pnpm run dev
```

Open the address printed by Astro (normally `http://127.0.0.1:4321`). `pnpm run preview` serves the generated build. Browser tests use a separate managed development server on port 4327 and never reuse an existing listener. Test screenshots/errors go outside the repository under the system temporary directory's `opencode/cafe-browser-*` folders. There is no lint configuration; type checking and functional tests are provided instead.

The empty repository needed no migration from another package manager. `pnpm-lock.yaml` is the sole package lock. React is required only by Sanity Studio; the public site uses semantic HTML, CSS and one isolated TypeScript calendar module. SVG illustrations are original and carry a separate asset license under `public/images/`.

## Configuration

The website works with local fictional content and a blank WhatsApp recipient without accounts. You may create a private local `.env` from `.env.example` yourself. Never commit it or paste its contents into chat. The existing OpenCode secret-file policy remains active; only the exact `.env.example` template has a project-local `ask` exception.

| Variable                   | Scope                   | Meaning                                                                                                                                                                             |
| -------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CONTENT_SOURCE`           | Website build           | `demo` (default) or `sanity`; an unavailable configured CMS fails the build, never silently falls back.                                                                             |
| `SITE_URL`                 | Website build           | Approved HTTPS deployment origin; fallback `.invalid` is intentionally not a real business/domain. Cloudflare's `CF_PAGES_URL` is also supported.                                   |
| `SANITY_PROJECT_ID`        | Website build/admin CLI | Public project identifier.                                                                                                                                                          |
| `SANITY_DATASET`           | Website build/admin CLI | Public dataset containing only fictitious, publishable content.                                                                                                                     |
| `SANITY_STUDIO_PROJECT_ID` | Studio build/dev        | Same public project identifier.                                                                                                                                                     |
| `SANITY_STUDIO_DATASET`    | Studio build/dev        | Same dataset.                                                                                                                                                                       |
| `SANITY_WRITE_TOKEN`       | Admin process only      | Short-lived credential permitted to read drafts and replace the two demo documents. Never a `PUBLIC_` or `SANITY_STUDIO_` variable. Never required by the website or Studio bundle. |
| `PRIVATE_BACKUP_DIR`       | Operator's shell only   | Existing private directory outside this repository, used in the command below; not read automatically by the website.                                                               |

Website configuration reads local `.env` on the build machine and normal host environment variables. Existing environment values take precedence. Do not add secrets to public-prefixed variables, source files, screenshots, build output or public CMS documents. The project/dataset identifiers are not credentials. The recipient is intentionally public contact data when configured: it must be an owner-authorized destination, not a visitor's private number.

## Set up owner-only Sanity editing

These steps require the owner's account and explicit external setup; they have not been performed here.

1. Create/select a Sanity project and a public dataset for fictional content only. Keep only the demo owner in an editing/Administrator role; remove other editing memberships. A public dataset permits public reads, not anonymous writes. Free-plan roles and account policies are owned by Sanity, not this frontend.
2. Set the two `SANITY_STUDIO_*` identifiers in the Studio process environment. Run `pnpm run studio:dev`. The Studio runs separately, normally at `http://127.0.0.1:3333`.
3. Sign in through Sanity's authentication. The native singleton `demo.cafe` supplies the initial fictional content. Publish it after reviewing every field. The editor disables duplicate/create paths for the singleton and hides delete as a safety aid; those UI restrictions are NOT an authorization boundary.
4. If required, allow only the exact local and hosted Studio origins in Sanity CORS settings, with credentials only for trusted Studio origins. Do not enable credentialed wildcard origins. Server-side website builds do not need browser CORS access.
5. The owner can deploy Studio with `pnpm run studio:deploy` after choosing the hosted Studio URL and authorizing publication. No such command was executed by this implementation. Hosted Studio serves a login-capable SPA publicly; content mutation requires authenticated project membership. It is not a custom `/admin` route on the café website.
6. In a signed-out/private window, verify that content cannot be edited. Sign in as the sole owner and verify publish access. Test a non-editor account if available. Account membership and hosted authentication cannot be proved by a local compilation.

### Editable content

The singleton includes all presentation text, menu categories/products/descriptions/integer CLP prices, hero/product images with alternative text, fictional quotes, event sections, contact text, WhatsApp recipient, weekly rules, booking horizon, date closures and date exceptions.

Category codes are stable identifiers. Use the category's visible code in each product's Category code field. Changing a category code requires updating its products; document validation rejects broken associations and duplicate codes. Quotes are always visibly identified as fictional by the website, independently of their CMS text.

Upload only original or properly licensed illustrative JPEG/PNG/WebP/AVIF images. The website builds allowlisted Sanity CDN URLs from image references, requests bounded sizes and supplies dimensions/alternative text. No arbitrary remote image URL field is exposed. Keep originals appropriately sized to provider quotas.

The recipient must contain valid international digits only, with no `+`, spaces, parentheses or hyphens. There is no invented default. Numbering-plan validation cannot prove ownership, WhatsApp registration or successful delivery; the owner must verify those externally. Missing or malformed configuration never produces a `wa.me` link.

## Calendar behavior and privacy

- All date/time calculations use `America/Santiago`, including past-slot filtering and the rolling 1–180 day horizon.
- One opening interval per weekday; omitted weekdays are closed. No overnight ranges. Slots must end by closing time.
- Closed dates win over exceptions. An open date exception replaces every weekly setting for that date, including interval and both example capacities.
- Table and group/event capacities are different example maxima, not remaining operational inventory. No capacity is decremented, blocked or stored.
- The name, date, time, quantity and type exist only in the current page's transient form/DOM. No local/session storage, cookies, request submission or CMS mutation is used. History restoration clears transient personal fields.
- Validation enables review only for a valid selection. The link is removed again if fields change. A configured valid recipient is required to expose an outgoing link.
- Opening WhatsApp passes the URL-encoded request to that external service for preparation. The visitor must review and send it there. Nothing is automatically sent to the recipient or confirmed as a reservation. WhatsApp/provider privacy policies then apply.

## Website build and Cloudflare Pages

Local demo mode does not query Sanity. For CMS mode set `CONTENT_SOURCE=sanity` and the matching public IDs, then build. Queries use a fixed API version, the published perspective, the one published singleton and a bounded timeout, without any authentication token. An invalid/missing document fails the build. No drafts, credentials or visitor submissions belong in website content.

After the owner explicitly authorizes external repository/hosting setup:

1. Connect the chosen Git repository to a Cloudflare Pages project. This local repository has not been pushed or connected to any remote by this work.
2. Configure root directory `/`, Node `24.15.0`, pnpm `11.1.3`, build command `pnpm run build`, output `dist`. Set host variables `NODE_VERSION` and `PNPM_VERSION` as supported by the selected Pages build image, and the public build configuration above. Verify the build log actually used those versions.
3. Build/install this workspace from the frozen pnpm lockfile. Review the latest audit output before external deployment; successful installation alone is not security proof.
4. Set `SITE_URL` to the approved HTTPS origin. Review the four HTML routes, sitemap, images, headers and browser console on the resulting preview before using a custom domain.
5. Create a Pages Deploy Hook for the intended branch. Its URL is a bearer secret: keep it only in the provider dashboards, not Git, client code, public Sanity documents or screenshots.
6. Create a Sanity GROQ webhook for the same dataset. Use POST, select publish/create/update/delete as appropriate for the published singleton, filter `_type == "cafeDemo" && _id == "demo.cafe"`, and a minimal `{}` projection. Use the private Pages Deploy Hook as its destination. Do not trigger on drafts, assets or unrelated documents. Validate the provider's actual filter behavior after setup.
7. Publish an innocuous fictional heading change. Confirm webhook delivery, a new Pages build/deployment, and the changed heading on all relevant deployed pages. Unpublish/delete cases should fail a CMS-mode build rather than silently replace content with stale local data.

This is a provider-to-provider webhook integration, not a new backend. Website reads happen during build; publication is not instantaneous. Propagation includes webhook delivery, build queue, build/deploy duration and CDN update, with no guaranteed delay promised. If the hook fails, the previous static deployment remains visible; repair the provider configuration and trigger an authorized rebuild. Check provider delivery logs without exposing hook URLs or tokens.

## Administrative seed restore

The command lives under `scripts/`, is never shipped as a public route or button, and defaults to a network-free dry run. It targets only `demo.cafe` and `drafts.demo.cafe`, not a whole dataset.

1. Pause Studio editing/publishing and ensure the owner controls the target dataset. Concurrent edits can otherwise be overwritten; this is not a multi-editor locking system.
2. Create a private backup directory outside the repository. On Windows, restrict its NTFS ACL to the operator; POSIX file modes alone do not enforce Windows privacy. The command resolves symlinks/canonical paths and refuses a backup inside the repository.
3. Supply public IDs and a suitably scoped `SANITY_WRITE_TOKEN` only to this administrative process via a secure local secret mechanism. Do not type the token into shell history, put it in `.env.example`, share it, or make it a public-prefixed variable. Revoke it after the operation.
4. Preview:

```sh
pnpm run demo:restore --help
pnpm run demo:restore --dry-run
```

5. From PowerShell, after setting `PRIVATE_BACKUP_DIR` to that existing private directory:

```powershell
$target = "$($env:SANITY_PROJECT_ID)/$($env:SANITY_DATASET)/demo.cafe"
pnpm run demo:restore --apply "--confirm=$target" "--backup-dir=$env:PRIVATE_BACKUP_DIR"
```

The exact confirmation must match all three target components. Unknown/duplicate options, missing token, malformed target or an unsafe backup destination refuse before mutation. The command reads only those two documents, writes a unique exclusive UTF-8 private JSON backup first, then sends exactly two `createOrReplace` mutations in one transaction. There is no broad delete query and no automatic retry.

**Effects:** all edits in those two documents are replaced with the fictional seed, including draft changes, menu, hours, closures/exceptions and images' references. The WhatsApp recipient becomes blank again. Uploaded assets and unrelated documents are not deleted. Changes to published content can trigger the configured deployment hook. This is an intentional overwrite, so never apply without reviewing the target and backup.

If backup creation fails, no mutation is attempted. If the mutation response is absent, fails or does not confirm the exact ids, its outcome is unknown: retain the backup, inspect those exact ids administratively and do not retry blindly. The backup is a private JSON envelope, not a native Sanity dataset export; do not pass it directly to `datasets import`. This tool restores the seed, not an automatically verified rollback of prior edits.

The administrative flow is tested with injected network/backup doubles. A real account/token, real draft permissions, private file ACL, provider transaction and webhook propagation must be checked separately by the owner. No real stored CMS content was reset during implementation.

## No-index policy

Every page has `noindex, nofollow`; `robots.txt` disallows crawling; Cloudflare `_headers` also sends `X-Robots-Tag`. There is no LocalBusiness, Review or AggregateRating structured data. The sitemap is technical route metadata, not an invitation to index a fictional business. No-index is not access control and does not guarantee content will never appear in a search result.

Only after replacing all fictional content with approved authentic information, review the visible disclosures, every opinion/image/license, origin/canonical metadata, page robots tags, robots.txt and `_headers` together. Remove no-index restrictions deliberately and verify the actual deployed response before submitting a sitemap. Never relabel fictional opinions as authentic reviews or add false local-business markup.

## Provider limits and pending external proof

Official pages reviewed on 2026-10-25; limits/plans can change and must be rechecked before account setup:

| Candidate free tier | Published limits relevant to this demo                                                                                                                                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Sanity              | 20 seats, 2 public datasets, 10,000 documents, 250k API requests/month, 1M API CDN requests/month, 100 GB assets and 100 GB bandwidth; hosted Studio included; free project caps have no overages. This build uses the regular API, not the CDN. |
| Cloudflare Pages    | 500 builds/month, one concurrent build, 20,000 files/site, 25 MiB maximum individual asset and 100 custom domains/project. No Pages Functions are required.                                                                                      |

No accounts, IDs, real recipient, hosted Studio, deploy hook, domain, Git remote or publishing permission have been supplied/used here. Owner-only hosted editing, CMS-to-deploy propagation, real Click to Chat delivery, production headers and live restore remain external proof, not successful local-test claims. Read the current verification report for executed checks and unresolved findings.

### Primary sources

- [Astro setup](https://docs.astro.build/en/install-and-setup/) and [Cloudflare deployment](https://docs.astro.build/en/guides/deploy/cloudflare/)
- [Sanity singletons](https://www.sanity.io/docs/studio/create-a-link-to-a-single-edit-page-in-your-main-document-type-list), [authentication](https://www.sanity.io/docs/content-lake/http-auth), [roles](https://www.sanity.io/docs/user-guides/roles), [perspectives](https://www.sanity.io/docs/content-lake/perspectives), [mutation API](https://www.sanity.io/docs/http-reference/mutation), [pricing](https://www.sanity.io/pricing)
- [Pages build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/), [deploy hooks](https://developers.cloudflare.com/pages/configuration/deploy-hooks/), [limits](https://developers.cloudflare.com/pages/platform/limits/)
- [WhatsApp Click to Chat](https://faq.whatsapp.com/425247423114725), [pnpm install](https://pnpm.io/cli/install), [audit](https://pnpm.io/cli/audit)
