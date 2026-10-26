import { test } from "node:test";
import assert from "node:assert/strict";
import { tmpdir } from "node:os";
import { restoreDemo } from "../scripts/restore-demo.ts";
import { cmsSeed } from "../src/data/demo.ts";

const env = {
  SANITY_PROJECT_ID: "demotest",
  SANITY_DATASET: "production",
  SANITY_WRITE_TOKEN: "test-only-not-a-secret",
};
const apply = [
  "--apply",
  "--confirm=demotest/production/demo-cafe",
  `--backup-dir=${tmpdir()}`,
];

test("restore defaults to a network-free dry run and requires exact administrative consent", async () => {
  let calls = 0;
  const fetcher: typeof fetch = async () => {
    calls++;
    throw new Error("Unexpected network");
  };
  assert.equal((await restoreDemo([], env, { fetcher })).action, "dry-run");
  for (const args of [
    ["--apply"],
    [...apply, "--unknown"],
    ["--apply", "--confirm=other/production/demo-cafe"],
  ]) {
    await assert.rejects(restoreDemo(args, env, { fetcher }));
  }
  await assert.rejects(
    restoreDemo(apply, { ...env, SANITY_WRITE_TOKEN: "" }, { fetcher }),
  );
  await assert.rejects(
    restoreDemo(
      [
        "--apply",
        "--confirm=demotest/production/demo-cafe",
        `--backup-dir=${process.cwd()}`,
      ],
      env,
      { fetcher },
    ),
  );
  assert.equal(calls, 0);
});

test("restore backs up first and only resets the two exact demo ids in one transaction", async () => {
  const original = { ...cmsSeed(), homeTitle: "Owner-edited demonstration" };
  const state = new Map<string, unknown>([
    ["demo-cafe", original],
    ["drafts.demo-cafe", { ...original, _id: "drafts.demo-cafe" }],
    ["unrelated", { keep: true }],
  ]);
  const before = JSON.stringify([...state]);
  let backedUp = false;
  let posts = 0;
  const fetcher: typeof fetch = async (_url, init) => {
    if (init?.method === "POST") {
      assert.ok(backedUp, "No mutation before a durable backup");
      posts++;
      const body = JSON.parse(String(init.body));
      assert.equal(body.mutations.length, 2);
      for (const { createOrReplace: doc } of body.mutations) {
        assert.ok(["demo-cafe", "drafts.demo-cafe"].includes(doc._id));
        assert.equal(doc._type, "cafeDemo");
        state.set(doc._id, doc);
      }
      return Response.json({
        results: body.mutations.map(
          ({ createOrReplace: doc }: { createOrReplace: { _id: string } }) => ({
            documentId: doc._id,
          }),
        ),
      });
    }
    return Response.json({
      result: [state.get("demo-cafe"), state.get("drafts.demo-cafe")],
    });
  };
  const result = await restoreDemo(apply, env, {
    fetcher,
    writeBackup: async (_directory, snapshot) => {
      assert.equal(JSON.stringify([...state]), before);
      assert.ok(
        JSON.stringify(snapshot).includes("Owner-edited demonstration"),
      );
      backedUp = true;
    },
  });
  assert.equal(result.action, "restored");
  assert.equal(posts, 1);
  assert.equal(
    (state.get("demo-cafe") as ReturnType<typeof cmsSeed>).contact.whatsapp,
    "",
  );
  assert.deepEqual(state.get("unrelated"), { keep: true });
});

test("backup failure prevents mutation and mutation uncertainty is not retried", async () => {
  let posts = 0;
  const fetcher: typeof fetch = async (_url, init) => {
    if (init?.method === "POST") {
      posts++;
      return new Response("", { status: 503 });
    }
    return Response.json({ result: [] });
  };
  await assert.rejects(
    restoreDemo(apply, env, {
      fetcher,
      writeBackup: async () => {
        throw new Error("Disk unavailable");
      },
    }),
  );
  assert.equal(posts, 0);
  await assert.rejects(
    restoreDemo(apply, env, { fetcher, writeBackup: async () => {} }),
    /outcome unknown/i,
  );
  assert.equal(posts, 1);
});
