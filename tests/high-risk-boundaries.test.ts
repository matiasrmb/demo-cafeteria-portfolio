import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { restoreDemo } from "../scripts/restore-demo.ts";
import { cmsSeed, demoContent } from "../src/data/demo.ts";
import { loadContent } from "../src/lib/content.ts";

const env = {
  SANITY_PROJECT_ID: "demotest",
  SANITY_DATASET: "production",
  SANITY_WRITE_TOKEN: "test-only-not-a-secret",
};
type SeedDocument = Omit<ReturnType<typeof cmsSeed>, "_id"> & { _id: string };

test("restore reads exact ids, backs up typed seed before one transaction and never retries uncertainty", async () => {
  const events: string[] = [];
  let posts = 0;
  const fetcher: typeof fetch = async (input, init) => {
    const url = new URL(String(input));
    if (init?.method === "POST") {
      posts++;
      events.push("post");
      assert.deepEqual(events, ["read", "backup", "post"]);
      const body = JSON.parse(String(init.body)) as {
        mutations: { createOrReplace: SeedDocument }[];
      };
      assert.deepEqual(
        body.mutations.map((mutation) => mutation.createOrReplace._id),
        ["demo-cafe", "drafts.demo-cafe"],
      );
      for (const { createOrReplace: doc } of body.mutations) {
        assert.equal(doc.contact.whatsapp, "");
        assert.ok(
          doc.categories.every(
            (item) => item._type === "menuCategory" && item.code === item._key,
          ),
        );
        assert.ok(doc.products.every((item) => item._type === "menuProduct"));
        assert.ok(
          doc.availability.weekly.every((item) => item._type === "weeklyRule"),
        );
      }
      return new Response("", { status: 503 });
    }
    events.push("read");
    assert.equal(url.searchParams.get("perspective"), "raw");
    assert.equal(
      url.searchParams.get("query"),
      '*[_id in ["demo-cafe","drafts.demo-cafe"]]',
    );
    assert.ok(new Headers(init?.headers).has("Authorization"));
    return Response.json({ result: [cmsSeed()] });
  };
  await assert.rejects(
    restoreDemo(
      [
        "--apply",
        "--confirm=demotest/production/demo-cafe",
        `--backup-dir=${tmpdir()}`,
      ],
      env,
      {
        fetcher,
        writeBackup: async (_directory, snapshot) => {
          events.push("backup");
          assert.deepEqual((snapshot as { ids: string[] }).ids, [
            "demo-cafe",
            "drafts.demo-cafe",
          ]);
          assert.equal(posts, 0);
        },
      },
    ),
    /outcome unknown/,
  );
  assert.equal(posts, 1);
});

test("public loader never forwards an administrative token and rejects a draft identity", async () => {
  let request = "";
  const configured = { ...env, CONTENT_SOURCE: "sanity" };
  const result = await loadContent(configured, async (input, init) => {
    request = String(input);
    assert.equal(new Headers(init?.headers).has("Authorization"), false);
    return Response.json({ result: structuredClone(demoContent) });
  });
  assert.equal(result._id, "demo-cafe");
  const url = new URL(request);
  assert.equal(url.searchParams.get("perspective"), "published");
  assert.match(url.searchParams.get("query")!, /_id == "demo-cafe"/);
  assert.equal(request.includes(env.SANITY_WRITE_TOKEN), false);
  await assert.rejects(
    loadContent(configured, async () =>
      Response.json({
        result: { ...structuredClone(demoContent), _id: "drafts.demo-cafe" },
      }),
    ),
    /identity/,
  );
});

test("public page modules have no visitor persistence or CMS write credential", async () => {
  const sources = await Promise.all(
    ["../src/scripts/booking.ts", "../src/lib/content.ts"].map((path) =>
      readFile(new URL(path, import.meta.url), "utf8"),
    ),
  );
  for (const source of sources) {
    assert.doesNotMatch(
      source,
      /SANITY_WRITE_TOKEN|localStorage|sessionStorage|document\.cookie|fetch\([^)]*mutate/,
    );
  }
});
