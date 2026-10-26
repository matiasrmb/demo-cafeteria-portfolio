import { realpathSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { API_VERSION, DEMO_ID, sanityTarget } from "../src/lib/content.ts";
import { assertExternal, writePrivateBackup } from "./private-backup.ts";

export interface MigrationOptions {
  fetcher?: typeof fetch;
  writeBackup?: (directory: string, snapshot: unknown) => Promise<void>;
}

const SOURCE_IDS = ["demo.cafe", "drafts.demo.cafe"];
const DESTINATION_IDS = [DEMO_ID, `drafts.${DEMO_ID}`];
const IDS = [...SOURCE_IDS, ...DESTINATION_IDS];
type Document = Record<string, unknown> & { _id: string; _type: string };

export const MIGRATION_HELP = `Administrative, create-only singleton ID migration.
  pnpm run demo:migrate-id --help
  pnpm run demo:migrate-id --dry-run
  pnpm run demo:migrate-id --apply --confirm=<project>/<dataset>/demo-cafe --backup-dir=<absolute-private-directory>
Dry-run is network-free and does not inspect content or target collisions.
Requires SANITY_PROJECT_ID/SANITY_DATASET; apply also requires SANITY_WRITE_TOKEN.
Apply copies demo.cafe to demo-cafe and copies its draft only if present.
All content fields and asset references are preserved, not replaced with seed data.
New documents receive new revision/timestamp metadata; originals/history remain untouched.
Any existing destination refuses. A private external backup precedes one atomic create-only transaction.
Pause editing before apply. Never blindly retry an unknown outcome.
Preparation does not authorize execution; no migration is run automatically by builds or Studio.`;

export async function migrateDemoId(
  args: string[],
  env: Record<string, string | undefined>,
  options: MigrationOptions = {},
): Promise<{
  action: string;
  target: string;
  sourceIds: string[];
  destinationIds: string[];
}> {
  if (args.length === 1 && args[0] === "--help") {
    return { action: "help", target: "", sourceIds: [], destinationIds: [] };
  }
  const seen = new Set<string>();
  for (const arg of args) {
    const key = arg.split("=")[0]!;
    if (seen.has(key)) throw new Error("Duplicate migration option.");
    seen.add(key);
    if (
      !["--apply", "--dry-run"].includes(arg) &&
      !arg.startsWith("--confirm=") &&
      !arg.startsWith("--backup-dir=")
    ) {
      throw new Error("Unknown or incomplete migration option. Use --help.");
    }
  }
  const applying = args.includes("--apply");
  if (
    (applying && args.includes("--dry-run")) ||
    (!applying && (seen.has("--confirm") || seen.has("--backup-dir")))
  ) {
    throw new Error(
      "Use --dry-run alone, or explicit --apply with confirmation and private backup directory.",
    );
  }
  const { project, dataset } = sanityTarget(env);
  const target = `${project}/${dataset}/${DEMO_ID}`;
  if (!applying)
    return {
      action: "dry-run",
      target,
      sourceIds: [...SOURCE_IDS],
      destinationIds: [...DESTINATION_IDS],
    };
  if (
    args
      .find((arg) => arg.startsWith("--confirm="))
      ?.slice("--confirm=".length) !== target
  ) {
    throw new Error("Exact project/dataset/demo-cafe confirmation required.");
  }
  const token = env.SANITY_WRITE_TOKEN;
  if (!token?.trim())
    throw new Error(
      "Administrative write token required in the process environment.",
    );
  const requested = args
    .find((arg) => arg.startsWith("--backup-dir="))
    ?.slice("--backup-dir=".length);
  if (!requested || !isAbsolute(requested))
    throw new Error("Explicit absolute private backup directory required.");
  assertExternal(requested);
  let directory: string;
  try {
    directory = realpathSync(requested);
  } catch {
    throw new Error("Create the private backup directory before applying.");
  }
  assertExternal(directory);
  const fetcher = options.fetcher ?? fetch;
  const base = `https://${project}.api.sanity.io/v${API_VERSION}/data`;
  const query = new URL(`${base}/query/${dataset}`);
  query.searchParams.set("query", `*[_id in ${JSON.stringify(IDS)}]`);
  query.searchParams.set("perspective", "raw");
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  let documents: Document[];
  try {
    const response = await fetcher(query, {
      headers,
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error("Read refused");
    const payload = await response.json();
    if (
      !Array.isArray(payload.result) ||
      !payload.result.every(
        (doc: unknown) =>
          doc &&
          typeof doc === "object" &&
          IDS.includes((doc as Document)._id) &&
          (doc as Document)._type === "cafeDemo",
      )
    )
      throw new Error("Invalid source payload");
    documents = payload.result;
    if (new Set(documents.map((doc) => doc._id)).size !== documents.length)
      throw new Error("Duplicate source IDs");
  } catch {
    throw new Error(
      "Cannot capture migration documents; no mutation attempted.",
    );
  }
  if (documents.some((doc) => DESTINATION_IDS.includes(doc._id)))
    throw new Error("Destination already exists; no mutation attempted.");
  if (!documents.some((doc) => doc._id === SOURCE_IDS[0]))
    throw new Error(
      "Legacy published document required; no mutation attempted.",
    );
  const sources = SOURCE_IDS.flatMap((id) =>
    documents.filter((doc) => doc._id === id),
  );
  const mutations = sources.map((doc) => {
    const copy = structuredClone(doc);
    copy._id = DESTINATION_IDS[SOURCE_IDS.indexOf(doc._id)]!;
    for (const field of ["_rev", "_createdAt", "_updatedAt", "_system"])
      delete copy[field];
    return { create: copy };
  });
  try {
    await (options.writeBackup ?? writePrivateBackup)(directory, {
      schema: "cafe-demo-id-migration-backup/v1",
      project,
      dataset,
      sourceIds: SOURCE_IDS,
      destinationIds: DESTINATION_IDS,
      capturedAt: new Date().toISOString(),
      documents,
    });
  } catch {
    throw new Error(
      "Private backup could not be written; no mutation attempted.",
    );
  }
  const destinationIds = mutations.map(({ create }) => create._id);
  try {
    const response = await fetcher(
      `${base}/mutate/${dataset}?returnIds=true&visibility=sync`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ mutations }),
        redirect: "error",
        signal: AbortSignal.timeout(15000),
      },
    );
    if (!response.ok) throw new Error("Mutation not confirmed");
    const payload = await response.json();
    const affected = payload.results?.map(
      (result: { documentId?: string }) => result.documentId,
    );
    if (
      !Array.isArray(affected) ||
      affected.length !== destinationIds.length ||
      new Set(affected).size !== destinationIds.length ||
      !destinationIds.every((id) => affected.includes(id))
    )
      throw new Error("Mutation identity not confirmed");
  } catch {
    throw new Error(
      "Migration outcome unknown. Keep the private backup and inspect the exact destination IDs; do not retry blindly.",
    );
  }
  return {
    action: "migrated",
    target,
    sourceIds: sources.map((doc) => doc._id),
    destinationIds,
  };
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const result = await migrateDemoId(process.argv.slice(2), process.env);
    console.log(
      result.action === "help" ? MIGRATION_HELP : JSON.stringify(result),
    );
  } catch (error) {
    console.error(
      error instanceof Error
        ? error.message
        : "Administrative migration could not be completed.",
    );
    process.exitCode = 1;
  }
}
