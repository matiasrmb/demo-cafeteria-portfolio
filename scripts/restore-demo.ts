import { realpathSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { cmsSeed } from "../src/data/demo.ts";
import { API_VERSION, DEMO_ID, sanityTarget } from "../src/lib/content.ts";

export interface RestoreOptions {
  fetcher?: typeof fetch;
  writeBackup?: (directory: string, snapshot: unknown) => Promise<void>;
}

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const IDS = [DEMO_ID, `drafts.${DEMO_ID}`];
export const RESTORE_HELP = `Administrative demo restore (never a public endpoint).
  pnpm run demo:restore --help
  pnpm run demo:restore --dry-run
  pnpm run demo:restore --apply --confirm=<project>/<dataset>/demo.cafe --backup-dir=<absolute-private-directory>
Requires public SANITY_PROJECT_ID/SANITY_DATASET; apply also requires SANITY_WRITE_TOKEN.
Apply backs up, then replaces ONLY demo.cafe and drafts.demo.cafe atomically.
It clears the configured recipient and replaces all edits in these two documents.
Assets and unrelated documents are not deleted. Pause Studio editing before apply.`;

function assertExternal(directory: string) {
  const location = relative(realpathSync(ROOT), directory);
  if (
    !isAbsolute(directory) ||
    (!isAbsolute(location) &&
      location !== ".." &&
      !location.startsWith(`..${sep}`))
  ) {
    throw new Error(
      "Backup directory must be an existing private absolute directory outside the repository.",
    );
  }
}

async function writePrivateBackup(directory: string, snapshot: unknown) {
  const file = `cafe-demo-${new Date().toISOString().replaceAll(":", "-")}-${randomUUID()}.json`;
  await writeFile(join(directory, file), JSON.stringify(snapshot, null, 2), {
    encoding: "utf8",
    flag: "wx",
    mode: 0o600,
  });
}

export async function restoreDemo(
  args: string[],
  env: Record<string, string | undefined>,
  options: RestoreOptions = {},
): Promise<{ action: string; target: string; ids: string[] }> {
  if (args.length === 1 && args[0] === "--help")
    return { action: "help", target: "", ids: [] };
  const seen = new Set<string>();
  for (const arg of args) {
    const key = arg.split("=")[0]!;
    if (seen.has(key)) throw new Error("Duplicate restore option.");
    seen.add(key);
    if (
      !["--apply", "--dry-run"].includes(arg) &&
      !arg.startsWith("--confirm=") &&
      !arg.startsWith("--backup-dir=")
    ) {
      throw new Error("Unknown or incomplete restore option. Use --help.");
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
  if (!applying) return { action: "dry-run", target, ids: [...IDS] };
  const confirmation = args
    .find((arg) => arg.startsWith("--confirm="))
    ?.slice("--confirm=".length);
  if (confirmation !== target)
    throw new Error("Exact project/dataset/demo.cafe confirmation required.");
  const token = env.SANITY_WRITE_TOKEN;
  if (!token?.trim())
    throw new Error(
      "Administrative write token required in the process environment.",
    );
  const requestedDirectory = args
    .find((arg) => arg.startsWith("--backup-dir="))
    ?.slice("--backup-dir=".length);
  if (!requestedDirectory || !isAbsolute(requestedDirectory))
    throw new Error("Explicit absolute private backup directory required.");
  assertExternal(requestedDirectory);
  let directory: string;
  try {
    directory = realpathSync(requestedDirectory);
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
  let documents: { _id: string }[];
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
        (doc: { _id?: string } | null) => doc && IDS.includes(doc._id ?? ""),
      )
    )
      throw new Error("Invalid backup payload");
    documents = payload.result;
  } catch {
    throw new Error("Cannot capture demo documents; no mutation attempted.");
  }
  const snapshot = {
    schema: "cafe-demo-backup/v1",
    project,
    dataset,
    ids: IDS,
    capturedAt: new Date().toISOString(),
    documents,
  };
  try {
    await (options.writeBackup ?? writePrivateBackup)(directory, snapshot);
  } catch {
    throw new Error(
      "Private backup could not be written; no mutation attempted.",
    );
  }
  const seed = cmsSeed();
  const mutations = IDS.map((_id) => ({ createOrReplace: { ...seed, _id } }));
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
      (result: { documentId: string }) => result.documentId,
    );
    if (
      !Array.isArray(affected) ||
      new Set(affected).size !== IDS.length ||
      !IDS.every((id) => affected.includes(id))
    )
      throw new Error("Mutation identity not confirmed");
  } catch {
    throw new Error(
      "Restore outcome unknown. Keep the private backup and inspect the two exact ids administratively; do not retry blindly.",
    );
  }
  return { action: "restored", target, ids: [...IDS] };
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const result = await restoreDemo(process.argv.slice(2), process.env);
    if (result.action === "help") console.log(RESTORE_HELP);
    else console.log(JSON.stringify(result));
  } catch (error) {
    console.error(
      error instanceof Error
        ? error.message
        : "Administrative restore could not be completed.",
    );
    process.exitCode = 1;
  }
}
