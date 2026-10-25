import { test } from "node:test";
import assert from "node:assert/strict";
import { demoContent } from "../src/data/demo.ts";
import {
  datesInMonth,
  getSlots,
  validateRequest,
  whatsappLink,
} from "../src/lib/availability.ts";

const now = new Date("2026-10-26T11:00:00Z");
const config = demoContent.availability;
const request = {
  name: "Persona de prueba & compañía",
  date: "2026-10-27",
  time: "10:00",
  people: 2,
  type: "table",
};
// NANP reserved fictional range; test-only, never a default destination.
const reservedTestNumber = "12025550123";

test("calendar uses configured intervals and different example capacities", () => {
  assert.deepEqual(
    getSlots(config, "2026-10-27", "table", 2, now).slice(0, 3),
    ["09:00", "09:30", "10:00"],
  );
  assert.deepEqual(getSlots(config, "2026-10-27", "table", 7, now), []);
  assert.ok(getSlots(config, "2026-10-27", "event", 7, now).includes("10:00"));
});

test("closed dates override exceptions; exceptions override the weekly schedule", () => {
  const changed = structuredClone(config);
  changed.exceptions = [
    {
      date: "2026-10-27",
      closed: false,
      opens: "14:00",
      closes: "16:00",
      interval: 60,
      tableCapacity: 4,
      eventCapacity: 12,
    },
  ];
  assert.deepEqual(getSlots(changed, "2026-10-27", "table", 4, now), [
    "14:00",
    "15:00",
  ]);
  changed.closedDates = ["2026-10-27"];
  assert.deepEqual(getSlots(changed, "2026-10-27", "table", 4, now), []);
  changed.closedDates = [];
  changed.exceptions[0]!.closed = true;
  assert.deepEqual(getSlots(changed, "2026-10-27", "event", 4, now), []);
  assert.deepEqual(getSlots(config, "2026-11-01", "table", 2, now), []);
});

test("calendar rejects invalid dates, past times and invalid quantities", () => {
  for (const date of [
    "2026-02-30",
    "2026-10-25",
    "2030-01-01",
    "",
    "2026-13-01",
  ]) {
    assert.deepEqual(getSlots(config, date, "table", 2, now), []);
  }
  for (const people of [0, -1, 1.5, NaN, Infinity]) {
    assert.deepEqual(getSlots(config, "2026-10-27", "table", people, now), []);
  }
  assert.deepEqual(getSlots(config, "2026-10-27", "unknown", 2, now), []);
  const later = new Date("2026-10-27T17:15:00Z");
  assert.ok(
    getSlots(config, "2026-10-27", "table", 2, later).every(
      (slot) => slot > "14:15",
    ),
  );
  assert.equal(datesInMonth("2028-02").length, 29);
  assert.equal(datesInMonth("2026-13").length, 0);
});

test("required request fields and configured slots are validated without mutation", () => {
  const before = JSON.stringify(config);
  assert.deepEqual(validateRequest(request, config, now), {});
  for (const field of ["name", "date", "time", "people", "type"]) {
    assert.ok(
      Object.keys(validateRequest({ ...request, [field]: "" }, config, now))
        .length > 0,
      field,
    );
  }
  assert.ok(validateRequest({ ...request, time: "03:00" }, config, now).time);
  assert.ok(validateRequest({ ...request, people: 2.5 }, config, now).people);
  assert.ok(
    validateRequest({ ...request, type: "event", people: 30 }, config, now)
      .time,
  );
  assert.deepEqual(
    validateRequest({ ...request, type: "event", people: 12 }, config, now),
    {},
  );
  assert.equal(JSON.stringify(config), before);
});

test("WhatsApp requires a valid destination and validated request", () => {
  for (const number of [
    "",
    "+12025550123",
    "56 123",
    "0000000000",
    "abc",
    "999999999999999",
  ]) {
    assert.equal(whatsappLink(number, request, config, now), null);
  }
  assert.equal(
    whatsappLink(reservedTestNumber, { ...request, name: "" }, config, now),
    null,
  );
  const link = new URL(whatsappLink(reservedTestNumber, request, config, now)!);
  assert.equal(link.origin, "https://wa.me");
  assert.equal(link.pathname, `/${reservedTestNumber}`);
  const message = link.searchParams.get("text")!;
  for (const value of [
    request.name,
    request.date,
    request.time,
    "2",
    "mesa",
    "demostración",
    "no confirma",
  ]) {
    assert.ok(message.includes(value), value);
  }
  assert.ok(
    whatsappLink(
      reservedTestNumber,
      { ...request, type: "event" },
      config,
      now,
    )!.includes("grupo"),
  );
});
