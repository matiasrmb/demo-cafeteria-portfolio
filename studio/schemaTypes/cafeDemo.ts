import { defineArrayMember, defineField, defineType } from "sanity";
import { validWhatsAppNumber } from "../../src/lib/availability";
import { DEMO_ID, validateContent } from "../../src/lib/content";

const shortText = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: "string",
    validation: (rule) => rule.required().max(2000),
  });
const paragraph = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: "text",
    rows: 3,
    validation: (rule) => rule.required().max(2000),
  });
const numberField = (
  name: string,
  title: string,
  min: number,
  max: number,
  required = true,
) =>
  defineField({
    name,
    title,
    type: "number",
    validation: (rule) =>
      required
        ? rule.required().integer().min(min).max(max)
        : rule.integer().min(min).max(max),
  });
const imageField = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: "image",
    options: {
      hotspot: true,
      accept: "image/jpeg,image/png,image/webp,image/avif",
    },
    description:
      "Only use original or properly licensed illustrative images. No real business attribution.",
    fields: [
      defineField({
        name: "alt",
        title: "Alternative text",
        type: "string",
        validation: (rule) => rule.required().max(200),
      }),
    ],
  });
function hoursFields(required = true) {
  return [
    ...["opens", "closes"].map((name) =>
      defineField({
        name,
        title: name === "opens" ? "Opens (HH:mm)" : "Closes (HH:mm)",
        type: "string",
        validation: (rule) => {
          const format = rule.regex(/^([01]\d|2[0-3]):[0-5]\d$/, {
            name: "24-hour time",
          });
          return required ? format.required() : format;
        },
      }),
    ),
    numberField("interval", "Slot interval in minutes", 15, 120, required),
    numberField("tableCapacity", "Example table capacity", 1, 20, required),
    numberField(
      "eventCapacity",
      "Example group/event capacity",
      1,
      80,
      required,
    ),
  ];
}

