import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";

const read = (path: string) => readFile(new URL(path, import.meta.url), "utf8");

test("Studio retains scaffold settings and required shared-source compiler safeguards", async () => {
  const { compilerOptions: options } = JSON.parse(
    await read("../studio/tsconfig.json"),
  );
  assert.equal(options.target, "ES2017");
  assert.equal(options.module, "Preserve");
  for (const key of [
    "allowJs",
    "isolatedModules",
    "incremental",
    "noEmit",
    "allowImportingTsExtensions",
  ]) {
    assert.equal(options[key], true, key);
  }
  assert.deepEqual(options.types, ["node", "astro/client"]);
});

test("generated lint template remains inactive without scripts or dependencies", async () => {
  await access(new URL("../studio/eslint.config.mjs.example", import.meta.url));
  await assert.rejects(
    access(new URL("../studio/eslint.config.mjs", import.meta.url)),
    { code: "ENOENT" },
  );
  for (const path of ["../package.json", "../studio/package.json"]) {
    const manifest = JSON.parse(await read(path));
    assert.equal(
      Object.keys(manifest.scripts ?? {}).some((key) => /lint/i.test(key)),
      false,
    );
    const dependencies = {
      ...manifest.dependencies,
      ...manifest.devDependencies,
    };
    assert.equal("eslint" in dependencies, false);
    assert.equal("@sanity/eslint-config-studio" in dependencies, false);
  }
});

test("publication instructions do not deny the configured remote or supplied authorization", async () => {
  const operations = await read("../docs/operations.md");
  assert.doesNotMatch(
    operations,
    /has not been pushed or connected to any remote/,
  );
  assert.doesNotMatch(
    operations,
    /No accounts, IDs, real recipient, hosted Studio, deploy hook, domain, Git remote or publishing permission have been supplied\/used here/,
  );
});
