import { test } from "node:test";
import assert from "node:assert/strict";
import { demoContent } from "../src/data/demo.ts";
import { loadContent, validateContent } from "../src/lib/content.ts";

test("local mode returns the validated fictional seed with no recipient or network", async () => {
  const content = await loadContent({}, async () => {
    throw new Error("Unexpected network");
  });
  assert.deepEqual(content, demoContent);
  assert.equal(content.contact.whatsapp, "");
});

test("configured Sanity queries only the published singleton without authentication", async () => {
  const published = structuredClone(demoContent);
  published.homeTitle = "Published demonstration title";
  let requested = "";
  const fetcher: typeof fetch = async (input, init) => {
    requested = String(input);
    assert.equal(new Headers(init?.headers).has("Authorization"), false);
    return Response.json({ result: published });
  };
  const result = await loadContent(
    {
      CONTENT_SOURCE: "sanity",
      SANITY_PROJECT_ID: "demotest",
      SANITY_DATASET: "production",
    },
    fetcher,
  );
  const url = new URL(requested);
  assert.equal(url.hostname, "demotest.api.sanity.io");
  assert.equal(url.searchParams.get("perspective"), "published");
  assert.ok(url.searchParams.get("query")!.includes("demo.cafe"));
  assert.equal(result.homeTitle, published.homeTitle);
});

test("configured CMS failures never silently fall back to stale local content", async () => {
  await assert.rejects(loadContent({ CONTENT_SOURCE: "other" }));
  await assert.rejects(loadContent({ CONTENT_SOURCE: "sanity" }));
  await assert.rejects(
    loadContent(
      {
        CONTENT_SOURCE: "sanity",
        SANITY_PROJECT_ID: "demotest",
        SANITY_DATASET: "production",
      },
      async () => new Response("", { status: 403 }),
    ),
  );
});

test("the public content contract rejects malformed calendars and broken category links", () => {
  assert.deepEqual(validateContent(demoContent), demoContent);
  const broken = structuredClone(demoContent);
  broken.availability.weekly[0]!.interval = 0;
  assert.throws(() => validateContent(broken));
  const badCategory = structuredClone(demoContent);
  badCategory.products[0]!.category = "missing";
  assert.throws(() => validateContent(badCategory));
});