export const cafeDemo = defineType({
  name: "cafeDemo",
  title: "Fictional café content",
  type: "document",
  description:
    "PUBLIC fictional content only. Never store visitor requests, tokens or credentials. The public site always labels this as a demonstration.",
  groups: [
    { name: "pages", title: "Pages", default: true },
    { name: "menu", title: "Menu" },
    { name: "availability", title: "Availability" },
    { name: "contact", title: "Contact" },
  ],
  fields: [
    ...[
      ["name", "Fictional café name"],
      ["tagline", "Tagline"],
      ["homeTitle", "Home heading"],
      ["storyTitle", "Story heading"],
      ["eventsTitle", "Groups/events heading"],
    ].map(([name, title]) =>
      defineField({ ...shortText(name!, title!), group: "pages" }),
    ),
    ...[
      ["homeIntro", "Home introduction"],
      ["storyBody", "Story"],
      ["menuIntro", "Menu introduction"],
      ["eventsIntro", "Groups/events introduction"],
      ["reservationsIntro", "Request introduction"],
    ].map(([name, title]) =>
      defineField({ ...paragraph(name!, title!), group: "pages" }),
    ),
    defineField({
      ...imageField("heroImage", "Hero illustration"),
      group: "pages",
    }),
    defineField({
      name: "reviews",
      title: "Fictional opinions",
      type: "array",
      group: "pages",
      validation: (rule) => rule.max(6),
      of: [
        defineArrayMember({
          name: "demoReview",
          type: "object",
          fields: [paragraph("quote", "Fictional quote")],
          preview: { select: { title: "quote" } },
        }),
      ],
    }),
    defineField({
      name: "groupFeatures",
      title: "Group/event sections",
      type: "array",
      group: "pages",
      validation: (rule) => rule.max(6),
      of: [
        defineArrayMember({
          name: "groupFeature",
          type: "object",
          fields: [
            shortText("title", "Heading"),
            paragraph("description", "Description"),
          ],
        }),
      ],
    }),
    defineField({
      name: "categories",
      title: "Menu categories",
      type: "array",
      group: "menu",
      validation: (rule) => rule.required().min(1).max(12),
      of: [
        defineArrayMember({
          name: "menuCategory",
          type: "object",
          fields: [
            defineField({
              name: "code",
              title: "Stable category code",
              type: "string",
              description:
                "Use this same code in products. Keep it stable after adding products.",
              validation: (rule) => rule.required().regex(/^[a-z0-9_-]{1,64}$/),
            }),
            shortText("title", "Category name"),
            paragraph("description", "Description"),
          ],
          preview: { select: { title: "title", subtitle: "code" } },
        }),
      ],
    }),
    defineField({
      name: "products",
      title: "Example products",
      type: "array",
      group: "menu",
      validation: (rule) => rule.required().min(1).max(100),
      of: [
        defineArrayMember({
          name: "menuProduct",
          type: "object",
          fields: [
            shortText("name", "Product name"),
            shortText("category", "Category code"),
            paragraph("description", "Description"),
            numberField(
              "price",
              "Fictional price in CLP (whole pesos)",
              0,
              1000000,
            ),
            imageField("image", "Product illustration"),
          ],
          preview: {
            select: { title: "name", subtitle: "category", media: "image" },
          },
        }),
      ],
    }),
    defineField({
      name: "contact",
      title: "Demonstration contact",
      type: "object",
      group: "contact",
      fields: [
        paragraph("location", "Referential location (no real establishment)"),
        paragraph("detail", "Demonstration contact text"),
        paragraph("hoursNote", "Opening-hours note"),
        defineField({
          name: "whatsapp",
          title: "Authorized WhatsApp recipient",
          type: "string",
          description:
            "Optional. Public international digits only, no +, spaces or punctuation. Never use an invented recipient. This public value will be present in the site.",
          validation: (rule) =>
            rule.custom(
              (value) =>
                !value ||
                validWhatsAppNumber(value) ||
                "Enter a valid authorized international number using digits only, or leave blank.",
            ),
        }),
      ],
    }),
    defineField({
      name: "availability",
      title: "Illustrative calendar (America/Santiago)",
      type: "object",
      group: "availability",
      fields: [
        numberField("horizonDays", "Maximum days ahead", 1, 180),
        defineField({
          name: "weekly",
          title: "Weekly hours",
          type: "array",
          description:
            "One rule per weekday. Omitted days are closed. No overnight ranges.",
          validation: (rule) => rule.required().max(7),
          of: [
            defineArrayMember({
              name: "weeklyRule",
              type: "object",
              fields: [
                defineField({
                  name: "weekday",
                  title: "Weekday",
                  type: "number",
                  options: {
                    list: [
                      "Sunday",
                      "Monday",
                      "Tuesday",
                      "Wednesday",
                      "Thursday",
                      "Friday",
                      "Saturday",
                    ].map((title, value) => ({ title, value })),
                  },
                  validation: (rule) => rule.required(),
                }),
                ...hoursFields(),
              ],
              preview: {
                select: { day: "weekday", opens: "opens", closes: "closes" },
                prepare: ({ day, opens, closes }) => ({
                  title: `${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][day]} · ${opens}–${closes}`,
                }),
              },
            }),
          ],
        }),
        defineField({
          name: "closedDates",
          title: "Closed dates",
          type: "array",
          description: "These override every weekly rule and exception.",
          validation: (rule) => rule.required().max(366).unique(),
          of: [defineArrayMember({ type: "date" })],
        }),
        defineField({
          name: "exceptions",
          title: "Date exceptions",
          type: "array",
          description:
            "An exception replaces the entire weekly rule. If open, fill every time/capacity field.",
          validation: (rule) => rule.required().max(366),
          of: [
            defineArrayMember({
              name: "dateException",
              type: "object",
              fields: [
                defineField({
                  name: "date",
                  title: "Date",
                  type: "date",
                  validation: (rule) => rule.required(),
                }),
                defineField({
                  name: "closed",
                  title: "Closed all day",
                  type: "boolean",
                  initialValue: false,
                  validation: (rule) => rule.required(),
                }),
                ...hoursFields(false),
              ],
              preview: { select: { title: "date", subtitle: "opens" } },
            }),
          ],
        }),
      ],
    }),
  ],
  validation: (rule) =>
    rule.custom((value) => {
      if (!value) return true;
      const doc = value as Record<string, unknown> & {
        categories?: { _key?: string; code?: string }[];
        contact?: Record<string, unknown>;
      };
      try {
        validateContent({
          ...doc,
          _id: DEMO_ID,
          contact: { ...doc.contact, whatsapp: doc.contact?.whatsapp ?? "" },
          reviews: doc.reviews ?? [],
          groupFeatures: doc.groupFeatures ?? [],
          categories: doc.categories?.map((item) => ({
            ...item,
            _key: item.code || item._key,
          })),
        });
        return true;
      } catch (error) {
        return error instanceof Error
          ? error.message
          : "Complete all required demo fields.";
      }
    }),
  preview: {
    select: { title: "name" },
    prepare: ({ title }) => ({
      title,
      subtitle: "Public fictional content · no visitor records",
    }),
  },
});
