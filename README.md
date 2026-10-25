# Bruma — fictional café demo

A portfolio demonstration for a fictional café concept inspired by Constitución, Maule, Chile. It is not a real business. Products, prices, imagery, opinions and availability are illustrative. No bookings, visitor storage, payments or automatic messaging are provided.

**Local demo implemented; external services are not activated.** Four public pages, the illustrative calendar/request flow, a separate Sanity Studio configuration and a controlled administrative seed restore are present. See [verification evidence](docs/verification.md) for executed checks and remaining proof; implementation is not a claim that the site is published or that hosted authentication was tested.

## Development

Requirements: Node 24.15.0 and pnpm 11.1.3. Use pnpm only; the repository was empty, so no package-manager migration was needed.

```sh
pnpm install --frozen-lockfile
pnpm run test
pnpm run check
pnpm exec playwright install chromium
pnpm run test:e2e
pnpm run build
pnpm run dev
```

Do not store credentials in the repository. `.env.example` contains safe defaults and empty public Sanity identifiers; it contains no recipient number. Project OpenCode configuration asks before editing that exact template. Real `.env` files remain protected by the existing user policy. No global permissions were changed.

## Implementation status

The four routes are `/`, `/menu/`, `/grupos-y-eventos/` and `/reservas/`. All visibly identify the fictional business. The public site is no-indexed, includes no review/local-business structured data, and uses original vector artwork. The menu is editable and the calendar supports weekly rules, separate table/group capacities, closures and date exceptions.

For owner-only CMS setup, safe variables, Cloudflare Pages/webhook configuration, private backup requirements and administrative restore effects, follow the [operations guide](docs/operations.md). Progress and the verbatim approved scope are preserved in [the feature log](odd/tasks/cafe-demo.md).

- The public site uses Astro, HTML, CSS and a small TypeScript module, not React.
- React is confined to the separate `studio` workspace because Sanity Studio requires it.
- No account has been connected, Studio deployed, webhook activated or site published.
- The WhatsApp recipient is intentionally empty. A configured, valid international number is required to prepare a link.

## Availability contract

All dates and times use `America/Santiago`. Weekly rules define opening/closing time, interval and separate table/group example capacities. Closed dates override exceptions; a date exception overrides the weekly rule. No overnight ranges are supported. A slot must end by closing time. Past dates/times and dates outside the configured horizon are unavailable.

The helpers do not mutate availability or record visitor data. A request only prepares a URL after validating every field and selected slot. Opening WhatsApp does not send the message, allocate capacity or confirm a booking. Capacities are illustrative, not live occupancy.

Tests use one explicitly reserved fictional NANP number solely to inspect URL construction; it is never seeded as a recipient or included in public content. Number validation checks international syntax and numbering-plan validity, not account existence or ownership. Actual recipient ownership and WhatsApp operation require an authorized external check.

## Verification boundaries

`pnpm run test` uses Node's built-in deterministic runner. No additional unit-test framework was added. Browser checks use Playwright because no browser tooling existed and responsive/keyboard interaction needs real-browser evidence. There was no previous application or command behavior for a differential baseline comparison.

External CMS authentication, owner-only access, content publication, deployment propagation and live restore must be verified after the owner configures authorized accounts. Never put personal visitor data, tokens or webhook secrets in the public Sanity dataset.

## Dependency security

The initial Sanity CLI tree produced 12 audit advisories (5 high, 7 moderate). Narrow consumer-specific overrides select js-yaml 3.15.2, smol-toml 1.9.1, undici 7.30.1 and uuid 11.1.1 instead of suppressing advisories or broadly updating dependencies. The lockfile now records all four overrides after an actual resolution during subsequent development; earlier unsuccessful attempts remain documented in the feature log, with no unproven root cause claimed. Use the latest recorded audit result, not install success, as the time-specific evidence.

The TypeID → uuid override crosses major 10 to 11; semver alone does not guarantee compatibility. The regression probe checks the consumer's public generation, parsing and UUID-conversion APIs in both CommonJS and ESM. The other overrides stay within their original major versions. Keep override selectors, the lockfile and compatibility probes together when upgrading Sanity. An audit result is not a permanent security guarantee.

Do not move these settings to `package.json`: pnpm 11 ignores its legacy `pnpm` settings field. Do not disable tests/audit or share credentials when investigating install behavior.
