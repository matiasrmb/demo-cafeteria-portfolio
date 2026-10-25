import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

// Resolve from the actual consumer, without assuming a pnpm store layout.
function dependency(parent: NodeJS.Require, name: string) {
  let entry: string;
  try {
    entry = parent.resolve(name);
  } catch {
    entry = parent.resolve(`${name}/package.json`);
  }
  let directory = dirname(entry);
  for (let depth = 0; depth < 8; depth++, directory = dirname(directory)) {
    const file = join(directory, "package.json");
    if (!existsSync(file)) continue;
    const metadata = JSON.parse(readFileSync(file, "utf8"));
    if (metadata.name === name)
      return { require: createRequire(file), metadata, directory, entry };
  }
  throw new Error(`Could not locate dependency metadata: ${name}`);
}

const studio = createRequire(
  new URL("../studio/package.json", import.meta.url),
);
const sanity = dependency(studio, "sanity");
const cli = dependency(sanity.require, "@sanity/cli");
const frameworks = dependency(cli.require, "@vercel/frameworks");

test("Sanity framework detection uses patched YAML with its existing safeLoad API", () => {
  const yaml = dependency(frameworks.require, "js-yaml");
  assert.equal(yaml.metadata.version, "3.15.2");
  assert.deepEqual(frameworks.require("js-yaml").safeLoad("demo: true\n"), {
    demo: true,
  });
});

test("Sanity framework detection uses patched TOML with its existing parse API", () => {
  const toml = dependency(frameworks.require, "smol-toml");
  assert.equal(toml.metadata.version, "1.9.1");
  const parsed = frameworks.require("smol-toml").parse("demo = true\n");
  assert.equal(parsed.demo, true);
  assert.deepEqual(Object.keys(parsed), ["demo"]);
});

test("TypeID generation, parsing and UUID conversion work with patched uuid in CJS and ESM", async () => {
  const typeid = dependency(cli.require, "typeid-js");
  assert.equal(dependency(typeid.require, "uuid").metadata.version, "11.1.1");
  const commonjs = cli.require("typeid-js");
  const esmEntry = join(typeid.directory, typeid.metadata.module);
  const esm = await import(pathToFileURL(esmEntry).href);
  for (const api of [commonjs, esm]) {
    const id = api.typeid("demo");
    assert.equal(id.getType(), "demo");
    assert.equal(
      api.TypeID.fromString(id.toString()).toString(),
      id.toString(),
    );
    assert.equal(
      api.TypeID.fromUUID("demo", id.toUUID()).toString(),
      id.toString(),
    );
  }
});

test("Module federation uses patched undici and can create and close an Agent without network", async () => {
  const workbench = dependency(cli.require, "@sanity/workbench-cli");
  const federation = dependency(workbench.require, "@module-federation/vite");
  const dts = dependency(federation.require, "@module-federation/dts-plugin");
  assert.equal(dependency(dts.require, "undici").metadata.version, "7.30.1");
  const { Agent, fetch } = dts.require("undici");
  assert.equal(typeof fetch, "function");
  const agent = new Agent();
  await agent.close();
});
