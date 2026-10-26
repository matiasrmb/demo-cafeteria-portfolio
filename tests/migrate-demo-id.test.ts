import { test } from "node:test";
import assert from "node:assert/strict";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { migrateDemoId } from "../scripts/migrate-demo-id.ts";

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
const original = {
  _id: "demo.cafe",
  _type: "cafeDemo",
  _rev: "published-revision",
  _createdAt: "2026-01-01T00:00:00Z",
  _updatedAt: "2026-10-26T00:00:00Z",
  _system: { exampleMetadata: true },
  name: "Owner-edited café",
  contact: { whatsapp: "", detail: "Owner-edited contact" },
  products: [
    {
      _key: "cake",
      price: 7890,
      image: { asset: { _ref: "image-abc-100x100-png" }, alt: "Owner image" },
    },
  ],
  customField: { keep: ["all", "values"] },
};
const draft = {
  ...structuredClone(original),
  _id: "drafts.demo.cafe",
  _rev: "draft-revision",
  name: "Unpublished owner edits",
};
type Document = Record<string, unknown> & { _id: string };

function fixture(documents: Document[]) {
  const state = new Map(
    documents.map((doc) => [doc._id, structuredClone(doc)]),
  );
  const before = JSON.stringify([...state]);
  const events: string[] = [];
  let backup: unknown;
  const fetcher: typeof fetch = async (input, init) => {
    const url = new URL(String(input));
    assert.equal(url.hostname, "demotest.api.sanity.io");
    assert.equal(
      new Headers(init?.headers).get("Authorization"),
      `Bearer ${env.SANITY_WRITE_TOKEN}`,
    );
    if (init?.method !== "POST") {
      events.push("read");
      assert.equal(url.searchParams.get("perspective"), "raw");
      assert.equal(
        url.searchParams.get("query"),
        '*[_id in ["demo.cafe","drafts.demo.cafe","demo-cafe","drafts.demo-cafe"]]',
      );
      return Response.json({
        result: [...state.values()].filter((doc) =>
          [
            "demo.cafe",
            "drafts.demo.cafe",
            "demo-cafe",
            "drafts.demo-cafe",
          ].includes(doc._id),
        ),
      });
    }
    events.push("post");
    assert.deepEqual(events, ["read", "backup", "post"]);
    const { mutations } = JSON.parse(String(init.body));
    for (const mutation of mutations) {
      assert.deepEqual(Object.keys(mutation), ["create"]);
      assert.equal(state.has(mutation.create._id), false);
    }
    for (const { create: doc } of mutations) state.set(doc._id, doc);
    return Response.json({
      results: mutations.map(({ create: doc }: { create: Document }) => ({
        id: doc._id,
      })),
    });
  };
  return {
    state,
    before,
    events,
    fetcher,
    get backup() {
      return backup;
    },
    writeBackup: async (_directory: string, snapshot: unknown) => {
      events.push("backup");
      assert.equal(JSON.stringify([...state]), before);
      backup = structuredClone(snapshot);
    },
  };
}

test("migration CLI and defaults are network-free and require explicit apply consent", async () => {
  let requests = 0;
  const fetcher: typeof fetch = async () => {
    requests++;
    throw new Error("Unexpected network");
  };
  assert.deepEqual(await migrateDemoId([], env, { fetcher }), {
    action: "dry-run",
    target: "demotest/production/demo-cafe",
    sourceIds: ["demo.cafe", "drafts.demo.cafe"],
    destinationIds: ["demo-cafe", "drafts.demo-cafe"],
  });
  for (const args of [
    ["--unknown"],
    ["--apply"],
    ["--apply=true"],
    ["--help", "--apply"],
    ["--dry-run", "--apply"],
    ["--dry-run", "--dry-run"],
    ["--confirm=demotest/production/demo-cafe"],
    [...apply, "--confirm=demotest/production/demo-cafe"],
    [...apply, "--unknown"],
    [
      ...apply.filter((arg) => !arg.startsWith("--confirm=")),
      "--confirm=other/production/demo-cafe",
    ],
  ]) {
    await assert.rejects(migrateDemoId(args, env, { fetcher }));
  }
  await assert.rejects(
    migrateDemoId(apply, { ...env, SANITY_WRITE_TOKEN: "" }, { fetcher }),
  );
  await assert.rejects(
    migrateDemoId(
      apply.map((arg) =>
        arg.startsWith("--backup-dir=") ? `--backup-dir=${process.cwd()}` : arg,
      ),
      env,
      { fetcher },
    ),
  );
  assert.equal(requests, 0);
  for (const args of [[], ["--help"], ["--dry-run"], ["--unknown"]]) {
    const result = spawnSync(
      process.execPath,
      ["scripts/migrate-demo-id.ts", ...args],
      {
        cwd: new URL("../", import.meta.url),
        env: { ...process.env, ...env, SANITY_WRITE_TOKEN: "" },
        encoding: "utf8",
      },
    );
    assert.equal(result.status, args.includes("--unknown") ? 1 : 0);
    assert.equal(result.stderr.includes("test-only-not-a-secret"), false);
    if (args.includes("--help"))
      assert.match(result.stdout, /create-only|creates only/i);
    else if (!args.includes("--unknown"))
      assert.equal(JSON.parse(result.stdout).action, "dry-run");
  }
});

