import { realpathSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { isAbsolute, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const ROOT = fileURLToPath(new URL("../", import.meta.url));

export function assertExternal(directory: string) {
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

export async function writePrivateBackup(directory: string, snapshot: unknown) {
  const file = `cafe-demo-${new Date().toISOString().replaceAll(":", "-")}-${randomUUID()}.json`;
  await writeFile(join(directory, file), JSON.stringify(snapshot, null, 2), {
    encoding: "utf8",
    flag: "wx",
    mode: 0o600,
  });
}
