# Bruma demonstration Studio

Standalone Sanity Studio for the fictional café. The active schema is registered explicitly in `sanity.config.ts`; the generated `schemaTypes/index.ts` is unused scaffolding and does not replace that registration.

Use pnpm from the repository root. Set the public `SANITY_STUDIO_PROJECT_ID` and `SANITY_STUDIO_DATASET` in your local process environment, then run `pnpm run studio:dev`. Starting or compiling Studio does not prove that an account is connected or that hosted editing permissions are configured.

Follow [the operations guide](../docs/operations.md) for authenticated owner-only editing, deployment, CORS, safe variables and administrative seed recovery. Never put credentials or visitor information in public documents.

The generated ESLint configuration is retained as `eslint.config.mjs.example`, not an active configuration: neither ESLint nor its Studio preset is installed, and no lint script is provided. Enabling lint is a separate tooling change, not a prerequisite silently added during source publication. Type checking and functional tests remain active.