test("migration copies owner content and optional draft in one backed-up create-only transaction", async () => {
  for (const withDraft of [true, false]) {
    const unrelated = { _id: "unrelated", _type: "other", keep: true };
    const f = fixture(
      withDraft ? [original, draft, unrelated] : [original, unrelated],
    );
    const result = await migrateDemoId(apply, env, f);
    assert.equal(result.action, "migrated");
    assert.deepEqual(
      result.destinationIds,
      withDraft ? ["demo-cafe", "drafts.demo-cafe"] : ["demo-cafe"],
    );
    assert.deepEqual(f.events, ["read", "backup", "post"]);
    assert.deepEqual(f.state.get("demo.cafe"), original);
    assert.equal(f.state.size, withDraft ? 5 : 3);
    assert.deepEqual(f.state.get("unrelated"), unrelated);
    for (const source of withDraft ? [original, draft] : [original]) {
      const { _rev, _createdAt, _updatedAt, _system, ...content } = source;
      assert.deepEqual(
        f.state.get(source._id.replace("demo.cafe", "demo-cafe")),
        { ...content, _id: source._id.replace("demo.cafe", "demo-cafe") },
      );
      assert.deepEqual(f.state.get(source._id), source);
    }
    assert.deepEqual(
      (f.backup as { documents: unknown[] }).documents,
      withDraft ? [original, draft] : [original],
    );
    if (!withDraft) assert.equal(f.state.has("drafts.demo-cafe"), false);
  }
});

test("migration refuses missing sources, malformed reads and existing targets without any write", async () => {
  const cases: Document[][] = [
    [],
    [draft],
    [{ ...original, _type: "other" }],
    [original, original],
    [
      original,
      { _id: "demo-cafe", _type: "cafeDemo", name: "Existing destination" },
    ],
    [original, { _id: "drafts.demo-cafe", _type: "cafeDemo" }],
    [original, { _id: "unrelated", keep: true }],
  ];
  for (const documents of cases) {
    const f = fixture(documents);
    // Preserve duplicate entries in the read, rather than Map deduplication.
    const fetcher: typeof fetch = async (input, init) =>
      init?.method === "POST"
        ? f.fetcher(input, init)
        : Response.json({ result: documents });
    await assert.rejects(
      migrateDemoId(apply, env, { fetcher, writeBackup: f.writeBackup }),
    );
    assert.deepEqual(f.events, []);
    assert.equal(JSON.stringify([...f.state]), f.before);
  }
});

test("migration does not mutate after read or backup failure and never retries unknown mutation outcomes", async () => {
  const f = fixture([original, draft]);
  await assert.rejects(
    migrateDemoId(apply, env, {
      fetcher: async () => new Response("", { status: 503 }),
      writeBackup: f.writeBackup,
    }),
    /no mutation/i,
  );
  await assert.rejects(
    migrateDemoId(apply, env, {
      fetcher: f.fetcher,
      writeBackup: async () => {
        throw new Error("Disk unavailable");
      },
    }),
    /no mutation/i,
  );
  assert.equal(JSON.stringify([...f.state]), f.before);
  for (const outcome of [
    new Response("", { status: 409 }),
    new Response("", { status: 503 }),
    Response.json({ results: [{ id: "wrong-id" }] }),
    Response.json({
      results: [{ id: "demo-cafe", documentId: "different-id" }],
    }),
  ]) {
    let posts = 0;
    await assert.rejects(
      migrateDemoId(apply, env, {
        fetcher: async (_input, init) => {
          if (init?.method === "POST") {
            posts++;
            return outcome;
          }
          return Response.json({ result: [original, draft] });
        },
        writeBackup: async () => {},
      }),
      /outcome unknown.*do not retry/i,
    );
    assert.equal(posts, 1);
  }
});

test("migration also confirms the documented documentId response shape", async () => {
  const f = fixture([original]);
  const result = await migrateDemoId(apply, env, {
    writeBackup: f.writeBackup,
    fetcher: async (input, init) => {
      const response = await f.fetcher(input, init);
      return init?.method === "POST"
        ? Response.json({ results: [{ documentId: "demo-cafe" }] })
        : response;
    },
  });
  assert.equal(result.action, "migrated");
  assert.deepEqual(result.destinationIds, ["demo-cafe"]);
  assert.deepEqual(f.events, ["read", "backup", "post"]);
});
