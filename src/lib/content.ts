import { demoContent } from "../data/demo.ts";
import { isDate, validRule } from "./availability.ts";
import type { CafeContent, DemoImage } from "./types.ts";

export const API_VERSION = "2025-02-19";
export const DEMO_ID = "demo-cafe";

function requireCondition(
  condition: unknown,
  field: string,
): asserts condition {
  if (!condition) throw new Error(`Invalid demo content: ${field}`);
}

function text(value: unknown, max = 2000): value is string {
  return (
    typeof value === "string" && value.trim().length > 0 && value.length <= max
  );
}

const imagePattern =
  /^image-([a-zA-Z0-9]+)-(\d+)x(\d+)-(jpg|jpeg|png|webp|avif)$/;

export function validateContent(value: unknown): CafeContent {
  requireCondition(value && typeof value === "object", "document");
  const c = value as CafeContent;
  requireCondition(c._id === DEMO_ID && c._type === "cafeDemo", "identity");
  for (const field of [
    "name",
    "tagline",
    "homeTitle",
    "homeIntro",
    "storyTitle",
    "storyBody",
    "menuIntro",
    "eventsTitle",
    "eventsIntro",
    "reservationsIntro",
  ] as const) {
    requireCondition(text(c[field]), field);
  }
  requireCondition(
    c.contact &&
      ["location", "detail", "hoursNote"].every((field) =>
        text(c.contact[field as keyof typeof c.contact]),
      ),
    "contact",
  );
  requireCondition(
    typeof c.contact.whatsapp === "string" && c.contact.whatsapp.length <= 30,
    "contact.whatsapp",
  );
  for (const field of [
    "categories",
    "products",
    "reviews",
    "groupFeatures",
  ] as const) {
    requireCondition(Array.isArray(c[field]) && c[field].length <= 100, field);
    const keys = c[field].map((item) => item?._key);
    requireCondition(
      keys.every(
        (key) => typeof key === "string" && /^[a-z0-9_-]{1,64}$/.test(key),
      ) && new Set(keys).size === keys.length,
      `${field}.keys`,
    );
  }
  requireCondition(
    c.categories.length > 0 &&
      c.categories.every((item) => text(item.title) && text(item.description)),
    "categories",
  );
  const categories = new Set(c.categories.map((item) => item._key));
  requireCondition(
    c.products.length > 0 &&
      c.products.every(
        (item) =>
          categories.has(item.category) &&
          text(item.name) &&
          text(item.description) &&
          Number.isInteger(item.price) &&
          item.price >= 0 &&
          item.price <= 1000000,
      ),
    "products",
  );
  requireCondition(
    c.reviews.every((item) => text(item.quote, 500)),
    "reviews",
  );
  requireCondition(
    c.groupFeatures.every((item) => text(item.title) && text(item.description)),
    "groupFeatures",
  );
  for (const image of [c.heroImage, ...c.products.map((item) => item.image)]) {
    if (image)
      requireCondition(
        text(image.alt, 200) && imagePattern.test(image.asset?._ref ?? ""),
        "image",
      );
  }
  const a = c.availability;
  requireCondition(
    a &&
      Number.isInteger(a.horizonDays) &&
      a.horizonDays >= 1 &&
      a.horizonDays <= 180,
    "availability.horizonDays",
  );
  requireCondition(
    Array.isArray(a.weekly) &&
      a.weekly.length <= 7 &&
      a.weekly.every(
        (rule) =>
          rule &&
          validRule(rule) &&
          Number.isInteger(rule.weekday) &&
          rule.weekday >= 0 &&
          rule.weekday <= 6,
      ),
    "availability.weekly",
  );
  requireCondition(
    new Set(a.weekly.map((rule) => rule.weekday)).size === a.weekly.length,
    "availability.weekly.unique",
  );
  requireCondition(
    Array.isArray(a.closedDates) &&
      a.closedDates.length <= 366 &&
      a.closedDates.every((date) => typeof date === "string" && isDate(date)),
    "availability.closedDates",
  );
  requireCondition(
    Array.isArray(a.exceptions) &&
      a.exceptions.length <= 366 &&
      a.exceptions.every(
        (rule) =>
          rule &&
          typeof rule.date === "string" &&
          isDate(rule.date) &&
          typeof rule.closed === "boolean" &&
          (rule.closed || validRule(rule)),
      ),
    "availability.exceptions",
  );
  requireCondition(
    new Set(a.exceptions.map((rule) => rule.date)).size === a.exceptions.length,
    "availability.exceptions.unique",
  );
  return c;
}

export function sanityTarget(env: Record<string, string | undefined>) {
  const project = env.SANITY_PROJECT_ID;
  const dataset = env.SANITY_DATASET;
  if (
    !project ||
    !/^[a-z0-9]{3,64}$/.test(project) ||
    !dataset ||
    !/^[a-z0-9][a-z0-9_-]{0,63}$/.test(dataset)
  ) {
    throw new Error(
      "Configure valid public Sanity project and dataset identifiers.",
    );
  }
  return { project, dataset };
}

export async function loadContent(
  env: Record<string, string | undefined> = {},
  fetcher: typeof fetch = fetch,
): Promise<CafeContent> {
  const source = env.CONTENT_SOURCE || "demo";
  if (source === "demo") return validateContent(structuredClone(demoContent));
  if (source !== "sanity")
    throw new Error("CONTENT_SOURCE must be demo or sanity.");
  const { project, dataset } = sanityTarget(env);
  const query = `*[_type == "cafeDemo" && _id == "${DEMO_ID}"][0]{_id,_type,name,tagline,homeTitle,homeIntro,storyTitle,storyBody,menuIntro,eventsTitle,eventsIntro,reservationsIntro,heroImage,contact{...,"whatsapp":coalesce(whatsapp,"")},categories[]{"_key":coalesce(code,_key),title,description},products,"reviews":coalesce(reviews,[]),"groupFeatures":coalesce(groupFeatures,[]),availability}`;
  const url = new URL(
    `https://${project}.api.sanity.io/v${API_VERSION}/data/query/${dataset}`,
  );
  url.searchParams.set("query", query);
  url.searchParams.set("perspective", "published");
  const response = await fetcher(url, { signal: AbortSignal.timeout(15000) });
  if (!response.ok)
    throw new Error(
      `Public Sanity content unavailable (HTTP ${response.status}).`,
    );
  const data = await response.json();
  return validateContent(data.result);
}

let content: Promise<CafeContent> | undefined;
export function getContent(): Promise<CafeContent> {
  return (content ??= loadContent(import.meta.env));
}

export function imageUrl(
  image: DemoImage | undefined,
  width: number,
): string | undefined {
  if (!image) return undefined;
  const match = imagePattern.exec(image.asset._ref);
  if (!match) return undefined;
  const { project, dataset } = sanityTarget(import.meta.env);
  return `https://cdn.sanity.io/images/${project}/${dataset}/${match[1]}-${match[2]}x${match[3]}.${match[4]}?w=${width}&auto=format&fit=crop`;
}
