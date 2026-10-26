import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, readdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { migrateDemoId } from "../scripts/migrate-demo-id.ts";

test("migration writes the complete private snapshot before POST and preserves files on rejection", async (t) => {
  const externalRoot = join(tmpdir(), "opencode");
  await mkdir(externalRoot, { recursive: true });
  const directory = await mkdtemp(join(externalRoot, "cafe-migration-backup-"));
  t.diagnostic(`External test scratch: ${directory}`);
  const env = {
    SANITY_PROJECT_ID: "demotest",
    SANITY_DATASET: "production",
    SANITY_WRITE_TOKEN: "test-only-not-a-secret",
  };
  const args = [
    "--apply",
    "--confirm=demotest/production/demo-cafe",
    `--backup-dir=${directory}`,
  ];
  const source = {
    _id: "demo.cafe",
    _type: "cafeDemo",
    _rev: "source-revision",
    _system: { keepInBackup: true },
    custom: [
      { _key: "owner-key", image: { asset: { _ref: "image-abc-10x10-png" } } },
    ],
  };
  const state = join(directory, "state.json");
  await writeFile(
    state,
    JSON.stringify([source, { _id: "unrelated", keep: true }]),
  );
  const hash = async () =>
    createHash("sha256")
      .update(await readFile(state))
      .digest("hex");
  const before = await hash();
  let posts = 0;
  await migrateDemoId(args, env, {
    fetcher: async (_input, init) => {
      if (init?.method !== "POST") return Response.json({ result: [source] });
      posts++;
      const backups = (await readdir(directory)).filter((name) =>
        name.startsWith("cafe-demo-"),
      );
      assert.equal(backups.length, 1, "Backup must exist before mutation");
      const snapshot = JSON.parse(
        await readFile(join(directory, backups[0]!), "utf8"),
      );
      assert.deepEqual(snapshot.documents, [source]);
      const { mutations } = JSON.parse(String(init.body));
      assert.deepEqual(mutations, [
        {
          create: {
            _id: "demo-cafe",
            _type: "cafeDemo",
            custom: source.custom,
          },
        },
      ]);
      return Response.json({ results: [{ documentId: "demo-cafe" }] });
    },
  });
  assert.equal(posts, 1);
  assert.equal(await hash(), before);
  const files = await readdir(directory);
  for (const result of [
    null,
    [],
    [source, source],
    [{ ...source, _id: "drafts.demo.cafe" }],
    [source, { _id: "demo-cafe", _type: "cafeDemo" }],
    [source, { _id: "unexpected", _type: "cafeDemo" }],
  ]) {
    await assert.rejects(
      migrateDemoId(args, env, {
        fetcher: async (_input, init) => {
          if (init?.method === "POST") {
            posts++;
            throw new Error("Unexpected mutation");
          }
          return Response.json({ result });
        },
      }),
    );
    assert.equal(posts, 1);
    assert.deepEqual(await readdir(directory), files);
    assert.equal(await hash(), before);
  }
});
